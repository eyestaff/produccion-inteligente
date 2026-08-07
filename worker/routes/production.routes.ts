import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { ProductionService } from '../services/production.service';

export async function handleProductionRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/production')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;
  const service = new ProductionService(env.DB, ctx);

  // POST /api/production/orders
  if (pathname === '/api/production/orders' && method === 'POST') {
    try {
      const body = await request.json<any>();
      const order = await service.planOrder(body.storeId, body.businessLineId, body.items);
      return new Response(JSON.stringify(order), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message.startsWith('NO_ACTIVE_RECIPE')) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/production/dashboard
  if (pathname === '/api/production/dashboard' && method === 'GET') {
    try {
      const kpis = await service.getDashboardKPIs();
      return new Response(JSON.stringify(kpis), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/production/orders
  if (pathname === '/api/production/orders' && method === 'GET') {
    try {
      const orders = await service.listOrders();
      return new Response(JSON.stringify(orders), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // PUT /api/production/orders/:id
  const putMatch = pathname.match(/^\/api\/production\/orders\/(\d+)$/);
  if (putMatch && method === 'PUT') {
    try {
      const body = await request.json<any>();
      const order = await service.editOrder(parseInt(putMatch[1], 10), body);
      return new Response(JSON.stringify(order), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      if (e.message === 'ORDER_ALREADY_STARTED')
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/production/orders/:id/start
  const startMatch = pathname.match(/^\/api\/production\/orders\/(\d+)\/start$/);
  if (startMatch && method === 'POST') {
    try {
      const order = await service.startOrder(parseInt(startMatch[1], 10));
      return new Response(JSON.stringify(order), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 400 });
    }
  }

  // GET /api/production/orders/:id
  const getMatch = pathname.match(/^\/api\/production\/orders\/(\d+)$/);
  if (getMatch && method === 'GET') {
    try {
      const order = await service.get(parseInt(getMatch[1], 10));
      return new Response(JSON.stringify(order), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET /api/production/orders/:id/prep-sheet
  const prepMatch = pathname.match(/^\/api\/production\/orders\/(\d+)\/prep-sheet$/);
  if (prepMatch && method === 'GET') {
    try {
      const sheet = await service.getPrepSheet(parseInt(prepMatch[1], 10));
      return new Response(JSON.stringify(sheet), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/production/orders/:id/complete
  const completeMatch = pathname.match(/^\/api\/production\/orders\/(\d+)\/complete$/);
  if (completeMatch && method === 'POST') {
    try {
      let body: any = {};
      try {
        body = await request.json();
      } catch (e) {
        // body might be empty
      }
      const order = await service.completeOrder(
        parseInt(completeMatch[1], 10),
        body.actualQuantity,
        body.wasteQuantity,
      );
      return new Response(JSON.stringify(order), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'ORDER_ALREADY_CLOSED')
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // POST /api/production/orders/:id/cancel
  const cancelMatch = pathname.match(/^\/api\/production\/orders\/(\d+)\/cancel$/);
  if (cancelMatch && method === 'POST') {
    try {
      const order = await service.cancelOrder(parseInt(cancelMatch[1], 10));
      return new Response(JSON.stringify(order), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e: any) {
      if (e.message === 'ORDER_ALREADY_CLOSED')
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      if (e.message === 'NOT_FOUND') return new Response(null, { status: 404 });
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
