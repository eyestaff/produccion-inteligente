import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { RecipesService } from '../services/recipes.service';

export async function handleRecipesRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/recipes')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const service = new RecipesService(env.DB, ctx);
  const method = request.method;

  const url = new URL(request.url);
  const productIdStr = url.searchParams.get('productId');
  const productId = productIdStr ? parseInt(productIdStr, 10) : undefined;

  try {
    if (pathname === '/api/recipes' && method === 'GET') {
      const items = await service.list(productId);
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/recipes' && method === 'POST') {
      const input = await request.json<any>();
      const item = await service.create(input);
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Matches /api/recipes/:id
    const singleRecipeMatch = pathname.match(/^\/api\/recipes\/(\d+)$/);
    if (singleRecipeMatch) {
      const id = parseInt(singleRecipeMatch[1], 10);
      if (method === 'GET') {
        const item = await service.get(id);
        return new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'PUT') {
        const input = await request.json<any>();
        const item = await service.update(id, input);
        return new Response(JSON.stringify(item), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (method === 'DELETE') {
        await service.delete(id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Matches /api/recipes/:id/items
    const recipeItemsMatch = pathname.match(/^\/api\/recipes\/(\d+)\/items$/);
    if (recipeItemsMatch && method === 'POST') {
      const recipeId = parseInt(recipeItemsMatch[1], 10);
      const input = await request.json<any>();
      const item = await service.addItem(recipeId, input);
      return new Response(JSON.stringify(item), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Matches /api/recipes/:id/items/:itemId
    const deleteItemMatch = pathname.match(/^\/api\/recipes\/(\d+)\/items\/(\d+)$/);
    if (deleteItemMatch && method === 'DELETE') {
      const recipeId = parseInt(deleteItemMatch[1], 10);
      const itemId = parseInt(deleteItemMatch[2], 10);
      await service.removeItem(recipeId, itemId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  } catch (error: any) {
    if (error.message === 'INVALID_DATA' || error.message === 'INVALID_INPUT') {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }
    if (error.message === 'NOT_FOUND') {
      return new Response(JSON.stringify({ error: 'No encontrado' }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500 });
  }
}
