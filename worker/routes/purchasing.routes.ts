import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import {
  generateReplenishmentNeeds,
  listPurchaseRequests,
  upsertPurchaseRequest,
  updatePurchaseRequestStatus,
  setInventoryLevels,
  discardPurchaseRequest,
} from '../db/purchasing.repositories';

export async function handlePurchasingRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/purchasing')) return null;
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;
  const db = env.DB;

  // GET /api/purchasing/:storeId/needs
  const needsMatch = pathname.match(/^\/api\/purchasing\/(\d+)\/needs$/);
  if (needsMatch && method === 'GET') {
    try {
      const storeId = parseInt(needsMatch[1], 10);
      const needs = await generateReplenishmentNeeds(db, ctx, storeId);
      return new Response(JSON.stringify(needs), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET/POST /api/purchasing/:storeId/requests
  const requestsListMatch = pathname.match(/^\/api\/purchasing\/(\d+)\/requests$/);
  if (requestsListMatch && method === 'GET') {
    try {
      const storeId = parseInt(requestsListMatch[1], 10);
      const list = await listPurchaseRequests(db, ctx, storeId);
      return new Response(JSON.stringify(list), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (requestsListMatch && method === 'POST') {
    try {
      const storeId = parseInt(requestsListMatch[1], 10);
      const body = await request.json<any>();
      const id = await upsertPurchaseRequest(
        db,
        ctx,
        storeId,
        body.productId,
        body.reason,
        body.suggestedQuantity,
      );
      return new Response(JSON.stringify({ id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // PATCH /api/purchasing/requests/:id  (status update: bought, postponed, pending)
  const patchMatch = pathname.match(/^\/api\/purchasing\/requests\/(\d+)$/);
  if (patchMatch && method === 'PATCH') {
    try {
      const requestId = parseInt(patchMatch[1], 10);
      const body = await request.json<any>();
      await updatePurchaseRequestStatus(db, ctx, requestId, body.status, body.notes);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/purchasing/requests/:id/discard  (audit trail)
  const discardMatch = pathname.match(/^\/api\/purchasing\/requests\/(\d+)\/discard$/);
  if (discardMatch && method === 'POST') {
    try {
      const requestId = parseInt(discardMatch[1], 10);
      const body = await request.json<any>();
      await discardPurchaseRequest(db, ctx, requestId, body.reason);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/purchasing/:storeId/levels  — set min/max stock
  const levelsMatch = pathname.match(/^\/api\/purchasing\/(\d+)\/levels$/);
  if (levelsMatch && method === 'POST') {
    try {
      const storeId = parseInt(levelsMatch[1], 10);
      const body = await request.json<any>();
      await setInventoryLevels(db, ctx, storeId, body.productId, body.minStock, body.maxStock);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
