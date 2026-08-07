import { describe, expect, it } from 'vitest';
import { createMockContext } from './fakes/context';
import { ProductionService } from '../worker/services/production.service';
import {
  createStore,
  createBusinessLine,
  createProduct,
  createRecipe,
  createRecipeItem,
  recordInventoryTransaction,
} from '../worker/db/repositories';
import { InventoryService } from '../worker/services/inventory.service';
import Database from 'better-sqlite3';

function createInMemoryDb() {
  return new Database(':memory:');
}

async function setupDb(db: any) {
  await db.exec(`
    CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, business_line_id INTEGER, store_id INTEGER, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, product_id INTEGER, name TEXT NOT NULL, yield_quantity INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, recipe_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, reserved_quantity INTEGER NOT NULL DEFAULT 0, available_quantity INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE inventory_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, product_id INTEGER, lot_id INTEGER, type TEXT NOT NULL, quantity_change INTEGER NOT NULL, reason TEXT NOT NULL, created_by INTEGER NOT NULL, source_module TEXT NOT NULL, reference_type TEXT, reference_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, store_id INTEGER, business_line_id INTEGER, status TEXT NOT NULL DEFAULT 'planned', target_quantity INTEGER NOT NULL DEFAULT 0, started_at TEXT, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, production_order_id INTEGER, product_id INTEGER, quantity INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
}

describe('ProductionService - API Integration', () => {
  it('should orchestrate a complete production cycle with recipe explosion and atomic inventory backflushing', async () => {
    const sqlite = createInMemoryDb();
    await setupDb(sqlite);
    const db = sqlite as unknown as D1Database;

    const ctx = createMockContext(1);
    const prodService = new ProductionService(db as any, ctx);
    const invService = new InventoryService(db as any, ctx);

    const bLine = await createBusinessLine(db as any, ctx, { name: 'Panadería', code: 'PAN' });
    const store = await createStore(db as any, ctx, { name: 'Tienda A', code: 'TA' });

    // Insumo
    const harina = await createProduct(db as any, ctx, {
      businessLineId: bLine.id,
      storeId: store.id,
      name: 'Harina',
      code: 'HAR',
    });
    // Producto Final
    const pan = await createProduct(db as any, ctx, {
      businessLineId: bLine.id,
      storeId: store.id,
      name: 'Pan',
      code: 'PAN1',
    });

    // Inyectar 100kg de Harina
    await recordInventoryTransaction(db as any, ctx, {
      storeId: store.id,
      productId: harina.id,
      type: 'in',
      quantityChange: 100,
      reason: 'adjustment',
      sourceModule: 'TestModule',
    });

    // Crear Receta (rinde 10 panes, usa 2kg de harina)
    const recipe = await createRecipe(db as any, ctx, {
      productId: pan.id,
      name: 'Receta Pan',
      yieldQuantity: 10,
      status: 'active',
    });
    await createRecipeItem(db as any, ctx, {
      recipeId: recipe.id,
      productId: harina.id,
      quantity: 2,
    });

    // 1. Planificar orden de 100 panes
    const order = await prodService.planOrder(store.id, bLine.id, [
      { productId: pan.id, quantity: 100 },
    ]);
    expect(order.status).toBe('planned');
    expect(order.targetQuantity).toBe(100);

    // 2. Completar orden (Backflushing Atómico)
    await prodService.completeOrder(order.id);
    const completedOrder = await prodService.get(order.id);
    expect(completedOrder.status).toBe('completed');

    // 3. Validar inventario
    // Harina deberia ser 100 - (100/10)*2 = 100 - 20 = 80kg
    const snapHarina = await invService.getStoreInventory(store.id);
    const h = snapHarina.find((i: any) => i.productId === harina.id);
    expect(h.quantity).toBe(80);

    // Pan deberia ser 0 + 100 = 100 unidades
    const p = snapHarina.find((i: any) => i.productId === pan.id);
    expect(p.quantity).toBe(100);

    // 4. Idempotencia
    await expect(prodService.completeOrder(order.id)).rejects.toThrow('ORDER_ALREADY_CLOSED');
  });
});
