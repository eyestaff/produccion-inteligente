import type { Env } from './index';
import { handleHealthRoute } from './routes/health.routes';
import { handlePwaRoute } from './routes/pwa.routes';
import { handleDashboardRoute } from './routes/dashboard';
import { handleRecordsRoute } from './routes/records.routes';
import { handleAssetsRoute } from './routes/assets.routes';
import { initializeDb } from './db';

export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  let response: Response | null = null;

  response = await handleHealthRoute(pathname, request, env);
  if (response) return response;

  response = await handleDashboardRoute(pathname, request, env);
  if (response) return response;

  if (pathname.startsWith('/api/records')) {
    await initializeDb(env.DB);
  }

  response = await handleRecordsRoute(pathname, request, env);
  if (response) return response;

  response = await handleAssetsRoute(pathname, request, env);
  if (response) return response;

  response = await handlePwaRoute(pathname);
  if (response) return response;

  return new Response('Not found', { status: 404 });
}
