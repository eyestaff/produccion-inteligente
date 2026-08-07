import type { Env } from '../index';

export async function handleHealthRoute(
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', project: env.PROJECT_NAME }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
