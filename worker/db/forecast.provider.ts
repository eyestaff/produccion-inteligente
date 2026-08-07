import type { Database } from './repositories';
import type { RequestContext } from '../models/context';
import { runStatement } from './repositories';

export interface ProductForecastContext {
  productId: number;
  productName: string;
  storeId: number;
  availableQuantity: number;
  minStock: number;
  maxStock: number;
  consumption7d: number;
  consumption30d: number;
  recentWaste: number;
  pendingProduction: number;
  pendingPurchases: number;
  type: string;
}

export async function getForecastContext(
  db: Database,
  ctx: RequestContext,
  storeId: number,
): Promise<ProductForecastContext[]> {
  // Aggregate data for each product in the store
  const query = `
    SELECT
      p.id AS productId,
      p.name AS productName,
      i.available_quantity AS availableQuantity,
      i.min_stock AS minStock,
      i.max_stock AS maxStock,
      COALESCE((
        SELECT SUM(ABS(quantity_change))
        FROM inventory_transactions
        WHERE product_id = p.id AND store_id = ? AND company_id = ?
          AND type = 'out' AND (
            (p.type = 'raw_material' AND reason = 'production') OR
            (p.type != 'raw_material' AND reason = 'sales')
          )
          AND created_at >= DATE('now', '-7 days')
      ), 0) AS consumption7d,
      COALESCE((
        SELECT SUM(ABS(quantity_change))
        FROM inventory_transactions
        WHERE product_id = p.id AND store_id = ? AND company_id = ?
          AND type = 'out' AND (
            (p.type = 'raw_material' AND reason = 'production') OR
            (p.type != 'raw_material' AND reason = 'sales')
          )
          AND created_at >= DATE('now', '-30 days')
      ), 0) AS consumption30d,
      COALESCE((
        SELECT SUM(ABS(quantity_change))
        FROM inventory_transactions
        WHERE product_id = p.id AND store_id = ? AND company_id = ?
          AND type = 'out' AND reason IN ('breakage','caducity','theft')
          AND created_at >= DATETIME('now', '-48 hours')
      ), 0) AS recentWaste,
      COALESCE((
        SELECT SUM(poi.quantity)
        FROM production_order_items poi
        JOIN production_orders po ON poi.production_order_id = po.id
        WHERE poi.product_id = p.id AND po.store_id = ? AND po.company_id = ?
          AND po.status IN ('planned', 'in_progress')
      ), 0) AS pendingProduction,
      COALESCE((
        SELECT SUM(suggested_quantity)
        FROM purchase_requests
        WHERE product_id = p.id AND store_id = ? AND company_id = ?
          AND status = 'pending'
      ), 0) AS pendingPurchases,
      p.type AS type
    FROM products p
    JOIN inventory i ON p.id = i.product_id AND i.store_id = ? AND i.company_id = ?
    WHERE p.company_id = ?
  `;

  const results = (await runStatement(
    db,
    query,
    [
      storeId,
      ctx.companyId, // for consumption7d
      storeId,
      ctx.companyId, // for consumption30d
      storeId,
      ctx.companyId, // for recentWaste
      storeId,
      ctx.companyId, // for pendingProduction
      storeId,
      ctx.companyId, // for pendingPurchases
      storeId,
      ctx.companyId, // for inventory join
      ctx.companyId, // for products where clause
    ],
    'all',
  )) as any[];

  return results || [];
}

export async function saveForecast(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  targetDate: string,
  items: {
    productId: number;
    historicalBase: number;
    suggestedQuantity: number;
    adjustedQuantity: number;
  }[],
) {
  const companyId = ctx.companyId;

  const forecastResult = await runStatement(
    db,
    'INSERT INTO forecasts (company_id, store_id, target_date, status) VALUES (?, ?, ?, ?)',
    [companyId, storeId, targetDate, 'approved'],
  );

  const forecastId =
    typeof forecastResult === 'object' && forecastResult && 'lastInsertRowid' in forecastResult
      ? (forecastResult as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;

  if (!forecastId) throw new Error('No se pudo crear el forecast');

  const statements = items.map((item) => ({
    query: `INSERT INTO forecast_items (
      company_id, forecast_id, product_id, historical_base, 
      suggested_quantity, adjusted_quantity
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    params: [
      companyId,
      forecastId,
      item.productId,
      item.historicalBase,
      item.suggestedQuantity,
      item.adjustedQuantity,
    ],
  }));

  // En sqlite real usamos loop o un helper `runBatch` si existe,
  // pero aquí por simplicidad los ejecutamos uno a uno
  for (const stmt of statements) {
    await runStatement(db, stmt.query, stmt.params);
  }

  return forecastId;
}

export async function getForecastHistory(db: Database, ctx: RequestContext, storeId: number) {
  return runStatement(
    db,
    `SELECT 
      f.id, f.target_date AS targetDate, f.status, f.created_at AS createdAt,
      fi.product_id AS productId, p.name AS productName,
      fi.suggested_quantity AS suggestedQuantity,
      fi.adjusted_quantity AS adjustedQuantity,
      fi.actual_consumption AS actualConsumption,
      fi.deviation_percentage AS deviationPercentage
    FROM forecasts f
    JOIN forecast_items fi ON f.id = fi.forecast_id
    JOIN products p ON fi.product_id = p.id
    WHERE f.company_id = ? AND f.store_id = ?
    ORDER BY f.target_date DESC, f.id DESC`,
    [ctx.companyId, storeId],
    'all',
  );
}
