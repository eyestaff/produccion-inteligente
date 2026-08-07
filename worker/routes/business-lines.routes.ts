import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { BusinessLinesService } from '../services/business-lines.service';

export async function handleBusinessLinesRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/business-lines')) {
    return null;
  }
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const service = new BusinessLinesService(env.DB);
  const method = request.method;

  try {
    if (pathname === '/api/business-lines' && method === 'GET') {
      const items = await service.list(ctx);
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (pathname === '/api/business-lines' && method === 'POST') {
      const input = await request.json<any>();
      const item = await service.create(ctx, input);
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
