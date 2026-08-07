import re

with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

old_inventory_stub = """export async function createInventoryEntry(
  db: Database,
  ctx: RequestContext,
  input: {
    storeId?: number | null;
    productId?: number | null;
    quantity?: number;
    reservedQuantity?: number;
    availableQuantity?: number;
  },
) {
  const companyId = ctx.companyId;
  const result = await runStatement(
    db,
    'INSERT INTO inventory (company_id, store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)',
    [
      companyId,
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
    'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE id = ? AND company_id = ?',
    [id ?? 1, companyId],
    'get',
  );
  return inserted;
}"""

new_inventory_ledger = """export async function getInventorySnapshot(
  db: Database,
  ctx: RequestContext,
  storeId: number,
  productId: number,
) {
  const row = await runStatement(
    db,
    'SELECT id, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE company_id = ? AND store_id = ? AND product_id = ?',
    [ctx.companyId, storeId, productId],
    'get',
  );
  if (!row) {
    // Create zero snapshot if not exists
    await runStatement(
      db,
      'INSERT INTO inventory (company_id, store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, 0, 0, 0)',
      [ctx.companyId, storeId, productId],
    );
    return { quantity: 0, reservedQuantity: 0, availableQuantity: 0 };
  }
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

export async function recordInventoryTransaction(
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
    isReserveOnly?: boolean; // If true, only reserved_quantity changes, not physical quantity
  },
) {
  // We use db.batch to execute in a single D1 transaction if possible.
  // For manual runStatement wrapper, we must simulate it or just run them sequentially.
  // We will run the insert and then the relative update.
  
  await runStatement(
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
    ]
  );
  
  // Ensure the snapshot row exists
  await getInventorySnapshot(db, ctx, input.storeId, input.productId);
  
  // Relative update pattern to avoid race conditions
  if (input.isReserveOnly) {
    await runStatement(
      db,
      'UPDATE inventory SET reserved_quantity = reserved_quantity + ?, available_quantity = quantity - (reserved_quantity + ?) WHERE company_id = ? AND store_id = ? AND product_id = ?',
      [input.quantityChange, input.quantityChange, ctx.companyId, input.storeId, input.productId]
    );
  } else {
    // A regular adjustment or consumption.
    // If it's a consumption (backflush) that resolves a reserve, the quantityChange is negative, 
    // and we also need to decrease the reserve by the same magnitude if it was previously reserved.
    // To keep it simple, the relative update just affects physical quantity and recalculates available.
    // (In a full implementation, consume might have a separate flag to drop reserve).
    await runStatement(
      db,
      'UPDATE inventory SET quantity = quantity + ?, available_quantity = (quantity + ?) - reserved_quantity WHERE company_id = ? AND store_id = ? AND product_id = ?',
      [input.quantityChange, input.quantityChange, ctx.companyId, input.storeId, input.productId]
    );
  }
}
"""

content = content.replace(old_inventory_stub, new_inventory_ledger)

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)
