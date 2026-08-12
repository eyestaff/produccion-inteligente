import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Env } from '../worker/index';
import { router } from '../worker/router';
import BetterSqlite3Database from 'better-sqlite3';

function getTestDb(schema: string) {
  const sqliteDb = new BetterSqlite3Database(':memory:');
  sqliteDb.exec(schema);

  // Wrap to emulate D1
  const db = {
    prepare: (query: string) => {
      const stmt = sqliteDb.prepare(query);
      const bindAndRun = (...params: any[]) => {
        return {
          first: () => stmt.get(...params),
          all: () => ({ results: stmt.all(...params) }),
          run: () => stmt.run(...params),
        };
      };
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

const companyId = 1;
const storeId = 1;
const productId = 1;

beforeAll(async () => {
  db = getTestDb(`
    CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, business_line_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reserved_quantity INTEGER NOT NULL DEFAULT 0, available_quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, lot_id INTEGER, type TEXT NOT NULL, quantity_change INTEGER NOT NULL, reason TEXT NOT NULL, created_by INTEGER NOT NULL, source_module TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'active', must_change_password INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, user_id INTEGER NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
  env = {
    DB: db,
    ASSETS: {} as any,
    PROJECT_NAME: 'Test',
    APP_URL: 'https://test.example.com',
    BREVO_API_KEY: 'test-brevo-key',
  };

  db.exec(`INSERT INTO companies (name, slug) VALUES ('Test Company', 'test-company')`);
  db.exec(`INSERT INTO stores (company_id, name, code) VALUES (${companyId}, 'Tienda 1', 'T1')`);
  db.exec(
    `INSERT INTO business_lines (company_id, name, code) VALUES (${companyId}, 'Linea', 'L')`,
  );
  db.exec(
    `INSERT INTO products (company_id, business_line_id, store_id, name, code) VALUES (${companyId}, 1, ${storeId}, 'Empanada', 'EMP')`,
  );
  db.exec(
    `INSERT INTO users (id, company_id, email, password_hash, password_salt) VALUES (1, ${companyId}, 'test@test.com', 'x', 'y')`,
  );
  db.exec(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ('test-token', 1, datetime('now', '+1 day'))`,
  );

  // Create an initial inventory
  db.exec(
    `INSERT INTO inventory (company_id, store_id, product_id, quantity, available_quantity) VALUES (${companyId}, ${storeId}, ${productId}, 100, 100)`,
  );
});

afterAll(() => {
  if (db) {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.close();
  }
});

const makeRequest = async (method: string, path: string, body?: any) => {
  return router(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
        'x-test-auth-company': companyId.toString(),
        'x-test-auth-user': '1',
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );
};

describe('Waste API', () => {
  it('should register waste and deduct from inventory', async () => {
    const res = await makeRequest('POST', `/api/waste/${storeId}`, {
      productId,
      quantity: 10,
      reason: 'caducity',
      notes: 'Some notes',
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.updatedStock).toBe(90);

    // Verify inventory_transactions
    const tx = db
      .prepare(`SELECT * FROM inventory_transactions WHERE type = 'out' AND reason = 'caducity'`)
      .first() as any;
    expect(tx).toBeDefined();
    expect(tx.quantity_change).toBe(-10);
    expect(tx.source_module).toBe('WasteManagement');
    expect(tx.reference_type).toBe('Some notes'); // The notes are stored here
  });

  it('should list waste history', async () => {
    const res = await makeRequest('GET', `/api/waste/${storeId}`);
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list.length).toBe(1);
    expect(list[0].quantity).toBe(10);
    expect(list[0].reason).toBe('caducity');
    expect(list[0].notes).toBe('Some notes');
  });

  it('should return waste metrics', async () => {
    const res = await makeRequest('GET', `/api/waste/${storeId}/metrics`);
    expect(res.status).toBe(200);
    const metrics = (await res.json()) as any;
    expect(metrics.dailyWaste).toBe(10);
    expect(metrics.weeklyWaste).toBe(10);
    expect(metrics.topProduct).toBe('Empanada');
    expect(metrics.topProductWaste).toBe(10);
    expect(metrics.estimatedCost).toBe(25);
  });
});
