import { describe, it, expect, beforeEach } from 'vitest';
import type { Env } from '../worker';
import { handleAuthRoute } from '../worker/routes/auth.routes';
import { hashPassword, generateSalt } from '../worker/services/auth.service';

describe('Auth API', () => {
  let env: Env;
  let fakeDb: any;
  let usersData: any[] = [];
  let sessionsData: any[] = [];
  let passwordResetTokensData: any[] = [];

  beforeEach(async () => {
    usersData = [];
    sessionsData = [];
    passwordResetTokensData = [];

    fakeDb = {
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
                    (t) => t.tokenHash === args[0] && t.usedAt === null && t.expiresAt > args[1],
                  ) || null
                );
              }

              return null;
            },

            run: async () => {
              if (normalized.includes('INSERT INTO companies')) {
                return { success: true };
              }

              if (normalized.includes('INSERT INTO users')) {
                usersData.push({
                  id: usersData.length + 1,
                  companyId: args[0],
                  email: args[1],
                  passwordHash: args[2],
                  passwordSalt: args[3],
                  role: args[4],
                  status: 'active',
                  mustChangePassword: 0,
                });
              }

              if (normalized.includes('INSERT INTO sessions')) {
                sessionsData.push({
                  userId: args[0],
                  token: args[1],
                  expiresAt: args[2],
                });
              }

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

              if (normalized.includes('UPDATE password_reset_tokens SET used_at')) {
                const token = passwordResetTokensData.find((t) => t.id === args[1]);

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
    } as Env;

    await fakeDb
      .prepare('INSERT INTO companies (name, slug) VALUES (?, ?)')
      .bind('Acme', 'acme')
      .run();

    const salt = generateSalt();
    const hash = await hashPassword('password123', salt);

    await fakeDb.prepare('INSERT INTO users').bind(1, 'test@example.com', hash, salt, 'user').run();
  });

  it('should login successfully with correct credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await handleAuthRoute('/api/auth/login', request, env);

    expect(response).not.toBeNull();

    const data = (await response!.json()) as any;

    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should fail login with wrong password', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong',
      }),
    });

    const response = await handleAuthRoute('/api/auth/login', request, env);

    expect(response).not.toBeNull();

    const data = (await response!.json()) as any;

    expect(response?.status).toBe(401);
    expect(data.error).toBe('Credenciales inválidas');
  });
});
