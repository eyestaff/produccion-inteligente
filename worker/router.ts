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
import { requireAuth } from './middlewares/auth.middleware';
import { initializeDb } from './db';

export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  let response: Response | null = null;

  response = await handleHealthRoute(pathname, request, env);
  if (response) return response;

  response = await handleAuthRoute(pathname, request, env);
  if (response) return response;

  let authContext: any = null;
  // Protect API routes except auth
  if (
    pathname.startsWith('/api/') &&
    pathname !== '/api/auth/login' &&
    pathname !== '/api/auth/logout'
  ) {
    const authResult = await requireAuth(request, env);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    authContext = authResult.auth;
  }

  response = await handleDashboardRoute(pathname, request, env, authContext);
  if (response) return response;

  if (pathname.startsWith('/api/records')) {
    await initializeDb(env.DB);
  }

  response = await handleStoresRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleBusinessLinesRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleProductsRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleRecipesRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleInventoryRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleProductionRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handlePurchasingRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleForecastRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleRecordsRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handleAssetsRoute(pathname, request, env, authContext);
  if (response) return response;

  response = await handlePwaRoute(pathname);
  if (response) return response;

  return new Response('Not found', { status: 404 });
}
