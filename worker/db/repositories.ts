type SqlStatement = {
  bind?: (...values: unknown[]) => SqlStatement;
  run?: (...values: unknown[]) => unknown;
  first?: () => Promise<unknown> | unknown;
  all?: () => Promise<unknown> | unknown;
  get?: (...values: unknown[]) => unknown;
};

type SqlDatabase = {
  prepare: (sql: string) => SqlStatement;
  exec?: (sql: string) => Promise<unknown> | unknown;
};

export type Database = D1Database | SqlDatabase;

export function createDbClient(db: Database) {
  return db;
}

export async function initializeSchema(db: Database) {
  if (typeof db.exec === 'function') {
    await db.exec('SELECT 1');
  }
}

async function runStatement(
  db: Database,
  sql: string,
  params: unknown[] = [],
  mode: 'run' | 'get' | 'all' = 'run',
) {
  const statement = db.prepare(sql);
  const isD1Statement =
    typeof statement.bind === 'function' && typeof statement.first === 'function';
  if (isD1Statement) {
    if (params.length > 0) {
      statement.bind(...params);
    }
    if (mode === 'get') {
      return statement.first ? await statement.first() : undefined;
    }
    if (mode === 'all') {
      return statement.all ? await statement.all() : [];
    }
    return statement.run ? await statement.run() : undefined;
  }

  if (mode === 'get') {
    return statement.get ? statement.get(...params) : undefined;
  }
  if (mode === 'all') {
    return statement.all ? statement.all(...params) : [];
  }
  return statement.run ? statement.run(...params) : undefined;
}

export async function createStore(
  db: Database,
  input: { name: string; code: string; status?: string },
) {
  const result = await runStatement(
    db,
    'INSERT INTO stores (name, code, status) VALUES (?, ?, ?)',
    [input.name, input.code, input.status ?? 'active'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, name, code, status FROM stores WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function listStores(db: Database) {
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM stores ORDER BY id ASC',
    [],
    'all',
  );
}

export async function getStoreById(db: Database, id: number) {
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE id = ?',
    [id],
    'get',
  );
}

export async function updateStore(
  db: Database,
  id: number,
  input: Partial<{ name: string; code: string; status: string }>,
) {
  const columns: string[] = [];
  const values: unknown[] = [];
  if (input.name !== undefined) {
    columns.push('name = ?');
    values.push(input.name);
  }
  if (input.code !== undefined) {
    columns.push('code = ?');
    values.push(input.code);
  }
  if (input.status !== undefined) {
    columns.push('status = ?');
    values.push(input.status);
  }
  if (!columns.length) {
    return undefined;
  }
  values.push(id);
  return runStatement(db, `UPDATE stores SET ${columns.join(', ')} WHERE id = ?`, values, 'run');
}

export async function deleteStore(db: Database, id: number) {
  return runStatement(db, 'DELETE FROM stores WHERE id = ?', [id], 'run');
}

export async function createBusinessLine(
  db: Database,
  input: { name: string; code: string; status?: string },
) {
  const result = await runStatement(
    db,
    'INSERT INTO business_lines (name, code, status) VALUES (?, ?, ?)',
    [input.name, input.code, input.status ?? 'active'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, name, code, status FROM business_lines WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function listBusinessLines(db: Database) {
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM business_lines ORDER BY id ASC',
    [],
    'all',
  );
}

export async function createProduct(
  db: Database,
  input: {
    businessLineId?: number | null;
    storeId?: number | null;
    code: string;
    name: string;
    status?: string;
  },
) {
  const result = await runStatement(
    db,
    'INSERT INTO products (business_line_id, store_id, code, name, status) VALUES (?, ?, ?, ?, ?)',
    [
      input.businessLineId ?? null,
      input.storeId ?? null,
      input.code,
      input.name,
      input.status ?? 'active',
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status FROM products WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function listProducts(db: Database) {
  return runStatement(
    db,
    'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status, created_at AS createdAt FROM products ORDER BY id ASC',
    [],
    'all',
  );
}

export async function createRecipe(
  db: Database,
  input: { productId?: number | null; name: string; version?: number; status?: string },
) {
  const result = await runStatement(
    db,
    'INSERT INTO recipes (product_id, name, version, status) VALUES (?, ?, ?, ?)',
    [input.productId ?? null, input.name, input.version ?? 1, input.status ?? 'draft'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, product_id AS productId, name, version, status FROM recipes WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function createRecipeItem(
  db: Database,
  input: { recipeId?: number | null; productId?: number | null; quantity?: number; unit?: string },
) {
  const result = await runStatement(
    db,
    'INSERT INTO recipe_items (recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?)',
    [input.recipeId ?? null, input.productId ?? null, input.quantity ?? 1, input.unit ?? 'u'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function createInventoryEntry(
  db: Database,
  input: {
    storeId?: number | null;
    productId?: number | null;
    quantity?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
  },
) {
  const result = await runStatement(
    db,
    'INSERT INTO inventory (store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, ?, ?)',
    [
      input.storeId ?? null,
      input.productId ?? null,
      input.quantity ?? 0,
      input.reservedQuantity ?? 0,
      input.availableQuantity ?? 0,
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function createProductionOrder(
  db: Database,
  input: {
    storeId?: number | null;
    businessLineId?: number | null;
    status?: string;
    targetQuantity?: number;
    startedAt?: string | null;
    completedAt?: string | null;
  },
) {
  const result = await runStatement(
    db,
    'INSERT INTO production_orders (store_id, business_line_id, status, target_quantity, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      input.storeId ?? null,
      input.businessLineId ?? null,
      input.status ?? 'planned',
      input.targetQuantity ?? 0,
      input.startedAt ?? null,
      input.completedAt ?? null,
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function createProductionOrderItem(
  db: Database,
  input: { productionOrderId?: number | null; productId?: number | null; quantity?: number },
) {
  const result = await runStatement(
    db,
    'INSERT INTO production_order_items (production_order_id, product_id, quantity) VALUES (?, ?, ?)',
    [input.productionOrderId ?? null, input.productId ?? null, input.quantity ?? 0],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, production_order_id AS productionOrderId, product_id AS productId, quantity FROM production_order_items WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function createWasteRecord(
  db: Database,
  input: { storeId?: number | null; productId?: number | null; quantity?: number; reason?: string },
) {
  const result = await runStatement(
    db,
    'INSERT INTO waste_records (store_id, product_id, quantity, reason) VALUES (?, ?, ?, ?)',
    [
      input.storeId ?? null,
      input.productId ?? null,
      input.quantity ?? 0,
      input.reason ?? 'unknown',
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE id = ?',
    [id ?? 1],
    'get',
  );
  return inserted;
}

export async function listInventoryEntries(db: Database) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory ORDER BY id ASC',
    [],
    'all',
  );
}

export async function listProductionOrders(db: Database) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders ORDER BY id ASC',
    [],
    'all',
  );
}

export async function listWasteRecords(db: Database) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records ORDER BY id ASC',
    [],
    'all',
  );
}

export async function getInventoryByProduct(db: Database, productId: number) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE product_id = ?',
    [productId],
    'all',
  );
}

export async function getProductionOrdersByStore(db: Database, storeId: number) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE store_id = ?',
    [storeId],
    'all',
  );
}

export async function getWasteRecordsByStore(db: Database, storeId: number) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE store_id = ?',
    [storeId],
    'all',
  );
}

export async function getInventoryByStoreAndProduct(
  db: Database,
  storeId: number,
  productId: number,
) {
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE store_id = ? AND product_id = ?',
    [storeId, productId],
    'get',
  );
}
