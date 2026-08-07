import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { WasteService, WasteReason } from '../services/waste.service';

export async function handleWasteRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/waste')) return null;
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;
  const db = env.DB;
  const service = new WasteService(db, ctx);

  // GET /api/waste/:storeId/metrics
  const metricsMatch = pathname.match(/^\/api\/waste\/(\d+)\/metrics$/);
  if (metricsMatch && method === 'GET') {
    try {
      const storeId = parseInt(metricsMatch[1], 10);
      const metrics = await service.getWasteMetrics(storeId);
      return new Response(JSON.stringify(metrics), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET/POST /api/waste/:storeId
  const baseMatch = pathname.match(/^\/api\/waste\/(\d+)$/);
  if (baseMatch && method === 'GET') {
    try {
      const storeId = parseInt(baseMatch[1], 10);
      const url = new URL(request.url);
      const productId = url.searchParams.get('productId')
        ? parseInt(url.searchParams.get('productId')!, 10)
        : undefined;
      const reason = url.searchParams.get('reason') || undefined;
      const startDate = url.searchParams.get('startDate') || undefined;
      const endDate = url.searchParams.get('endDate') || undefined;

      const listRaw: any = await service.listWaste(storeId, {
        productId,
        reason,
        startDate,
        endDate,
      });
      const list = Array.isArray(listRaw) ? listRaw : listRaw?.results || [];
      return new Response(JSON.stringify(list), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (baseMatch && method === 'POST') {
    try {
      const storeId = parseInt(baseMatch[1], 10);
      const body = await request.json<any>();
      const result = await service.registerWaste({
        storeId,
        productId: body.productId,
        quantity: body.quantity,
        reason: body.reason as WasteReason,
        notes: body.notes,
      });
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
