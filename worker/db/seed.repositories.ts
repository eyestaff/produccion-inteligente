import type { Database } from './repositories';
import type { RequestContext } from '../models/context';
import { runStatement, buildStatement, runBatch } from './repositories';

export async function seedDemoData(db: Database, ctx: RequestContext): Promise<void> {
  const cid = ctx.companyId;

  // 1. Wipe current company data in a single batch
  const tables = [
    'waste_records',
    'inventory_transactions',
    'production_order_items',
    'production_orders',
    'purchase_requests',
    'inventory',
    'recipe_items',
    'recipes',
    'products',
    'stores',
    'business_lines',
  ];

  const deleteStatements = tables.map((table) =>
    buildStatement(db, `DELETE FROM ${table} WHERE company_id = ?`, [cid]),
  );
  await runBatch(db, deleteStatements);

  // 2. Create base store and business line
  const storeRes = (await runStatement(
    db,
    `INSERT INTO stores (company_id, name, code, status) VALUES (?, 'Panadería Central', 'PAN-01', 'active') RETURNING id`,
    [cid],
    'get',
  )) as { id: number };
  const storeId = storeRes.id;

  const blRes = (await runStatement(
    db,
    `INSERT INTO business_lines (company_id, name, code, status) VALUES (?, 'Panadería Tradicional', 'BL-01', 'active') RETURNING id`,
    [cid],
    'get',
  )) as { id: number };
  const blId = blRes.id;

  // 3. Create products (ingredients and manufactured)
  const products = [
    { name: 'Harina de Trigo (Saco 25kg)', code: 'ING-HAR' },
    { name: 'Mantequilla (Bloque 5kg)', code: 'ING-MAN' },
    { name: 'Sal fina (Kg)', code: 'ING-SAL' },
    { name: 'Croissant Artesano', code: 'PROD-CRO' },
    { name: 'Pan de Masa Madre', code: 'PROD-PAN' },
  ];
  const prodIds: Record<string, number> = {};
  for (const p of products) {
    const res = (await runStatement(
      db,
      `INSERT INTO products (company_id, business_line_id, store_id, name, code) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [cid, blId, storeId, p.name, p.code],
      'get',
    )) as { id: number };
    prodIds[p.code] = res.id;
  }

  // 4. Create recipes
  const recCroRes = (await runStatement(
    db,
    `INSERT INTO recipes (company_id, product_id, name, status) VALUES (?, ?, 'Receta Croissant Artesano', 'active') RETURNING id`,
    [cid, prodIds['PROD-CRO']],
    'get',
  )) as { id: number };
  const recPanRes = (await runStatement(
    db,
    `INSERT INTO recipes (company_id, product_id, name, status) VALUES (?, ?, 'Receta Pan de Masa Madre', 'active') RETURNING id`,
    [cid, prodIds['PROD-PAN']],
    'get',
  )) as { id: number };

  await runStatement(
    db,
    `INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, 0.05, 'saco')`,
    [cid, recCroRes.id, prodIds['ING-HAR']],
  );
  await runStatement(
    db,
    `INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, 0.1, 'bloque')`,
    [cid, recCroRes.id, prodIds['ING-MAN']],
  );

  await runStatement(
    db,
    `INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, 0.02, 'saco')`,
    [cid, recPanRes.id, prodIds['ING-HAR']],
  );
  await runStatement(
    db,
    `INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, 0.01, 'kg')`,
    [cid, recPanRes.id, prodIds['ING-SAL']],
  );

  // 5. Create Inventory (simulate current levels to trigger forecast rules)
  const inventories = [
    { pid: prodIds['ING-HAR'], qty: -2, min: 10, max: 50 },
    { pid: prodIds['ING-MAN'], qty: 30, min: 5, max: 40 },
    { pid: prodIds['ING-SAL'], qty: 2, min: 10, max: 30 },
    { pid: prodIds['PROD-CRO'], qty: 15, min: 20, max: 100 },
    { pid: prodIds['PROD-PAN'], qty: 0, min: 50, max: 200 },
  ];
  const massInsertStatements = [];
  for (const inv of inventories) {
    massInsertStatements.push(
      buildStatement(
        db,
        `INSERT INTO inventory (company_id, store_id, product_id, quantity, available_quantity, min_stock, max_stock) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cid, storeId, inv.pid, inv.qty, inv.qty, inv.min, inv.max],
      ),
    );
  }

  // 6. Generate historical transactions for Forecast (last 30 days)
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString();

    const qtyHar = Math.floor(Math.random() * 5) + 2;
    massInsertStatements.push(
      buildStatement(
        db,
        `INSERT INTO inventory_transactions (company_id, store_id, product_id, quantity_change, type, reason, created_by, source_module, created_at) VALUES (?, ?, ?, ?, 'out', 'production', 1, 'Seed', ?)`,
        [cid, storeId, prodIds['ING-HAR'], -qtyHar, dateStr],
      ),
    );

    const qtyCro = Math.floor(Math.random() * 40) + 10;
    massInsertStatements.push(
      buildStatement(
        db,
        `INSERT INTO inventory_transactions (company_id, store_id, product_id, quantity_change, type, reason, created_by, source_module, created_at) VALUES (?, ?, ?, ?, 'out', 'production', 1, 'Seed', ?)`,
        [cid, storeId, prodIds['PROD-CRO'], -qtyCro, dateStr],
      ),
    );
    const qtyPan = Math.floor(Math.random() * 60) + 20;
    massInsertStatements.push(
      buildStatement(
        db,
        `INSERT INTO inventory_transactions (company_id, store_id, product_id, quantity_change, type, reason, created_by, source_module, created_at) VALUES (?, ?, ?, ?, 'out', 'production', 1, 'Seed', ?)`,
        [cid, storeId, prodIds['PROD-PAN'], -qtyPan, dateStr],
      ),
    );
  }

  await runBatch(db, massInsertStatements);

  // Generate some waste for Sal yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await runStatement(
    db,
    `INSERT INTO inventory_transactions (company_id, store_id, product_id, quantity_change, type, reason, created_by, source_module, created_at) VALUES (?, ?, ?, -5, 'out', 'breakage', 1, 'Seed', ?)`,
    [cid, storeId, prodIds['ING-SAL'], yesterday.toISOString()],
  );

  // 7. Active Production Orders
  const poRes = (await runStatement(
    db,
    `INSERT INTO production_orders (company_id, store_id, business_line_id, status, target_quantity) VALUES (?, ?, ?, 'in_progress', 100) RETURNING id`,
    [cid, storeId, blId],
    'get',
  )) as { id: number };
  await runStatement(
    db,
    `INSERT INTO production_order_items (company_id, production_order_id, product_id, quantity) VALUES (?, ?, ?, 50)`,
    [cid, poRes.id, prodIds['PROD-CRO']],
  );
  await runStatement(
    db,
    `INSERT INTO production_order_items (company_id, production_order_id, product_id, quantity) VALUES (?, ?, ?, 50)`,
    [cid, poRes.id, prodIds['PROD-PAN']],
  );
}
