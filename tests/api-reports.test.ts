import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Env } from '../worker/index';
import { router } from '../worker/router';
import BetterSqlite3Database from 'better-sqlite3';

function getTestDb(schema: string) {
  const sqliteDb = new BetterSqlite3Database(':memory:');
  sqliteDb.exec(schema);

  const db = {
    prepare: (query: string) => {
      const stmt = sqliteDb.prepare(query);

      const bindAndRun = (...params: any[]) => ({
        first: () => stmt.get(...params),
        all: () => ({ results: stmt.all(...params) }),
        run: () => stmt.run(...params),
      });

      return {
        bind: bindAndRun,
        first: () => stmt.get(),
        all: () => ({ results: stmt.all() }),
        run: () => stmt.run(),
      };
    },
    exec: (q: string) => sqliteDb.exec(q),
    close: () => sqliteDb.close(),
  };

  return db as any;
}

let db: any;
let env: Env;

beforeAll(() => {
  db = getTestDb(`
    CREATE TABLE companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  env = {
    DB: db,
    ASSETS: {} as any,
    PROJECT_NAME: 'Test',
    APP_URL: 'https://test.example.com',
    BREVO_API_KEY: 'test-brevo-key',
  };

  db.exec(
    `INSERT INTO companies (id, name, slug) VALUES (1, 'Test Company', 'test-company')`,
  );

  db.exec(
    `INSERT INTO users (id, company_id, email, password_hash, password_salt)
     VALUES (1, 1, 'test@test.com', 'x', 'y')`,
  );

  db.exec(
    `INSERT INTO sessions (token, user_id, expires_at)
     VALUES ('test-token', 1, datetime('now', '+1 day'))`,
  );
});

afterAll(() => {
  if (db) {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.close();
  }
});

describe('Reports API', () => {
  it('should return the executive report for the authenticated company', async () => {
    const res = await router(
      new Request('http://localhost/api/reports/executive', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-token',
          'x-test-auth-company': '1',
          'x-test-auth-user': '1',
        },
      }),
      env,
    );

    expect(res.status).toBe(200);

    const body = (await res.json()) as any;

    expect(body.success).toBe(true);
    expect(body.report.type).toBe('executive');
    expect(body.report.companyId).toBe(1);
    expect(body.report.title).toBe('Resumen Ejecutivo');
    expect(body.report.project).toBe('Producción Inteligente');
    expect(body.report.generatedAt).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    const res = await router(
      new Request('http://localhost/api/reports/executive', {
        method: 'GET',
      }),
      env,
    );

    expect(res.status).toBe(401);
  });
});
