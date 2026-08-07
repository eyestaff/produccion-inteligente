import type { Database } from './db';
import type { RequestContext } from '../models/context';
import { runStatement } from './repositories';

export async function createProductionOrder(
  db: Database,
  ctx: RequestContext,
  input: {
    storeId: number;
    businessLineId: number;
    targetQuantity: number;
  },
) {
  const result = await runStatement(
    db,
    'INSERT INTO production_orders (company_id, store_id, business_line_id, target_quantity, status) VALUES (?, ?, ?, ?, ?)',
    [ctx.companyId, input.storeId, input.businessLineId, input.targetQuantity, 'planned'],
  );

  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;

  return getProductionOrder(db, ctx, id as number);
}

export async function addProductionOrderItem(
  db: Database,
  ctx: RequestContext,
  orderId: number,
  productId: number,
  quantity: number,
) {
  await runStatement(
    db,
    'INSERT INTO production_order_items (company_id, production_order_id, product_id, quantity) VALUES (?, ?, ?, ?)',
    [ctx.companyId, orderId, productId, quantity],
  );
}

export async function getProductionOrder(db: Database, ctx: RequestContext, orderId: number) {
  const order = await runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, target_quantity AS targetQuantity, status FROM production_orders WHERE id = ? AND company_id = ?',
    [orderId, ctx.companyId],
    'get',
  );
  if (!order) return null;

  const items = await runStatement(
    db,
    'SELECT id, product_id AS productId, quantity FROM production_order_items WHERE production_order_id = ? AND company_id = ?',
    [orderId, ctx.companyId],
    'all',
  );

  return { ...(order as any), items };
}

export async function updateProductionOrderStatus(
  db: Database,
  ctx: RequestContext,
  orderId: number,
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled',
) {
  const timeField =
    status === 'in_progress' ? 'started_at' : status === 'completed' ? 'completed_at' : null;

  if (timeField) {
    await runStatement(
      db,
      `UPDATE production_orders SET status = ?, ${timeField} = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?`,
      [status, orderId, ctx.companyId],
    );
  } else {
    await runStatement(
      db,
      'UPDATE production_orders SET status = ? WHERE id = ? AND company_id = ?',
      [status, orderId, ctx.companyId],
    );
  }
}

export async function listProductionOrders(db: Database, ctx: RequestContext) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, target_quantity AS targetQuantity, status, started_at AS startedAt, completed_at AS completedAt, created_at AS createdAt FROM production_orders WHERE company_id = ? ORDER BY id DESC',
    [ctx.companyId],
    'all',
  );
}

export async function updateProductionOrder(
  db: Database,
  ctx: RequestContext,
  orderId: number,
  input: { targetQuantity: number },
) {
  await runStatement(
    db,
    'UPDATE production_orders SET target_quantity = ? WHERE id = ? AND company_id = ?',
    [input.targetQuantity, orderId, ctx.companyId],
  );
  // Nota: Si cambian items, deberiamos borrar y reinsertar items,
  // pero para v1 la edicion basica es targetQuantity.
}
