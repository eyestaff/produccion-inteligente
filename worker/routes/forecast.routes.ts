import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { getForecastContext, saveForecast, getForecastHistory } from '../db/forecast.provider';
import { generateForecast } from '../engine/forecast.engine';
import { ProductionService } from '../services/production.service';

export async function handleForecastRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/forecast')) return null;
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;
  const db = env.DB;

  // GET /api/forecast/:storeId/dashboard
  const dashboardMatch = pathname.match(/^\/api\/forecast\/(\d+)\/dashboard$/);
  if (dashboardMatch && method === 'GET') {
    try {
      const storeId = parseInt(dashboardMatch[1], 10);

      // Layer 1: Provider
      const context = await getForecastContext(db, ctx, storeId);

      // Layer 2: Engine
      const dashboardResult = generateForecast(context);

      // Layer 3: Presentation (Response)
      return new Response(JSON.stringify(dashboardResult), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/forecast/:storeId/approve
  const approveMatch = pathname.match(/^\/api\/forecast\/(\d+)\/approve$/);
  if (approveMatch && method === 'POST') {
    try {
      const storeId = parseInt(approveMatch[1], 10);
      const input = await request.json<any>();
      const items = input.items || [];
      const targetDate = input.targetDate || new Date().toISOString().split('T')[0];

      // 1. Save Forecast Plan
      const forecastId = await saveForecast(db, ctx, storeId, targetDate, items);

      // 2. Generate Production Orders via ProductionService (ensures BOM snapshot is created)
      const productionService = new ProductionService(db as any, ctx);

      // Group 'produce' items that have an adjusted quantity > 0
      const produceItems = items.filter(
        (item: any) => item.type === 'produce' && item.adjustedQuantity > 0,
      );

      if (produceItems.length > 0) {
        // Attempt to create one order per product. Catch NO_ACTIVE_RECIPE errors gracefully.
        for (const item of produceItems) {
          try {
            await productionService.planOrder(storeId, 1, [
              {
                // businessLineId=1 as default; future: derive from product
                productId: item.productId,
                quantity: item.adjustedQuantity,
              },
            ]);
          } catch (e: any) {
            // If no active recipe exists for this product, skip silently (buy items dont need recipes)
            if (!e.message.startsWith('NO_ACTIVE_RECIPE')) {
              throw e;
            }
            console.warn(
              `[Forecast] Skipping production order for product ${item.productId}: ${e.message}`,
            );
          }
        }
      }

      return new Response(JSON.stringify({ success: true, forecastId }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/forecast/:storeId/history
  const historyMatch = pathname.match(/^\/api\/forecast\/(\d+)\/history$/);
  if (historyMatch && method === 'GET') {
    try {
      const storeId = parseInt(historyMatch[1], 10);
      const history = await getForecastHistory(db, ctx, storeId);

      const items = Array.isArray(history) ? history : (history as any)?.results || [];

      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
