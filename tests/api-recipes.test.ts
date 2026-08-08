import { describe, expect, it } from 'vitest';
import { createMockContext } from './fakes/context';
import { RecipesService } from '../worker/services/recipes.service';
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
    CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, product_id INTEGER, name TEXT NOT NULL, yield_quantity INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, recipe_id INTEGER, product_id INTEGER, quantity REAL NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'u', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
}

describe('RecipesService - API Integration', () => {
  it('should create, list, update and delete recipes and items with multi-tenant isolation', async () => {
    const sqlite = createInMemoryDb();
    await setupDb(sqlite);
    const db = sqlite as unknown as D1Database;

    const ctxA = createMockContext(1);
    const ctxB = createMockContext(2);

    const serviceA = new RecipesService(db as any, ctxA);
    const serviceB = new RecipesService(db as any, ctxB);

    // Setup basic products
    const bLineA = await createBusinessLine(db as any, ctxA, { name: 'Linea A', code: 'LA' });
    await createStore(db as any, ctxA, { name: 'Store A', code: 'SA' });
    const productA = await createProduct(db as any, ctxA, {
      businessLineId: bLineA.id,
      name: 'Product Final',
      code: 'PF',
    });
    const productIngredient = await createProduct(db as any, ctxA, {
      businessLineId: bLineA.id,
      name: 'Flour',
      code: 'FL',
    });

    // 1. Create Recipe for A
    const recipeA = await serviceA.create({
      productId: productA.id,
      name: 'Masa Madre',
      yieldQuantity: 10,
    });
    expect(recipeA.name).toBe('Masa Madre');
    expect(recipeA.yieldQuantity).toBe(10);

    // 2. Add Item to Recipe A
    await serviceA.addItem(recipeA.id, {
      productId: productIngredient.id,
      quantity: 5,
      unit: 'kg',
    });

    // 3. Get Recipe A with Items
    const fetchedRecipe = await serviceA.get(recipeA.id);
    expect(fetchedRecipe.items).toHaveLength(1);
    expect(fetchedRecipe.items[0].quantity).toBe(5);

    // 4. Update Recipe A
    await serviceA.update(recipeA.id, { yieldQuantity: 15 });
    const updatedRecipe = await serviceA.get(recipeA.id);
    expect(updatedRecipe.yieldQuantity).toBe(15);

    // 5. Multi-tenant isolation: B cannot see A's recipe
    const listB = await serviceB.list();
    expect(listB).toHaveLength(0);

    // B creates its own recipe
    const recipeB = await serviceB.create({
      productId: 99,
      name: 'Receta Secreta B',
    });
    expect(recipeB.yieldQuantity).toBe(1); // default

    const listA = await serviceA.list();
    expect(listA).toHaveLength(1); // Still only sees its own

    // 6. Delete item and recipe A
    await serviceA.removeItem(recipeA.id, fetchedRecipe.items[0].id);
    const afterDeleteItems = await serviceA.get(recipeA.id);
    expect(afterDeleteItems.items).toHaveLength(0);

    await serviceA.delete(recipeA.id);
    const listAAfterDelete = await serviceA.list();
    expect(listAAfterDelete).toHaveLength(0);
  });
});
