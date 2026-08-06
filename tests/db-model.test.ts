import { describe, expect, it } from 'vitest';
import {
  createStore,
  createBusinessLine,
  createProduct,
  createRecipe,
  createRecipeItem,
  createInventoryEntry,
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
      CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, business_line_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (business_line_id) REFERENCES business_lines(id), FOREIGN KEY (store_id) REFERENCES stores(id));
      CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, name TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (recipe_id) REFERENCES recipes(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reserved_quantity INTEGER NOT NULL DEFAULT 0, available_quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER, business_line_id INTEGER, status TEXT NOT NULL DEFAULT 'planned', target_quantity INTEGER NOT NULL DEFAULT 0, started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (business_line_id) REFERENCES business_lines(id));
      CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, production_order_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (production_order_id) REFERENCES production_orders(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE waste_records (id INTEGER PRIMARY KEY AUTOINCREMENT, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL DEFAULT 'unknown', recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id));
    `);

    const store = await createStore(db, { name: 'Tienda 1', code: 'T1' });
    const businessLine = await createBusinessLine(db, { name: 'Línea A', code: 'LA' });
    const product = await createProduct(db, {
      businessLineId: businessLine.id,
      storeId: store.id,
      code: 'P1',
      name: 'Producto A',
    });
    const recipe = await createRecipe(db, { productId: product.id, name: 'Receta A' });
    await createRecipeItem(db, {
      recipeId: recipe.id,
      productId: product.id,
      quantity: 2,
      unit: 'u',
    });
    await createInventoryEntry(db, {
      storeId: store.id,
      productId: product.id,
      quantity: 10,
      reservedQuantity: 2,
      availableQuantity: 8,
    });
    const order = await createProductionOrder(db, {
      storeId: store.id,
      businessLineId: businessLine.id,
      targetQuantity: 5,
      status: 'planned',
    });
    await createProductionOrderItem(db, {
      productionOrderId: order.id,
      productId: product.id,
      quantity: 5,
    });
    await createWasteRecord(db, {
      storeId: store.id,
      productId: product.id,
      quantity: 1,
      reason: 'breakage',
    });

    expect(await listStores(db)).toHaveLength(1);
    expect(await listBusinessLines(db)).toHaveLength(1);
    expect(await listProducts(db)).toHaveLength(1);
    expect(await listInventoryEntries(db)).toHaveLength(1);
    expect(await listProductionOrders(db)).toHaveLength(1);
    expect(await listWasteRecords(db)).toHaveLength(1);
  });
});
