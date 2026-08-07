import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { runStatement } from '../db/repositories';

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

    // Produccion hoy (ordenes completadas hoy)
    const todayOrders = (await runStatement(
      db,
      `SELECT COUNT(*) as count, COALESCE(SUM(target_quantity),0) as total
       FROM production_orders
       WHERE company_id = ? AND status = 'completed'
       AND DATE(completed_at) = DATE('now')`,
      [ctx.companyId],
      'get',
    )) as any;

    // Mermas hoy (transacciones OUT de tipo breakage/caducity)
    const wasteToday = (await runStatement(
      db,
      `SELECT COALESCE(SUM(ABS(quantity_change)),0) as total
       FROM inventory_transactions
       WHERE company_id = ? AND type = 'out'
       AND reason IN ('breakage','caducity','theft')
       AND DATE(created_at) = DATE('now')`,
      [ctx.companyId],
      'get',
    )) as any;

    // Inventario: total referencias
    const inventoryCount = (await runStatement(
      db,
      `SELECT COUNT(*) as count FROM inventory WHERE company_id = ? AND quantity > 0`,
      [ctx.companyId],
      'get',
    )) as any;

    // Ordenes pendientes
    const pendingOrders = (await runStatement(
      db,
      `SELECT COUNT(*) as count FROM production_orders
       WHERE company_id = ? AND status IN ('planned','in_progress')`,
      [ctx.companyId],
      'get',
    )) as any;

    // Tiendas activas
    const stores = (await runStatement(
      db,
      `SELECT name FROM stores WHERE company_id = ? LIMIT 10`,
      [ctx.companyId],
      'all',
    )) as any[];

    // Produccion 7 días
    const weeklyRaw = (await runStatement(
      db,
      `SELECT DATE(completed_at) as day, COALESCE(SUM(target_quantity),0) as total
       FROM production_orders WHERE company_id = ? AND status = 'completed'
       AND completed_at >= DATE('now','-6 days')
       GROUP BY DATE(completed_at) ORDER BY day ASC`,
      [ctx.companyId],
      'all',
    )) as any[];

    const weeklyProduction =
      weeklyRaw.length > 0 ? weeklyRaw.map((r: any) => r.total) : [0, 0, 0, 0, 0, 0, 0];

    const payload = {
      productionToday: todayOrders?.total || 0,
      ordersToday: todayOrders?.count || 0,
      wasteToday: wasteToday?.total || 0,
      inventory: inventoryCount?.count || 0,
      pendingOrders: pendingOrders?.count || 0,
      weeklyProduction,
      stores: (stores || []).map((s: any) => ({ name: s.name, status: 'activa' })),
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
