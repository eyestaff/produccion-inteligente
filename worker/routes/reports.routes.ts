import type { Env } from '../index';
import type { RequestContext } from '../models/context';

export async function handleReportsRoute(
  pathname: string,
  request: Request,
  env: Env,
  ctx: RequestContext | null,
): Promise<Response | null> {
  if (!pathname.startsWith('/api/reports')) return null;

  if (!ctx) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (pathname === '/api/reports/executive' && request.method === 'GET') {
    return new Response(
      JSON.stringify({
        success: true,
        report: {
          type: 'executive',
          companyId: ctx.companyId,
          generatedAt: new Date().toISOString(),
          title: 'Resumen Ejecutivo',
          project: 'Producción Inteligente',
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
