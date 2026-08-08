import type { Env } from '../index';
import { loginUser, logoutUser, hashPassword, generateSalt } from '../services/auth.service';
import { requireAuth } from '../middlewares/auth.middleware';
import { findUserById, updateUserPassword } from '../repositories/users.repository';

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

  // ─── POST /api/auth/change-password ────────────────────────────────────────
  // Requires a valid session. Validates new password, hashes it with the
  // same PBKDF2 mechanism, and clears the must_change_password flag.
  if (pathname === '/api/auth/change-password' && request.method === 'POST') {
    const authResult = await requireAuth(request, env);
    if (authResult.errorResponse) {
      return authResult.errorResponse;
    }
    const auth = authResult.auth!;

    const body = (await request.json()) as {
      newPassword?: unknown;
      confirmPassword?: unknown;
    };

    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    // Basic validations
    if (typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'La nueva contraseña es obligatoria' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'Las contraseñas no coinciden' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Re-fetch user to verify current state
    const user = await findUserById(env.DB, auth.userId);
    if (!user || user.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Usuario no válido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash new password using same PBKDF2 mechanism
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    await updateUserPassword(env.DB, user.id, newHash, newSalt);

    return new Response(
      JSON.stringify({ success: true, message: 'Contraseña actualizada correctamente' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  return null;
}
