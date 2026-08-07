import type { Env } from '../index';
import type { AuthContext } from '../models/auth';
import { findSessionByToken, findUserById } from '../repositories/users.repository';

export async function requireAuth(
  request: Request,
  env: Env,
): Promise<{ auth?: AuthContext; errorResponse?: Response }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const token = authHeader.slice(7);
  const session = await findSessionByToken(env.DB, token);

  if (!session) {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  if (session.expiresAt < Date.now()) {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'Token expirado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const user = await findUserById(env.DB, session.userId);
  if (!user || user.status !== 'active') {
    return {
      errorResponse: new Response(JSON.stringify({ error: 'Usuario no válido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  return {
    auth: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
    },
  };
}
