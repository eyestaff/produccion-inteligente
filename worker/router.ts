import type { Env } from './index';
import { handleHealthRoute } from './routes/health.routes';
import { handlePwaRoute } from './routes/pwa.routes';
import { handleDashboardRoute } from './routes/dashboard';
import { handleRecordsRoute } from './routes/records.routes';
import { handleAssetsRoute } from './routes/assets.routes';
import { handleAuthRoute } from './routes/auth.routes';
import { handleStoresRoute } from './routes/stores.routes';
import { handleBusinessLinesRoute } from './routes/business-lines.routes';
import { handleProductsRoute } from './routes/products.routes';
import { handleRecipesRoute } from './routes/recipes.routes';
import { handleInventoryRoute } from './routes/inventory.routes';
import { handleProductionRoute } from './routes/production.routes';
import { handlePurchasingRoute } from './routes/purchasing.routes';
import { handleForecastRoute } from './routes/forecast.routes';
import { handleDemoRoute } from './routes/demo.routes';
import { requireAuth } from './middlewares/auth.middleware';
import { initializeDb } from './db';

export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const startTime = Date.now();
  const method = request.method;
  let authContext: any = null;
  try {
    let response: Response | null = null;

    response = await handleHealthRoute(pathname, request, env);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleAuthRoute(pathname, request, env);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    // Protect API routes except auth
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/auth/login' &&
      pathname !== '/api/auth/logout'
    ) {
      const authResult = await requireAuth(request, env);
      if (authResult.errorResponse) {
        return logAndReturn(authResult.errorResponse, startTime, method, pathname, null);
      }
      authContext = authResult.auth;
    }

    response = await handleDashboardRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    if (pathname.startsWith('/api/records')) {
      await initializeDb(env.DB);
    }

    response = await handleStoresRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleBusinessLinesRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleProductsRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleRecipesRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleInventoryRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleProductionRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handlePurchasingRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleForecastRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleRecordsRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleAssetsRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handleDemoRoute(pathname, request, env, authContext);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    response = await handlePwaRoute(pathname);
    if (response) return logAndReturn(response, startTime, method, pathname, authContext);

    return logAndReturn(
      new Response('Not found', { status: 404 }),
      startTime,
      method,
      pathname,
      authContext,
    );
  } catch (error: any) {
    console.error(
      JSON.stringify({
        level: 'error',
        method,
        pathname,
        error: error.message,
        stack: error.stack,
        companyId: authContext?.companyId,
        userId: authContext?.userId,
        duration_ms: Date.now() - startTime,
      }),
    );
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function logAndReturn(
  response: Response,
  startTime: number,
  method: string,
  pathname: string,
  authContext: any = null,
): Response {
  // We don't log assets to avoid spamming the logs
  if (!pathname.startsWith('/api/') || pathname === '/api/health') {
    return response;
  }
  const duration = Date.now() - startTime;
  console.info(
    JSON.stringify({
      level: 'info',
      method,
      pathname,
      status: response.status,
      companyId: authContext?.companyId,
      userId: authContext?.userId,
      duration_ms: duration,
    }),
  );
  return response;
}
