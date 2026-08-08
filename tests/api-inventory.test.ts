import { describe, expect, it } from 'vitest';
import { createMockContext } from './fakes/context';
import { InventoryService } from '../worker/services/inventory.service';
import { createStore, createBusinessLine, createProduct } from '../worker/db/repositories';
import Database from 'better-sqlite3';

function createInMemoryDb() {
  return new Database(':memory:');
}

async function setupDb(db: any) {
  await db.exec(`
    CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, parent_id INTEGER, name TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, business_line_id INTEGER, category_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'finished_good', base_unit TEXT NOT NULL DEFAULT 'u', cost REAL NOT NULL DEFAULT 0, price REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity REAL NOT NULL DEFAULT 0, reserved_quantity REAL NOT NULL DEFAULT 0, available_quantity REAL NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, lot_id INTEGER, type TEXT NOT NULL, quantity_change REAL NOT NULL, reason TEXT NOT NULL, created_by INTEGER NOT NULL, source_module TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
}

describe('InventoryService - API Integration', () => {
  it('should maintain inventory ledger invariants and multi-tenant isolation', async () => {
    const sqlite = createInMemoryDb();
    await setupDb(sqlite);
    const db = sqlite as unknown as D1Database;

    const ctxA = createMockContext(1);
    const ctxB = createMockContext(2);

    const serviceA = new InventoryService(db as any, ctxA);
    const serviceB = new InventoryService(db as any, ctxB);

    const bLine = await createBusinessLine(db as any, ctxA, { name: 'Linea', code: 'L' });
    const storeA = await createStore(db as any, ctxA, { name: 'Tienda A', code: 'TA' });
    const productA = await createProduct(db as any, ctxA, {
      businessLineId: bLine.id,
      name: 'Harina',
      code: 'HAR',
    });

    // 1. Initial manual adjustment (+100kg)
    const adj1 = await serviceA.adjustInventory(storeA.id, productA.id, 100, 'adjustment');
    expect(adj1.quantity).toBe(100);
    expect(adj1.availableQuantity).toBe(100);

    // 2. Reserve for production (10kg)
    const adj2 = await serviceA.reserveForProduction(storeA.id, productA.id, 10, 999);
    expect(adj2.quantity).toBe(100); // Physical remains
    expect(adj2.reservedQuantity).toBe(10);
    expect(adj2.availableQuantity).toBe(90);

    // 3. Merma/Theft (-5kg)
    const adj3 = await serviceA.adjustInventory(storeA.id, productA.id, -5, 'theft');
    expect(adj3.quantity).toBe(95);
    expect(adj3.reservedQuantity).toBe(10);
    expect(adj3.availableQuantity).toBe(85);

    // 4. Ledger validation
    const txs = await serviceA.getTransactions(storeA.id, productA.id);
    expect(txs.length).toBe(3);

    // Ordered by DESC id
    expect(txs[0].reason).toBe('theft');
    expect(txs[0].quantityChange).toBe(-5);

    expect(txs[1].reason).toBe('production');
    expect(txs[1].quantityChange).toBe(10); // reserve

    expect(txs[2].reason).toBe('adjustment');
    expect(txs[2].quantityChange).toBe(100);

    // Ensure all transactions have createdBy = ctxA.userId
    txs.forEach((t: any) => expect(t.createdBy).toBe(ctxA.userId));

    // 5. Multi-tenant
    const listB = await serviceB.getStoreInventory(storeA.id);
    expect(listB.length).toBe(0);
    const txsB = await serviceB.getTransactions(storeA.id, productA.id);
    expect(txsB.length).toBe(0);
  });
});
