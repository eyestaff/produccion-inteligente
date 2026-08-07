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
  hasRecipe: boolean;
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
          AND type = 'out' AND reason = 'production'
          AND created_at >= DATE('now', '-7 days')
      ), 0) AS consumption7d,
      COALESCE((
        SELECT SUM(ABS(quantity_change))
        FROM inventory_transactions
        WHERE product_id = p.id AND store_id = ? AND company_id = ?
          AND type = 'out' AND reason = 'production'
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
      EXISTS(
        SELECT 1 FROM recipes WHERE product_id = p.id AND status = 'active'
      ) AS hasRecipe
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
