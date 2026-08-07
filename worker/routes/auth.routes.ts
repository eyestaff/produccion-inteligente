import type { Env } from '../index';
import { loginUser, logoutUser } from '../services/auth.service';

export async function handleAuthRoute(
  pathname: string,
  request: Request,
  env: Env,
): Promise<Response | null> {
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = body.email;
    const password = body.password;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return new Response(JSON.stringify({ error: 'Faltan credenciales' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await loginUser(env.DB, email, password);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      await logoutUser(env.DB, token);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
