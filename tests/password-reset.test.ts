import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAuthRoute } from '../worker/routes/auth.routes';
import { hashPassword, generateSalt } from '../worker/services/auth.service';

const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock('../worker/services/email.service', () => ({
  sendEmail: sendEmailMock,
}));

describe('Password Reset Flow', () => {
  let env: any;
  let usersData: any[] = [];
  let passwordResetTokensData: any[] = [];

  beforeEach(async () => {
    usersData = [];
    passwordResetTokensData = [];
    sendEmailMock.mockReset();

    const salt = generateSalt();
    const hash = await hashPassword('password123', salt);

    usersData.push({
      id: 1,
      companyId: 1,
      email: 'test@example.com',
      passwordHash: hash,
      passwordSalt: salt,
      role: 'user',
      status: 'active',
      mustChangePassword: 0,
    });

    const fakeDb = {
      prepare: (sql: string) => {
        const normalized = sql.trim();

        return {
          bind: (...args: any[]) => ({
            first: async () => {
              if (normalized.includes('FROM users WHERE email = ?')) {
                return usersData.find((u) => u.email === args[0]) || null;
              }

              if (normalized.includes('FROM users WHERE id = ?')) {
                return usersData.find((u) => u.id === args[0]) || null;
              }

              if (normalized.includes('FROM password_reset_tokens')) {
                return (
                  passwordResetTokensData.find(
                    (t) =>
                      t.tokenHash === args[0] &&
                      t.usedAt === null &&
                      t.expiresAt > args[1],
                  ) || null
                );
              }

              return null;
            },

            run: async () => {
              if (normalized.includes('INSERT INTO password_reset_tokens')) {
                passwordResetTokensData.push({
                  id: passwordResetTokensData.length + 1,
                  userId: args[0],
                  tokenHash: args[1],
                  expiresAt: args[2],
                  usedAt: null,
                });
              }

              if (normalized.includes('UPDATE users SET password_hash')) {
                const user = usersData.find((u) => u.id === args[2]);

                if (user) {
                  user.passwordHash = args[0];
                  user.passwordSalt = args[1];
                  user.mustChangePassword = 0;
                }
              }

              if (
                normalized.includes(
                  'UPDATE password_reset_tokens SET used_at',
                )
              ) {
                const token = passwordResetTokensData.find(
                  (t) => t.id === args[1],
                );

                if (token) {
                  token.usedAt = args[0];
                }
              }

              return { success: true };
            },
          }),
        };
      },
    };

    env = {
      DB: fakeDb,
      ASSETS: {} as any,
      PROJECT_NAME: 'Test',
      APP_URL: 'https://test.example.com',
      BREVO_API_KEY: 'test-brevo-key',
    };
  });

  it('rechaza una solicitud sin email', async () => {
    const request = new Request(
      'http://localhost/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    );

    const response = await handleAuthRoute(
      '/api/auth/forgot-password',
      request,
      env,
    );

    expect(response?.status).toBe(400);
  });

  it('rechaza una contraseña demasiado corta', async () => {
    const request = new Request(
      'http://localhost/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token: 'test-token',
          newPassword: '1234567',
          confirmPassword: '1234567',
        }),
      },
    );

    const response = await handleAuthRoute(
      '/api/auth/reset-password',
      request,
      env,
    );

    expect(response?.status).toBe(400);
  });

  it('completa el flujo de recuperación y consume el token', async () => {
    sendEmailMock.mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
    });

    const forgotRequest = new Request(
      'http://localhost/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      },
    );

    const forgotResponse = await handleAuthRoute(
      '/api/auth/forgot-password',
      forgotRequest,
      env,
    );

    expect(forgotResponse?.status).toBe(200);
    expect(passwordResetTokensData).toHaveLength(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const emailOptions = sendEmailMock.mock.calls[0][1];

    expect(emailOptions.to).toBe('test@example.com');
    expect(emailOptions.subject).toContain('Restablecer contraseña');

    const match = emailOptions.html.match(
      /\/reset-password\?token=([^"&<\s]+)/,
    );

    expect(match).not.toBeNull();

    const token = decodeURIComponent(match![1]);

    expect(token).toHaveLength(64);
    expect(passwordResetTokensData[0].tokenHash).toHaveLength(64);
    expect(passwordResetTokensData[0].tokenHash).not.toBe(token);

    const resetRequest = new Request(
      'http://localhost/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword: 'NuevaPassword123',
          confirmPassword: 'NuevaPassword123',
        }),
      },
    );

    const resetResponse = await handleAuthRoute(
      '/api/auth/reset-password',
      resetRequest,
      env,
    );

    expect(resetResponse?.status).toBe(200);
    expect(passwordResetTokensData[0].usedAt).not.toBeNull();
    expect(usersData[0].passwordHash).not.toBe('');

    const secondResetRequest = new Request(
      'http://localhost/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword: 'OtraPassword123',
          confirmPassword: 'OtraPassword123',
        }),
      },
    );

    const secondResetResponse = await handleAuthRoute(
      '/api/auth/reset-password',
      secondResetRequest,
      env,
    );

    expect(secondResetResponse?.status).toBe(400);
  });
});
