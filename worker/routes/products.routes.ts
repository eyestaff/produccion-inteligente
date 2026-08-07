import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { ProductsService } from '../services/products.service';

export async function handleProductsRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/products') && !pathname.startsWith('/api/categories')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const service = new ProductsService(env.DB);
  const method = request.method;

  try {
    if (pathname === '/api/products' && method === 'GET') {
      const rawItems: any = await service.list(ctx);
      const items = Array.isArray(rawItems) ? rawItems : rawItems?.results || [];
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/products' && method === 'POST') {
      const input = await request.json<any>();
      const item = await service.create(ctx, input);
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname.match(/^\/api\/products\/\d+$/) && method === 'PUT') {
      const id = parseInt(pathname.split('/').pop() || '0', 10);
      const input = await request.json<any>();
      const item = await service.update(ctx, id, input);
      return new Response(JSON.stringify(item), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/categories' && method === 'GET') {
      const items = await service.listCategories(ctx);
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/categories' && method === 'POST') {
      const input = await request.json<any>();
      const item = await service.createCategory(ctx, input);
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  } catch (error: any) {
    if (error.message === 'INVALID_INPUT') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
}
