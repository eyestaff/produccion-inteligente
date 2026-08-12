import type { Env } from '../index';
import { loginUser, logoutUser, hashPassword, generateSalt, generatePasswordResetToken, hashPasswordResetToken, getPasswordResetUrl } from '../services/auth.service';
import { requireAuth } from '../middlewares/auth.middleware';
import { findUserByEmail, findUserById, updateUserPassword, createPasswordResetToken, findValidPasswordResetToken, markPasswordResetTokenUsed } from '../repositories/users.repository';
import { sendEmail } from '../services/email.service';

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


if (pathname === '/api/auth/forgot-password' && request.method === 'POST') {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return new Response(JSON.stringify({ error: 'El email es obligatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await findUserByEmail(env.DB, email);

    if (user && user.status === 'active') {
      const token = generatePasswordResetToken();
      const tokenHash = await hashPasswordResetToken(token);
      const expiresAt = Date.now() + 30 * 60 * 1000;

      await createPasswordResetToken(env.DB, user.id, tokenHash, expiresAt);

      const resetUrl = getPasswordResetUrl(env.APP_URL, token);

      await sendEmail(env, {
        to: user.email,
        subject: 'Restablecer contraseña - Producción Inteligente',
        html: `
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>
            <a href="${resetUrl}">Restablecer contraseña</a>
          </p>
          <p>Este enlace caduca en 30 minutos y solo puede utilizarse una vez.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si el email está registrado, recibirás un enlace para restablecer la contraseña.',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Password reset request failed:', error);

    return new Response(
      JSON.stringify({ error: 'No se pudo procesar la solicitud' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
  try {
    const body = (await request.json()) as {
      token?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };

    const token = typeof body.token === 'string' ? body.token : '';
    const newPassword = body.newPassword;
    const confirmPassword = body.confirmPassword;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'Las contraseñas no coinciden' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenHash = await hashPasswordResetToken(token);
    const resetToken = await findValidPasswordResetToken(
      env.DB,
      tokenHash,
      Date.now(),
    );

    if (!resetToken) {
      return new Response(
        JSON.stringify({ error: 'El enlace es inválido o ha caducado' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const user = await findUserById(env.DB, resetToken.userId);

    if (!user || user.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Usuario no válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    await updateUserPassword(env.DB, user.id, newHash, newSalt);
    await markPasswordResetTokenUsed(env.DB, resetToken.id, Date.now());

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña actualizada correctamente',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Password reset failed:', error);

    return new Response(
      JSON.stringify({ error: 'No se pudo restablecer la contraseña' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

if (pathname === '/api/auth/test-email' && request.method === 'POST') {
  const authResult = await requireAuth(request, env);
  if (authResult.errorResponse) {
    return authResult.errorResponse;
  }

  const auth = authResult.auth!;

  if (auth.user.email !== 'eyestaff.ncarrillo@gmail.com') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await sendEmail(env, {
      to: 'eyestaff.ncarrillo@gmail.com',
      subject: 'Prueba Brevo - Producción Inteligente',
      html: '<h1>Brevo funciona</h1><p>Este es un correo de prueba de Producción Inteligente.</p>',
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Brevo test email failed:', error);

    return new Response(JSON.stringify({ error: 'No se pudo enviar el email' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
