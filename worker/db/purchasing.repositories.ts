import type { Database } from './repositories';
import type { RequestContext } from '../models/context';
import { runStatement } from './repositories';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type PurchaseRequestStatus = 'pending' | 'bought' | 'postponed';
export type PurchaseReason =
  'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste';

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
// Generate replenishment list (the core logic)
// Detects products needing reorder and generates reasons
// ─────────────────────────────────────────────
export async function generateReplenishmentNeeds(
  db: Database,
  ctx: RequestContext,
  storeId: number,
): Promise<any[]> {
  const needs: any[] = [];

  // 1. Stock negativo o por debajo del mínimo (from inventory table)
  const lowStock = (await runStatement(
    db,
    `SELECT i.product_id AS productId, p.name AS productName,
            i.quantity, i.available_quantity AS availableQuantity,
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

    needs.push({
      productId: row.productId,
      productName: row.productName,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reason,
      reasonLabel: isNegative ? 'Stock negativo' : 'Por debajo del mínimo',
      suggestedQuantity: suggestedQty,
      priority: isNegative ? 1 : 2,
    });
  }

  // 2. Alto consumo últimos 7 días (materias primas consumidas)
  const highConsumption = (await runStatement(
    db,
    `SELECT it.product_id AS productId, p.name AS productName,
            SUM(ABS(it.quantity_change)) AS consumed7d,
            i.available_quantity AS availableQuantity,
            i.min_stock AS minStock, i.max_stock AS maxStock
     FROM inventory_transactions it
     JOIN products p ON it.product_id = p.id
     JOIN inventory i ON i.product_id = it.product_id AND i.store_id = it.store_id
     WHERE it.company_id = ? AND it.store_id = ?
       AND it.type = 'out' AND it.reason = 'production'
       AND it.created_at >= DATE('now', '-7 days')
     GROUP BY it.product_id, p.name, i.available_quantity, i.min_stock, i.max_stock
     HAVING consumed7d > 0 AND i.available_quantity < (consumed7d * 0.5)
     ORDER BY consumed7d DESC
     LIMIT 10`,
    [ctx.companyId, storeId],
    'all',
  )) as any[];

  const existingProductIds = new Set(needs.map((n) => n.productId));
  for (const row of highConsumption || []) {
    if (existingProductIds.has(row.productId)) continue; // Already in list
    needs.push({
      productId: row.productId,
      productName: row.productName,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reason: 'high_consumption' as PurchaseReason,
      reasonLabel: `Consumo elevado: ${row.consumed7d} unid. en 7 días`,
      suggestedQuantity: Math.ceil(row.consumed7d * 1.5),
      priority: 3,
    });
    existingProductIds.add(row.productId);
  }

  // 3. Merma reciente (últimas 48h)
  const recentWaste = (await runStatement(
    db,
    `SELECT it.product_id AS productId, p.name AS productName,
            SUM(ABS(it.quantity_change)) AS wasted48h,
            i.available_quantity AS availableQuantity,
            i.min_stock AS minStock, i.max_stock AS maxStock
     FROM inventory_transactions it
     JOIN products p ON it.product_id = p.id
     JOIN inventory i ON i.product_id = it.product_id AND i.store_id = it.store_id
     WHERE it.company_id = ? AND it.store_id = ?
       AND it.type = 'out' AND it.reason IN ('breakage','caducity','theft')
       AND it.created_at >= DATETIME('now', '-48 hours')
     GROUP BY it.product_id, p.name, i.available_quantity, i.min_stock, i.max_stock
     HAVING wasted48h > 0
     ORDER BY wasted48h DESC
     LIMIT 10`,
    [ctx.companyId, storeId],
    'all',
  )) as any[];

  for (const row of recentWaste || []) {
    if (existingProductIds.has(row.productId)) continue;
    needs.push({
      productId: row.productId,
      productName: row.productName,
      currentStock: row.availableQuantity,
      minStock: row.minStock,
      maxStock: row.maxStock,
      reason: 'recent_waste' as PurchaseReason,
      reasonLabel: `Merma reciente: ${row.wasted48h} unid. en 48h`,
      suggestedQuantity: Math.ceil(row.wasted48h),
      priority: 4,
    });
    existingProductIds.add(row.productId);
  }

  return needs.sort((a, b) => a.priority - b.priority);
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
  // Upsert: if pending exists, update; otherwise create
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
       SET reason = ?, suggested_quantity = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reason, suggestedQuantity, existing.id],
    );
    return existing.id;
  }

  const result = (await runStatement(
    db,
    `INSERT INTO purchase_requests (company_id, store_id, product_id, reason, suggested_quantity, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
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
            i.available_quantity AS currentStock, i.min_stock AS minStock
     FROM purchase_requests pr
     JOIN products p ON pr.product_id = p.id
     LEFT JOIN inventory i ON i.product_id = pr.product_id AND i.store_id = pr.store_id AND i.company_id = pr.company_id
     WHERE pr.company_id = ? AND pr.store_id = ?
     ORDER BY pr.status ASC, pr.created_at DESC`,
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
