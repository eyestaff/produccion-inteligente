import { createMockContext } from './fakes/context';
import { describe, expect, it } from 'vitest';
import {
  createStore,
  createBusinessLine,
  createProduct,
  createRecipe,
  createRecipeItem,
  recordInventoryTransaction,
  createProductionOrder,
  createProductionOrderItem,
  createWasteRecord,
  listStores,
  listBusinessLines,
  listProducts,
  listInventoryEntries,
  listProductionOrders,
  listWasteRecords,
} from '../worker/db/repositories';
import Database from 'better-sqlite3';

function createInMemoryDb() {
  return new Database(':memory:');
}

describe('d1 data model', () => {
  it('creates and lists catalog and operational entities', async () => {
    const sqlite = createInMemoryDb();
    const db = sqlite as unknown as D1Database;

    await db.exec(`
      CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, business_line_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (business_line_id) REFERENCES business_lines(id), FOREIGN KEY (store_id) REFERENCES stores(id));
      CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, product_id INTEGER, name TEXT NOT NULL, yield_quantity INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, recipe_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (recipe_id) REFERENCES recipes(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reserved_quantity INTEGER NOT NULL DEFAULT 0, available_quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE inventory_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, lot_id INTEGER, type TEXT NOT NULL, quantity_change INTEGER NOT NULL, reason TEXT NOT NULL, created_by INTEGER NOT NULL, source_module TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, business_line_id INTEGER, status TEXT NOT NULL DEFAULT 'planned', target_quantity INTEGER NOT NULL DEFAULT 0, actual_quantity INTEGER NOT NULL DEFAULT 0, started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (business_line_id) REFERENCES business_lines(id));
      CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, production_order_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (production_order_id) REFERENCES production_orders(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE waste_records (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL DEFAULT 'unknown', recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id));
    `);

    const store = await createStore(db, createMockContext(1), { name: 'Tienda 1', code: 'T1' });
    const businessLine = await createBusinessLine(db, createMockContext(1), {
      name: 'Línea A',
      code: 'LA',
    });
    const product = await createProduct(db, createMockContext(1), {
      businessLineId: businessLine.id,
      storeId: store.id,
      code: 'P1',
      name: 'Producto A',
    });
    const recipe = await createRecipe(db, createMockContext(1), {
      productId: product.id,
      name: 'Receta A',
    });
    await createRecipeItem(db, createMockContext(1), {
      recipeId: recipe.id,
      productId: product.id,
      quantity: 2,
      unit: 'u',
    });
    await recordInventoryTransaction(db, createMockContext(1), {
      storeId: store.id,
      productId: product.id,
      type: 'in',
      quantityChange: 100,
      reason: 'adjustment',
      sourceModule: 'TestModule',
    });
    const order = await createProductionOrder(db, createMockContext(1), {
      storeId: store.id,
      businessLineId: businessLine.id,
      targetQuantity: 5,
      status: 'planned',
    });
    await createProductionOrderItem(db, createMockContext(1), {
      productionOrderId: order.id,
      productId: product.id,
      quantity: 5,
    });
    await createWasteRecord(db, createMockContext(1), {
      storeId: store.id,
      productId: product.id,
      quantity: 1,
      reason: 'breakage',
    });

    expect(await listStores(db, createMockContext(1))).toHaveLength(1);
    expect(await listBusinessLines(db, createMockContext(1))).toHaveLength(1);
    expect(await listProducts(db, createMockContext(1))).toHaveLength(1);
    expect(await listInventoryEntries(db, createMockContext(1))).toHaveLength(1);
    expect(await listProductionOrders(db, createMockContext(1))).toHaveLength(1);
    expect(await listWasteRecords(db, createMockContext(1))).toHaveLength(1);
  });
});
