import { describe, expect, it, beforeEach } from 'vitest';
import { router } from '../worker/router';
import { Env } from '../worker/index';
import Database from 'better-sqlite3';

function createInMemoryDb() {
  return new Database(':memory:');
}

async function setupDb(db: any) {
  await db.exec(`
    CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', status TEXT NOT NULL DEFAULT 'active', must_change_password INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, token TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, parent_id INTEGER, name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, business_line_id INTEGER, category_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'finished_good', base_unit TEXT NOT NULL DEFAULT 'u', cost REAL NOT NULL DEFAULT 0, price REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, product_id INTEGER, name TEXT NOT NULL, yield_quantity REAL NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, recipe_id INTEGER, product_id INTEGER, quantity REAL NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity REAL NOT NULL DEFAULT 0, reserved_quantity REAL NOT NULL DEFAULT 0, available_quantity REAL NOT NULL DEFAULT 0, min_stock REAL NOT NULL DEFAULT 0, max_stock REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(store_id, product_id));
    CREATE TABLE inventory_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, lot_id INTEGER, type TEXT NOT NULL, quantity_change REAL NOT NULL, reason TEXT NOT NULL, created_by INTEGER NOT NULL, source_module TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, business_line_id INTEGER, status TEXT NOT NULL DEFAULT 'planned', target_quantity REAL NOT NULL DEFAULT 0, actual_quantity REAL NOT NULL DEFAULT 0, started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, production_order_id INTEGER, product_id INTEGER, quantity REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE production_order_bom (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, production_order_id INTEGER, product_id INTEGER, planned_quantity REAL NOT NULL DEFAULT 0, actual_quantity REAL NOT NULL DEFAULT 0, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE purchase_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, status TEXT NOT NULL DEFAULT 'pending', suggested_quantity REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE forecasts (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, target_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE forecast_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, forecast_id INTEGER, product_id INTEGER, historical_base REAL NOT NULL DEFAULT 0, suggested_quantity REAL NOT NULL DEFAULT 0, adjusted_quantity REAL NOT NULL DEFAULT 0, actual_consumption REAL NOT NULL DEFAULT 0, deviation_percentage REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
}

async function seedData(db: any) {
  // 1. Company
  db.exec("INSERT INTO companies (name, slug) VALUES ('Test Company', 'test-company');");
  // 2. User
  db.exec(
    "INSERT INTO users (company_id, email, password_hash, password_salt) VALUES (1, 'test@example.com', 'hash', 'salt');",
  );
  // 3. Session
  db.exec(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES (1, 'test-token', 9999999999999);",
  );
  // 4. Store
  db.exec("INSERT INTO stores (company_id, name, code) VALUES (1, 'Store 1', 'ST1');");
  // 5. Business Line
  db.exec("INSERT INTO business_lines (company_id, name, code) VALUES (1, 'Bakery', 'BAK');");
  // 6. Products
  db.exec(
    "INSERT INTO products (company_id, business_line_id, name, code, type) VALUES (1, 1, 'Croissant', 'CRO', 'finished_good');",
  );
  db.exec(
    "INSERT INTO products (company_id, business_line_id, name, code, type) VALUES (1, 1, 'Harina', 'HAR', 'raw_material');",
  );
  // 7. Inventory
  db.exec(
    'INSERT INTO inventory (company_id, store_id, product_id, available_quantity) VALUES (1, 1, 1, 10);',
  ); // Croissant
  db.exec(
    'INSERT INTO inventory (company_id, store_id, product_id, available_quantity) VALUES (1, 1, 2, 50);',
  ); // Harina
  // 8. Recipe for Croissant
  db.exec(
    "INSERT INTO recipes (company_id, product_id, name, status) VALUES (1, 1, 'Croissant Recipe', 'active');",
  );
  // 9. Consume past inventory for history
  db.exec(
    "INSERT INTO inventory_transactions (company_id, store_id, product_id, type, quantity_change, reason, created_by, source_module, created_at) VALUES (1, 1, 1, 'out', -150, 'sales', 1, 'Test', DATE('now', '-5 days'));",
  ); // 150 sold in 7d
  db.exec(
    "INSERT INTO inventory_transactions (company_id, store_id, product_id, type, quantity_change, reason, created_by, source_module, created_at) VALUES (1, 1, 1, 'out', -600, 'sales', 1, 'Test', DATE('now', '-25 days'));",
  ); // 600 sold before, total 750 in 30d
}

describe('Forecast API Integration', () => {
  let db: any;
  let env: Env;

  beforeEach(async () => {
    db = createInMemoryDb();
    await setupDb(db);
    await seedData(db);

    // Monkey patch better-sqlite3 to act like D1 for users.repository.ts
    const originalPrepare = db.prepare.bind(db);
    db.prepare = (sql: string) => {
      const stmt = originalPrepare(sql);
      stmt.bind = (...params: any[]) => {
        const boundStmt = { ...stmt };
        boundStmt.first = () => stmt.get(...params);
        boundStmt.all = () => ({ results: stmt.all(...params) });
        boundStmt.run = () => stmt.run(...params);
        return boundStmt;
      };
      return stmt;
    };

    env = {
      DB: db as unknown as D1Database,
      ASSETS: null as any,
      PROJECT_NAME: 'test',
      APP_URL: 'http://localhost',
      BREVO_API_KEY: 'test',
    };
  });

  it('GET /api/forecast/:storeId/dashboard should generate recommendations', async () => {
    const request = new Request('http://localhost/api/forecast/1/dashboard', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token',
      },
    });

    const response = await router(request, env);
    expect(response.status).toBe(200);

    const data = (await response.json()) as any;
    expect(data.recommendations).toBeDefined();
    expect(data.risks).toBeDefined();

    // Check Croissant recommendation
    const croissantRec = data.recommendations.find((r: any) => r.productId === 1);
    expect(croissantRec).toBeDefined();
    expect(croissantRec.type).toBe('produce');
    expect(croissantRec.metrics.consumption30d).toBe(750); // 150 + 600
    expect(croissantRec.metrics.consumption7d).toBe(150);
  });

  it('POST /api/forecast/:storeId/approve should create production orders', async () => {
    const request = new Request('http://localhost/api/forecast/1/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetDate: '2026-08-15',
        items: [
          {
            productId: 1, // Croissant
            type: 'produce',
            historicalBase: 25,
            suggestedQuantity: 30,
            adjustedQuantity: 30, // Will produce 30
          },
        ],
      }),
    });

    const response = await router(request, env);
    expect(response.status).toBe(201);

    const data = (await response.json()) as any;
    expect(data.success).toBe(true);
    expect(data.forecastId).toBeDefined();

    // Verify forecast was saved
    const forecastRows = db.prepare('SELECT * FROM forecasts WHERE id = ?').all(data.forecastId);
    expect(forecastRows.length).toBe(1);

    // Verify production order was created
    const poRows = db
      .prepare('SELECT * FROM production_orders WHERE company_id = 1 AND store_id = 1')
      .all();
    expect(poRows.length).toBe(1);
    expect(poRows[0].status).toBe('planned');
  });
});
