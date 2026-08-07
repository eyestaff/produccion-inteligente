import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { StoresService } from '../services/stores.service';

export async function handleStoresRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/stores')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const service = new StoresService(env.DB);
  const method = request.method;

  try {
    // GET /api/stores
    if (pathname === '/api/stores' && method === 'GET') {
      const stores = await service.list(ctx);
      return new Response(JSON.stringify(stores), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /api/stores
    if (pathname === '/api/stores' && method === 'POST') {
      const input = await request.json<any>();
      const store = await service.create(ctx, input);
      return new Response(JSON.stringify(store), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Single item routes
    const match = pathname.match(/^\/api\/stores\/(\d+)$/);
    if (match) {
      const id = parseInt(match[1], 10);

      // GET /api/stores/:id
      if (method === 'GET') {
        const store = await service.getById(ctx, id);
        return new Response(JSON.stringify(store), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // PUT /api/stores/:id
      if (method === 'PUT') {
        const input = await request.json<any>();
        await service.update(ctx, id, input);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // DELETE /api/stores/:id
      if (method === 'DELETE') {
        await service.delete(ctx, id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return new Response(JSON.stringify({ error: 'Tienda no encontrada' }), { status: 404 });
    }
    if (error.message === 'INVALID_INPUT') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
}
