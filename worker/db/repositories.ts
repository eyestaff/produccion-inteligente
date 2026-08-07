import type { RequestContext } from '../models/context';

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

export async function runStatement(
  db: Database,
  sql: string,
  params: unknown[] = [],
  mode: 'run' | 'get' | 'all' = 'run',
) {
  const statement = db.prepare(sql);
  const isD1Statement =
    typeof statement.bind === 'function' && typeof statement.first === 'function';
  let boundStatement = statement;
  if (isD1Statement) {
    if (params.length > 0) {
      boundStatement = (statement.bind as any)(...params);
    }
    if (mode === 'get') {
      return boundStatement.first ? await boundStatement.first() : undefined;
    }
    if (mode === 'all') {
      return boundStatement.all ? await boundStatement.all() : [];
    }
    return boundStatement.run ? await boundStatement.run() : undefined;
  }

  const anyStatement = statement as any;
  if (mode === 'get') {
    return anyStatement.get ? anyStatement.get(...params) : undefined;
  }
  if (mode === 'all') {
    return anyStatement.all ? anyStatement.all(...params) : [];
  }
  return anyStatement.run ? anyStatement.run(...params) : undefined;
}

export function buildStatement(db: Database, sql: string, params: unknown[] = []) {
  const statement = db.prepare(sql);
  const isD1Statement =
    typeof statement.bind === 'function' && typeof statement.first === 'function';
  if (isD1Statement) {
    return params.length > 0 ? (statement.bind as any)(...params) : statement;
  }
  // For local better-sqlite3 compatibility, we just return an object with run() and all() bound.
  const anyStatement = statement as any;
  return {
    run: () => (anyStatement.run ? anyStatement.run(...params) : undefined),
    all: () => (anyStatement.all ? anyStatement.all(...params) : []),
  };
}

export async function runBatch(db: Database, statements: any[]) {
  // If db has batch method (D1), use it.
  if ('batch' in db && typeof db.batch === 'function') {
    return db.batch(statements);
  }
  // Fallback for local better-sqlite3
  const results = [];
  for (const stmt of statements) {
    results.push(stmt.run());
  }
  return results;
}

export async function createStore(
  db: Database,
  ctx: RequestContext,
  input: { name: string; code: string; status?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO stores (company_id, name, code, status) VALUES (?, ?, ?, ?)',
    [companyId, input.name, input.code, input.status ?? 'active'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, name, code, status FROM stores WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listStores(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function getStoreById(db: Database, ctx: RequestContext, id: number) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE id = ? AND company_id = ?',
    [id, companyId],
    'get',
  );
}

export async function updateStore(
  db: Database,
  ctx: RequestContext,
  id: number,
  input: Partial<{ name: string; code: string; status: string }>,
) {
  const companyId = ctx.companyId;
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
  values.push(id, companyId);
  return runStatement(
    db,
    `UPDATE stores SET ${columns.join(', ')} WHERE id = ? AND company_id = ?`,
    values,
    'run',
  );
}

export async function deleteStore(db: Database, ctx: RequestContext, id: number) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'DELETE FROM stores WHERE id = ? AND company_id = ?',
    [id, companyId],
    'run',
  );
}

export async function createBusinessLine(
  db: Database,
  ctx: RequestContext,
  input: { name: string; code: string; status?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO business_lines (company_id, name, code, status) VALUES (?, ?, ?, ?)',
    [companyId, input.name, input.code, input.status ?? 'active'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, name, code, status FROM business_lines WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listBusinessLines(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, name, code, status, created_at AS createdAt FROM business_lines WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function createProduct(
  db: Database,
  ctx: RequestContext,
  input: {
    businessLineId?: number | null;
    storeId?: number | null;
    code: string;
    name: string;
    status?: string;
  },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO products (company_id, business_line_id, store_id, code, name, status) VALUES (?, ?, ?, ?, ?, ?)',
    [
      companyId,
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
    'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status FROM products WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listProducts(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status, created_at AS createdAt FROM products WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function createRecipe(
  db: Database,
  ctx: RequestContext,
  input: {
    productId: number;
    name: string;
    yieldQuantity?: number;
    version?: number;
    status?: string;
  },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipes (company_id, product_id, name, yield_quantity, version, status) VALUES (?, ?, ?, ?, ?, ?)',
    [
      companyId,
      input.productId,
      input.name,
      input.yieldQuantity ?? 1,
      input.version ?? 1,
      input.status ?? 'draft',
    ],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function getRecipeById(db: Database, ctx: RequestContext, id: number) {
  return runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE id = ? AND company_id = ?',
    [id, ctx.companyId],
    'get',
  );
}

export async function listRecipes(db: Database, ctx: RequestContext, productId?: number) {
  if (productId) {
    return runStatement(
      db,
      'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE company_id = ? AND product_id = ? ORDER BY id ASC',
      [ctx.companyId, productId],
      'all',
    );
  }
  return runStatement(
    db,
    'SELECT id, product_id AS productId, name, yield_quantity AS yieldQuantity, version, status FROM recipes WHERE company_id = ? ORDER BY id ASC',
    [ctx.companyId],
    'all',
  );
}

export async function updateRecipe(
  db: Database,
  ctx: RequestContext,
  id: number,
  input: { name?: string; yieldQuantity?: number; version?: number; status?: string },
) {
  const updates: string[] = [];
  const params: any[] = [];
  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name);
  }
  if (input.yieldQuantity !== undefined) {
    updates.push('yield_quantity = ?');
    params.push(input.yieldQuantity);
  }
  if (input.version !== undefined) {
    updates.push('version = ?');
    params.push(input.version);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    params.push(input.status);
  }
  if (updates.length === 0) return true;

  params.push(id, ctx.companyId);
  await runStatement(
    db,
    `UPDATE recipes SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`,
    params,
  );
  return true;
}

export async function deleteRecipe(db: Database, ctx: RequestContext, id: number) {
  await runStatement(db, 'DELETE FROM recipe_items WHERE recipe_id = ? AND company_id = ?', [
    id,
    ctx.companyId,
  ]);
  await runStatement(db, 'DELETE FROM recipes WHERE id = ? AND company_id = ?', [
    id,
    ctx.companyId,
  ]);
  return true;
}

export async function createRecipeItem(
  db: Database,
  ctx: RequestContext,
  input: { recipeId: number; productId: number; quantity: number; unit?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?, ?)',
    [companyId, input.recipeId, input.productId, input.quantity, input.unit ?? 'u'],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listRecipeItems(db: Database, ctx: RequestContext, recipeId: number) {
  return runStatement(
    db,
    `SELECT ri.id, ri.recipe_id AS recipeId, ri.product_id AS productId, p.name AS productName, ri.quantity, ri.unit
     FROM recipe_items ri
     LEFT JOIN products p ON ri.product_id = p.id
     WHERE ri.recipe_id = ? AND ri.company_id = ?
     ORDER BY ri.id ASC`,
    [recipeId, ctx.companyId],
    'all',
  );
}

export async function deleteRecipeItem(
  db: Database,
  ctx: RequestContext,
  recipeId: number,
  itemId: number,
) {
  await runStatement(
    db,
    'DELETE FROM recipe_items WHERE id = ? AND recipe_id = ? AND company_id = ?',
    [itemId, recipeId, ctx.companyId],
  );
  return true;
}

export async function getInventorySnapshot(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
) {
  // Ensure the snapshot row exists atomically
  await runStatement(
    db,
    'INSERT OR IGNORE INTO inventory (company_id, store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, 0, 0, 0)',
    [ctx.companyId, storeId, productId],
  );

  const row = await runStatement(
    db,
    'SELECT id, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE company_id = ? AND store_id = ? AND product_id = ?',
    [ctx.companyId, storeId, productId],
    'get',
  );
  return row as { quantity: number; reservedQuantity: number; availableQuantity: number };
}

export async function listStoreInventory(db: Database, ctx: RequestContext, storeId: number) {
  return runStatement(
    db,
    'SELECT i.product_id AS productId, p.name AS productName, i.quantity, i.reserved_quantity AS reservedQuantity, i.available_quantity AS availableQuantity FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.company_id = ? AND i.store_id = ? ORDER BY p.name ASC',
    [ctx.companyId, storeId],
    'all',
  );
}

export async function listInventoryTransactions(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
) {
  return runStatement(
    db,
    'SELECT id, type, quantity_change AS quantityChange, reason, created_by AS createdBy, source_module AS sourceModule, reference_type AS referenceType, reference_id AS referenceId, created_at AS createdAt FROM inventory_transactions WHERE company_id = ? AND store_id = ? AND product_id = ? ORDER BY id DESC',
    [ctx.companyId, storeId, productId],
    'all',
  );
}

export function buildInventoryTransactionStatements(
  db: Database,
  ctx: RequestContext,
  input: {
    storeId: number;
    productId: number;
    type: string;
    quantityChange: number;
    reason: string;
    sourceModule: string;
    referenceType?: string;
    referenceId?: number;
    isReserveOnly?: boolean;
    consumeReserve?: boolean;
  },
) {
  const statements = [];
  statements.push(
    buildStatement(
      db,
      'INSERT OR IGNORE INTO inventory (company_id, store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, 0, 0, 0)',
      [ctx.companyId, input.storeId, input.productId],
    ),
  );

  statements.push(
    buildStatement(
      db,
      `INSERT INTO inventory_transactions 
      (company_id, store_id, product_id, type, quantity_change, reason, created_by, source_module, reference_type, reference_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ctx.companyId,
        input.storeId,
        input.productId,
        input.type,
        input.quantityChange,
        input.reason,
        ctx.userId,
        input.sourceModule,
        input.referenceType ?? null,
        input.referenceId ?? null,
      ],
    ),
  );

  if (input.isReserveOnly) {
    statements.push(
      buildStatement(
        db,
        'UPDATE inventory SET reserved_quantity = reserved_quantity + ?, available_quantity = quantity - (reserved_quantity + ?) WHERE company_id = ? AND store_id = ? AND product_id = ?',
        [input.quantityChange, input.quantityChange, ctx.companyId, input.storeId, input.productId],
      ),
    );
  } else if (input.consumeReserve) {
    statements.push(
      buildStatement(
        db,
        'UPDATE inventory SET quantity = quantity + ?, reserved_quantity = reserved_quantity + ?, available_quantity = (quantity + ?) - (reserved_quantity + ?) WHERE company_id = ? AND store_id = ? AND product_id = ?',
        [
          input.quantityChange,
          input.quantityChange,
          input.quantityChange,
          input.quantityChange,
          ctx.companyId,
          input.storeId,
          input.productId,
        ],
      ),
    );
  } else {
    statements.push(
      buildStatement(
        db,
        'UPDATE inventory SET quantity = quantity + ?, available_quantity = (quantity + ?) - reserved_quantity WHERE company_id = ? AND store_id = ? AND product_id = ?',
        [input.quantityChange, input.quantityChange, ctx.companyId, input.storeId, input.productId],
      ),
    );
  }

  return statements;
}

export async function recordInventoryTransaction(
  db: Database,
  ctx: RequestContext,
  input: Parameters<typeof buildInventoryTransactionStatements>[2],
) {
  const stmts = buildInventoryTransactionStatements(db, ctx, input);
  await runBatch(db, stmts);
}

export async function createProductionOrder(
  db: Database,
  ctx: RequestContext,
  input: {
    storeId?: number | null;
    businessLineId?: number | null;
    status?: string;
    targetQuantity?: number;
    startedAt?: string | null;
    completedAt?: string | null;
  },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO production_orders (company_id, store_id, business_line_id, status, target_quantity, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      companyId,
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
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function createProductionOrderItem(
  db: Database,
  ctx: RequestContext,
  input: { productionOrderId?: number | null; productId?: number | null; quantity?: number },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO production_order_items (company_id, production_order_id, product_id, quantity) VALUES (?, ?, ?, ?)',
    [companyId, input.productionOrderId ?? null, input.productId ?? null, input.quantity ?? 0],
  );
  const id =
    typeof result === 'object' && result && 'lastInsertRowid' in result
      ? (result as { lastInsertRowid?: unknown }).lastInsertRowid
      : undefined;
  const inserted = await runStatement(
    db,
    'SELECT id, production_order_id AS productionOrderId, product_id AS productId, quantity FROM production_order_items WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function createWasteRecord(
  db: Database,
  ctx: RequestContext,
  input: { storeId?: number | null; productId?: number | null; quantity?: number; reason?: string },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO waste_records (company_id, store_id, product_id, quantity, reason) VALUES (?, ?, ?, ?, ?)',
    [
      companyId,
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
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}

export async function listInventoryEntries(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function listProductionOrders(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function listWasteRecords(db: Database, ctx: RequestContext) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE company_id = ? ORDER BY id ASC',
    [companyId],
    'all',
  );
}

export async function getInventoryByProduct(db: Database, ctx: RequestContext, productId: number) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE product_id = ? AND company_id = ?',
    [productId, companyId],
    'all',
  );
}

export async function getProductionOrdersByStore(
  db: Database,
  ctx: RequestContext,
  storeId: number,
) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE store_id = ? AND company_id = ?',
    [storeId, companyId],
    'all',
  );
}

export async function getWasteRecordsByStore(db: Database, ctx: RequestContext, storeId: number) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE store_id = ? AND company_id = ?',
    [storeId, companyId],
    'all',
  );
}

export async function getInventoryByStoreAndProduct(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
) {
  const companyId = ctx.companyId;
  return runStatement(
    db,
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE store_id = ? AND product_id = ? AND company_id = ?',
    [storeId, productId, companyId],
    'get',
  );
}

export async function executeAtomicBackflush(
  db: Database,
  ctx: RequestContext,
  orderId: number,
  storeId: number,
  ingredientsOut: { productId: number; quantity: number }[],
  productsIn: { productId: number; quantity: number }[],
) {
  const statements = [];

  // 1. Ingredientes OUT (se consumen de la reserva previamente hecha)
  for (const ing of ingredientsOut) {
    statements.push(
      ...buildInventoryTransactionStatements(db, ctx, {
        storeId,
        productId: ing.productId,
        type: 'out',
        quantityChange: -ing.quantity,
        reason: 'production',
        sourceModule: 'ProductionEngine',
        referenceType: 'ProductionOrder',
        referenceId: orderId,
        consumeReserve: true,
      }),
    );
  }

  // 2. Productos IN
  for (const prod of productsIn) {
    statements.push(
      ...buildInventoryTransactionStatements(db, ctx, {
        storeId,
        productId: prod.productId,
        type: 'in',
        quantityChange: prod.quantity,
        reason: 'production',
        sourceModule: 'ProductionEngine',
        referenceType: 'ProductionOrder',
        referenceId: orderId,
      }),
    );
  }

  // En D1 real, usamos db.batch([...statements]) para transacciones atómicas
  await runBatch(db, statements);
}
