import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { getForecastContext } from '../db/forecast.provider';
import { generateForecast } from '../engine/forecast.engine';

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

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
