import type { Env } from '../index';
import type { RequestContext } from '../models/context';
import { seedDemoData } from '../db/seed.repositories';

export async function handleDemoRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/demo')) return null;
  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const method = request.method;
  const db = env.DB;

  if (pathname === '/api/demo/seed' && method === 'POST') {
    try {
      await seedDemoData(db, ctx);
      return new Response(
        JSON.stringify({ success: true, message: 'Datos demo generados correctamente' }),
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
}
