import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { runStatement } from '../db/repositories';
import { getForecastContext } from '../db/forecast.provider';
import { generateForecast } from '../engine/forecast.engine';

export async function handleDashboardRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (pathname !== '/api/dashboard' || request.method !== 'GET') {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const db = env.DB;
    const cid = ctx.companyId;

    // 1. Produccion hoy
    const todayOrders = (await runStatement(
      db,
      `SELECT COUNT(*) as count, COALESCE(SUM(target_quantity),0) as total
       FROM production_orders
       WHERE company_id = ? AND status = 'completed'
       AND DATE(completed_at) = DATE('now')`,
      [cid],
      'get',
    )) as any;

    // 2. Mermas hoy
    const wasteToday = (await runStatement(
      db,
      `SELECT COALESCE(SUM(ABS(quantity_change)),0) as total
       FROM inventory_transactions
       WHERE company_id = ? AND type = 'out'
       AND reason IN ('caducity', 'overproduction', 'error', 'breakage', 'quality', 'other', 'theft')
       AND DATE(created_at) = DATE('now')`,
      [cid],
      'get',
    )) as any;

    // 3. Inventario
    const inventoryCount = (await runStatement(
      db,
      `SELECT COUNT(*) as count FROM inventory WHERE company_id = ? AND quantity > 0`,
      [cid],
      'get',
    )) as any;

    // 4. Ordenes pendientes
    const pendingOrders = (await runStatement(
      db,
      `SELECT COUNT(*) as count FROM production_orders
       WHERE company_id = ? AND status IN ('planned','in_progress')`,
      [cid],
      'get',
    )) as any;

    // 5. Compras pendientes
    const pendingPurchases = (await runStatement(
      db,
      `SELECT COUNT(*) as count FROM purchase_requests
       WHERE company_id = ? AND status = 'pending'`,
      [cid],
      'get',
    )) as any;

    // 6. Producción por tienda
    const storesData = (await runStatement(
      db,
      `SELECT s.id, s.name, s.status, COALESCE(SUM(po.target_quantity), 0) as todayProduction
       FROM stores s
       LEFT JOIN production_orders po ON po.store_id = s.id AND po.status = 'completed' AND DATE(po.completed_at) = DATE('now')
       WHERE s.company_id = ?
       GROUP BY s.id
       ORDER BY s.id ASC`,
      [cid],
      'all',
    )) as any[];

    // 7. Produccion 7 días (normalizar array a 7 días exactos o mantener crudo)
    const weeklyRaw = (await runStatement(
      db,
      `SELECT DATE(completed_at) as day, COALESCE(SUM(target_quantity),0) as total
       FROM production_orders WHERE company_id = ? AND status = 'completed'
       AND completed_at >= DATE('now','-6 days')
       GROUP BY DATE(completed_at) ORDER BY day ASC`,
      [cid],
      'all',
    )) as any[];

    // Convert to a simple 7-element array for the UI (we can keep the current logic or improve it)
    const weeklyProduction =
      weeklyRaw.length > 0 ? weeklyRaw.map((r: any) => r.total) : [0, 0, 0, 0, 0, 0, 0];

    // 8. Stock Crítico
    const criticalStock = (await runStatement(
      db,
      `SELECT p.name, i.available_quantity as stock, i.min_stock as minStock
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.company_id = ? AND i.available_quantity <= i.min_stock
       ORDER BY i.available_quantity ASC
       LIMIT 10`,
      [cid],
      'all',
    )) as any[];

    // 9. Últimas Órdenes
    const recentOrders = (await runStatement(
      db,
      `SELECT id, status, target_quantity as targetQuantity, created_at as createdAt
       FROM production_orders
       WHERE company_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [cid],
      'all',
    )) as any[];

    // 10. Últimos Movimientos
    const recentMovements = (await runStatement(
      db,
      `SELECT p.name as product, it.type, it.quantity_change as quantityChange, it.reason, it.created_at as createdAt
       FROM inventory_transactions it
       JOIN products p ON it.product_id = p.id
       WHERE it.company_id = ?
       ORDER BY it.created_at DESC LIMIT 5`,
      [cid],
      'all',
    )) as any[];

    // 11. Últimas Compras
    const recentPurchases = (await runStatement(
      db,
      `SELECT p.name as product, pr.suggested_quantity as quantity, pr.status, pr.created_at as createdAt
       FROM purchase_requests pr
       JOIN products p ON pr.product_id = p.id
       WHERE pr.company_id = ?
       ORDER BY pr.created_at DESC LIMIT 5`,
      [cid],
      'all',
    )) as any[];

    // 12. Estado de producción del día
    const productionStatusRaw = (await runStatement(
      db,
      `SELECT status, COUNT(*) as count
       FROM production_orders
       WHERE company_id = ? AND DATE(created_at) = DATE('now')
       GROUP BY status`,
      [cid],
      'all',
    )) as any[];

    const productionStatus = { planned: 0, in_progress: 0, completed: 0 };
    for (const r of productionStatusRaw) {
      if (r.status === 'planned') productionStatus.planned = r.count;
      else if (r.status === 'in_progress') productionStatus.in_progress = r.count;
      else if (r.status === 'completed') productionStatus.completed = r.count;
    }

    // 13. Forecast Resumido (Tienda Principal)
    const forecastSummary = { produce: 0, buy: 0 };
    if (storesData.length > 0) {
      const mainStoreId = storesData[0].id;
      const fContext = await getForecastContext(db, ctx, mainStoreId);
      const fResult = generateForecast(fContext);
      for (const rec of fResult.recommendations) {
        if (rec.type === 'produce') forecastSummary.produce += rec.suggestedQuantity;
        if (rec.type === 'buy') forecastSummary.buy += rec.suggestedQuantity;
      }
    }

    const payload = {
      productionToday: todayOrders?.total || 0,
      ordersToday: todayOrders?.count || 0,
      wasteToday: wasteToday?.total || 0,
      inventory: inventoryCount?.count || 0,
      pendingOrders: pendingOrders?.count || 0,
      pendingPurchases: pendingPurchases?.count || 0,
      weeklyProduction,
      stores: storesData,
      criticalStock,
      recentOrders,
      recentMovements,
      recentPurchases,
      productionStatus,
      forecastSummary,
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
