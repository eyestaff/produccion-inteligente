import { describe, it, expect, beforeEach } from 'vitest';
import type { Env } from '../worker';
import { handleAuthRoute } from '../worker/routes/auth.routes';
import { hashPassword, generateSalt } from '../worker/services/auth.service';

describe('Auth API', () => {
  let env: Env;
  let fakeDb: any;
  let usersData: any[] = [];
  let sessionsData: any[] = [];

  beforeEach(async () => {
    usersData = [];
    sessionsData = [];

    fakeDb = {
      prepare: (sql: string) => {
        const normalized = sql.trim();
        return {
          bind: (...args: any[]) => {
            return {
              first: async () => {
                if (normalized.includes('FROM users WHERE email = ?')) {
                  return usersData.find((u) => u.email === args[0]) || null;
                }
                return null;
              },
              run: async () => {
                if (normalized.includes('INSERT INTO users')) {
                  usersData.push({
                    id: usersData.length + 1,
                    email: args[0],
                    passwordHash: args[1],
                    passwordSalt: args[2],
                    role: args[3],
                    status: 'active',
                  });
                }
                if (normalized.includes('INSERT INTO sessions')) {
                  sessionsData.push({
                    userId: args[0],
                    token: args[1],
                    expiresAt: args[2],
                  });
                }
                return { success: true };
              },
            };
          },
        };
      },
    };

    env = { DB: fakeDb } as Env;

    const salt = generateSalt();
    const hash = await hashPassword('password123', salt);
    await fakeDb.prepare('INSERT INTO users').bind('test@example.com', hash, salt, 'user').run();
  });

  it('should login successfully with correct credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
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
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    const response = await handleAuthRoute('/api/auth/login', request, env);
    expect(response).not.toBeNull();
    const data = (await response!.json()) as any;
    expect(response?.status).toBe(401);
    expect(data.error).toBe('Credenciales inválidas');
  });
});
