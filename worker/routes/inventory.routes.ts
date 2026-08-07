import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { InventoryService } from '../services/inventory.service';

export async function handleInventoryRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/inventory')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;

  // GET /api/inventory/:storeId
  const snapshotMatch = pathname.match(/^\/api\/inventory\/(\d+)$/);
  if (snapshotMatch && method === 'GET') {
    const storeId = parseInt(snapshotMatch[1], 10);
    const service = new InventoryService(env.DB, ctx);
    try {
      const data = await service.getStoreInventory(storeId);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/inventory/:storeId/transactions/:productId
  const transactionsMatch = pathname.match(/^\/api\/inventory\/(\d+)\/transactions\/(\d+)$/);
  if (transactionsMatch && method === 'GET') {
    const storeId = parseInt(transactionsMatch[1], 10);
    const productId = parseInt(transactionsMatch[2], 10);
    const service = new InventoryService(env.DB, ctx);
    try {
      const data = await service.getTransactions(storeId, productId);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/inventory/:storeId/adjust
  const adjustMatch = pathname.match(/^\/api\/inventory\/(\d+)\/adjust$/);
  if (adjustMatch && method === 'POST') {
    const storeId = parseInt(adjustMatch[1], 10);
    const service = new InventoryService(env.DB, ctx);
    try {
      const body = await request.json<any>();
      const data = await service.adjustInventory(
        storeId,
        body.productId,
        body.quantity,
        body.reason,
      );
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'INVALID_REASON' || e.message === 'INVALID_QUANTITY') {
        return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
      }
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
