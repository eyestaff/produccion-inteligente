import type { Database } from './repositories';
import type { RequestContext } from '../models/context';
import { runStatement } from './repositories';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type PurchaseRequestStatus = 'pending' | 'bought' | 'postponed' | 'discarded';
export type PurchaseReason =
  'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste';

export const DISCARD_REASONS = [
  'Ya tengo suficiente stock',
  'El proveedor no tiene disponibilidad',
  'Producto fuera de temporada',
  'Precio no es conveniente ahora',
  'Error en la detección',
  'Otro motivo',
] as const;

// ─────────────────────────────────────────────
// Set min/max stock for a product in a store
// ─────────────────────────────────────────────
export async function setInventoryLevels(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
  minStock: number,
  maxStock: number,
) {
  await runStatement(
    db,
    `UPDATE inventory SET min_stock = ?, max_stock = ?
     WHERE company_id = ? AND store_id = ? AND product_id = ?`,
    [minStock, maxStock, ctx.companyId, storeId, productId],
  );
}

// ─────────────────────────────────────────────
// Fetch enriched context for a single product
// (consumption 7d, recent waste 48h, reserved)
// ─────────────────────────────────────────────
async function getProductEnrichment(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
) {
  // Consumption last 7 days
  const consumption = (await runStatement(
    db,
    `SELECT COALESCE(SUM(ABS(quantity_change)),0) AS consumed7d
     FROM inventory_transactions
     WHERE company_id = ? AND store_id = ? AND product_id = ?
       AND type = 'out' AND reason = 'production'
       AND created_at >= DATE('now', '-7 days')`,
    [ctx.companyId, storeId, productId],
    'get',
  )) as any;

  // Recent waste 48h
  const waste = (await runStatement(
    db,
    `SELECT COALESCE(SUM(ABS(quantity_change)),0) AS wasted48h,
            GROUP_CONCAT(DISTINCT reason) AS wasteReasons
     FROM inventory_transactions
     WHERE company_id = ? AND store_id = ? AND product_id = ?
       AND type = 'out' AND reason IN ('breakage','caducity','theft')
       AND created_at >= DATETIME('now', '-48 hours')`,
    [ctx.companyId, storeId, productId],
    'get',
  )) as any;

  return {
    consumption7d: consumption?.consumed7d || 0,
    recentWaste48h: waste?.wasted48h || 0,
    wasteReasons: waste?.wasteReasons || null,
  };
}

// ─────────────────────────────────────────────
// Generate replenishment list (core — algorithm unchanged)
// Now enriched with full context data per product
// ─────────────────────────────────────────────
export async function generateReplenishmentNeeds(
  db: Database,
  ctx: RequestContext,
  storeId: number,
): Promise<any[]> {
  const needs: any[] = [];

  // 1. Stock negativo o por debajo del mínimo
  const lowStock = (await runStatement(
    db,
    `SELECT i.product_id AS productId, p.name AS productName,
            i.quantity AS physicalStock,
            i.available_quantity AS availableQuantity,
            i.min_stock AS minStock, i.max_stock AS maxStock,
            i.reserved_quantity AS reservedQuantity
     FROM inventory i
     JOIN products p ON i.product_id = p.id
     WHERE i.company_id = ? AND i.store_id = ?
       AND (i.available_quantity < 0 OR (i.min_stock > 0 AND i.available_quantity < i.min_stock))
     ORDER BY i.available_quantity ASC`,
    [ctx.companyId, storeId],
    'all',
  )) as any[];

  for (const row of lowStock || []) {
    const isNegative = row.availableQuantity < 0;
    const reason: PurchaseReason = isNegative ? 'negative_stock' : 'below_minimum';
    const target = row.maxStock > 0 ? row.maxStock : row.minStock > 0 ? row.minStock * 2 : 10;
    const suggestedQty = Math.max(0, target - row.availableQuantity);
    const enrichment = await getProductEnrichment(db, ctx, storeId, row.productId);
    const dailyRate = enrichment.consumption7d / 7;
    const daysOfStock = dailyRate > 0 ? Math.floor(row.availableQuantity / dailyRate) : null;

    needs.push({
      productId: row.productId,
      productName: row.productName,
      physicalStock: row.physicalStock,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reservedQuantity: row.reservedQuantity,
      reason,
      reasonLabel: isNegative ? 'Stock negativo' : 'Por debajo del mínimo',
      suggestedQuantity: suggestedQty,
      targetStock: target,
      priority: isNegative ? 1 : 2,
      consumption7d: enrichment.consumption7d,
      recentWaste48h: enrichment.recentWaste48h,
      wasteReasons: enrichment.wasteReasons,
      daysOfStockRemaining: daysOfStock !== null && daysOfStock < 0 ? 0 : daysOfStock,
      impactIfNotBought: buildImpactStatement(
        row.availableQuantity,
        suggestedQty,
        target,
        daysOfStock,
        dailyRate,
      ),
    });
  }

  // 2. Alto consumo últimos 7 días
  const highConsumption = (await runStatement(
    db,
    `SELECT it.product_id AS productId, p.name AS productName,
            SUM(ABS(it.quantity_change)) AS consumed7d,
            i.available_quantity AS availableQuantity,
            i.quantity AS physicalStock,
            i.min_stock AS minStock, i.max_stock AS maxStock,
            i.reserved_quantity AS reservedQuantity
     FROM inventory_transactions it
     JOIN products p ON it.product_id = p.id
     JOIN inventory i ON i.product_id = it.product_id AND i.store_id = it.store_id
     WHERE it.company_id = ? AND it.store_id = ?
       AND it.type = 'out' AND it.reason = 'production'
       AND it.created_at >= DATE('now', '-7 days')
     GROUP BY it.product_id, p.name, i.available_quantity, i.quantity, i.min_stock, i.max_stock, i.reserved_quantity
     HAVING consumed7d > 0 AND i.available_quantity < (consumed7d * 0.5)
     ORDER BY consumed7d DESC
     LIMIT 10`,
    [ctx.companyId, storeId],
    'all',
  )) as any[];

  const existingProductIds = new Set(needs.map((n) => n.productId));
  for (const row of highConsumption || []) {
    if (existingProductIds.has(row.productId)) continue;
    const suggestedQty = Math.ceil(row.consumed7d * 1.5);
    const target = row.maxStock > 0 ? row.maxStock : suggestedQty;
    const dailyRate = row.consumed7d / 7;
    const daysOfStock = dailyRate > 0 ? Math.floor(row.availableQuantity / dailyRate) : null;
    const waste = await getProductEnrichment(db, ctx, storeId, row.productId);

    needs.push({
      productId: row.productId,
      productName: row.productName,
      physicalStock: row.physicalStock,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reservedQuantity: row.reservedQuantity,
      reason: 'high_consumption' as PurchaseReason,
      reasonLabel: `Consumo elevado`,
      suggestedQuantity: suggestedQty,
      targetStock: target,
      priority: 3,
      consumption7d: row.consumed7d,
      recentWaste48h: waste.recentWaste48h,
      wasteReasons: waste.wasteReasons,
      daysOfStockRemaining: daysOfStock !== null && daysOfStock < 0 ? 0 : daysOfStock,
      impactIfNotBought: buildImpactStatement(
        row.availableQuantity,
        suggestedQty,
        target,
        daysOfStock,
        dailyRate,
      ),
    });
    existingProductIds.add(row.productId);
  }

  // 3. Merma reciente (últimas 48h)
  const recentWaste = (await runStatement(
    db,
    `SELECT it.product_id AS productId, p.name AS productName,
            SUM(ABS(it.quantity_change)) AS wasted48h,
            GROUP_CONCAT(DISTINCT it.reason) AS wasteReasons,
            i.available_quantity AS availableQuantity,
            i.quantity AS physicalStock,
            i.min_stock AS minStock, i.max_stock AS maxStock,
            i.reserved_quantity AS reservedQuantity
     FROM inventory_transactions it
     JOIN products p ON it.product_id = p.id
     JOIN inventory i ON i.product_id = it.product_id AND i.store_id = it.store_id
     WHERE it.company_id = ? AND it.store_id = ?
       AND it.type = 'out' AND it.reason IN ('breakage','caducity','theft')
       AND it.created_at >= DATETIME('now', '-48 hours')
     GROUP BY it.product_id, p.name, i.available_quantity, i.quantity, i.min_stock, i.max_stock, i.reserved_quantity
     HAVING wasted48h > 0
     ORDER BY wasted48h DESC
     LIMIT 10`,
    [ctx.companyId, storeId],
    'all',
  )) as any[];

  for (const row of recentWaste || []) {
    if (existingProductIds.has(row.productId)) continue;
    const suggestedQty = Math.ceil(row.wasted48h);
    const target = row.maxStock > 0 ? row.maxStock : Math.max(row.minStock || 0, suggestedQty);
    const consumption = await getProductEnrichment(db, ctx, storeId, row.productId);
    const dailyRate = consumption.consumption7d / 7;
    const daysOfStock = dailyRate > 0 ? Math.floor(row.availableQuantity / dailyRate) : null;

    needs.push({
      productId: row.productId,
      productName: row.productName,
      physicalStock: row.physicalStock,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reservedQuantity: row.reservedQuantity,
      reason: 'recent_waste' as PurchaseReason,
      reasonLabel: `Merma reciente`,
      suggestedQuantity: suggestedQty,
      targetStock: target,
      priority: 4,
      consumption7d: consumption.consumption7d,
      recentWaste48h: row.wasted48h,
      wasteReasons: row.wasteReasons,
      daysOfStockRemaining: daysOfStock !== null && daysOfStock < 0 ? 0 : daysOfStock,
      impactIfNotBought: buildImpactStatement(
        row.availableQuantity,
        suggestedQty,
        target,
        daysOfStock,
        dailyRate,
      ),
    });
    existingProductIds.add(row.productId);
  }

  return needs.sort((a, b) => a.priority - b.priority);
}

// ─────────────────────────────────────────────
// Build human-readable impact statement
// ─────────────────────────────────────────────
function buildImpactStatement(
  currentStock: number,
  suggestedQty: number,
  target: number,
  daysRemaining: number | null,
  dailyRate: number,
): string {
  if (currentStock < 0) {
    return `Hay un déficit de ${Math.abs(currentStock)} unidades. Las órdenes de producción activas no pueden completarse. Reponer hasta ${target} unidades es urgente.`;
  }
  if (daysRemaining !== null && daysRemaining <= 1) {
    return `El stock actual se agotará hoy o mañana (consumo diario aprox. ${dailyRate.toFixed(0)} unidades). Sin reposición habrá rotura de stock inminente.`;
  }
  if (daysRemaining !== null && daysRemaining <= 3) {
    return `Con el ritmo actual de consumo, el stock se agotará en ${daysRemaining} días. Se recomienda reponer ${suggestedQty} unidades para alcanzar el objetivo de ${target}.`;
  }
  return `El nivel actual está por debajo del mínimo configurado. Reponer ${suggestedQty} unidades para asegurar continuidad operativa.`;
}

// ─────────────────────────────────────────────
// CRUD for purchase requests
// ─────────────────────────────────────────────
export async function upsertPurchaseRequest(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
  reason: PurchaseReason,
  suggestedQuantity: number,
) {
  const existing = (await runStatement(
    db,
    `SELECT id FROM purchase_requests
     WHERE company_id = ? AND store_id = ? AND product_id = ? AND status = 'pending'`,
    [ctx.companyId, storeId, productId],
    'get',
  )) as any;

  if (existing) {
    await runStatement(
      db,
      `UPDATE purchase_requests
       SET reason = ?, suggested_quantity = ?, updated_at = CURRENT_TIMESTAMP, accepted = 1
       WHERE id = ?`,
      [reason, suggestedQuantity, existing.id],
    );
    return existing.id;
  }

  const result = (await runStatement(
    db,
    `INSERT INTO purchase_requests (company_id, store_id, product_id, reason, suggested_quantity, status, accepted)
     VALUES (?, ?, ?, ?, ?, 'pending', 1)`,
    [ctx.companyId, storeId, productId, reason, suggestedQuantity],
  )) as any;

  return result?.lastInsertRowid;
}

export async function listPurchaseRequests(db: Database, ctx: RequestContext, storeId: number) {
  return runStatement(
    db,
    `SELECT pr.id, pr.product_id AS productId, p.name AS productName,
            pr.reason, pr.suggested_quantity AS suggestedQuantity,
            pr.status, pr.notes, pr.created_at AS createdAt, pr.updated_at AS updatedAt,
            pr.discarded_reason AS discardedReason, pr.discarded_at AS discardedAt,
            pr.accepted, pr.stockout_occurred AS stockoutOccurred,
            i.available_quantity AS currentStock, i.min_stock AS minStock, i.max_stock AS maxStock,
            i.reserved_quantity AS reservedQuantity
     FROM purchase_requests pr
     JOIN products p ON pr.product_id = p.id
     LEFT JOIN inventory i ON i.product_id = pr.product_id AND i.store_id = pr.store_id AND i.company_id = pr.company_id
     WHERE pr.company_id = ? AND pr.store_id = ?
     ORDER BY
       CASE pr.status WHEN 'pending' THEN 0 WHEN 'bought' THEN 1 WHEN 'postponed' THEN 2 ELSE 3 END ASC,
       pr.created_at DESC`,
    [ctx.companyId, storeId],
    'all',
  );
}

export async function updatePurchaseRequestStatus(
  db: Database,
  ctx: RequestContext,
  requestId: number,
  status: PurchaseRequestStatus,
  notes?: string,
) {
  await runStatement(
    db,
    `UPDATE purchase_requests
     SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND company_id = ?`,
    [status, notes ?? null, requestId, ctx.companyId],
  );
}

export async function discardPurchaseRequest(
  db: Database,
  ctx: RequestContext,
  requestId: number,
  discardedReason: string,
) {
  // accepted=0 means ignored — this trains the future Forecast model
  await runStatement(
    db,
    `UPDATE purchase_requests
     SET status = 'discarded',
         discarded_reason = ?,
         discarded_at = CURRENT_TIMESTAMP,
         discarded_by = ?,
         accepted = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND company_id = ?`,
    [discardedReason, ctx.userId ?? null, requestId, ctx.companyId],
  );
}
