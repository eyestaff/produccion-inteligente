import re

with open('worker/db/repositories.ts', 'r') as f:
    content = f.read()

# Add companyId to function signatures
content = re.sub(r'export async function ([a-zA-Z0-9_]+)\(\s*db: Database,', r'export async function \1(\n  db: Database,\n  companyId: number,', content)

# Fix createStore
content = content.replace('INSERT INTO stores (name, code, status) VALUES (?, ?, ?)', 'INSERT INTO stores (company_id, name, code, status) VALUES (?, ?, ?, ?)')
content = content.replace('[input.name, input.code, input.status ?? \'active\']', '[companyId, input.name, input.code, input.status ?? \'active\']')
content = content.replace('SELECT id, name, code, status FROM stores WHERE id = ?', 'SELECT id, name, code, status FROM stores WHERE id = ? AND company_id = ?')
content = content.replace('[id ?? 1]', '[id ?? 1, companyId]')

# listStores
content = content.replace('SELECT id, name, code, status, created_at AS createdAt FROM stores ORDER BY id ASC', 'SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE company_id = ? ORDER BY id ASC')
content = content.replace('[],', '[companyId],')

# getStoreById
content = content.replace('SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE id = ?', 'SELECT id, name, code, status, created_at AS createdAt FROM stores WHERE id = ? AND company_id = ?')
content = content.replace('[id],', '[id, companyId],')

# updateStore
content = content.replace('values.push(id);', 'values.push(id, companyId);')
content = content.replace('WHERE id = ?`', 'WHERE id = ? AND company_id = ?`')

# deleteStore
content = content.replace('DELETE FROM stores WHERE id = ?', 'DELETE FROM stores WHERE id = ? AND company_id = ?')

# createBusinessLine
content = content.replace('INSERT INTO business_lines (name, code, status) VALUES (?, ?, ?)', 'INSERT INTO business_lines (company_id, name, code, status) VALUES (?, ?, ?, ?)')
content = content.replace('SELECT id, name, code, status FROM business_lines WHERE id = ?', 'SELECT id, name, code, status FROM business_lines WHERE id = ? AND company_id = ?')

# listBusinessLines
content = content.replace('SELECT id, name, code, status, created_at AS createdAt FROM business_lines ORDER BY id ASC', 'SELECT id, name, code, status, created_at AS createdAt FROM business_lines WHERE company_id = ? ORDER BY id ASC')

# createProduct
content = content.replace('INSERT INTO products (business_line_id, store_id, code, name, status) VALUES (?, ?, ?, ?, ?)', 'INSERT INTO products (company_id, business_line_id, store_id, code, name, status) VALUES (?, ?, ?, ?, ?, ?)')
content = content.replace('[\n      input.businessLineId ?? null,', '[\n      companyId,\n      input.businessLineId ?? null,')
content = content.replace('SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status FROM products WHERE id = ?', 'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status FROM products WHERE id = ? AND company_id = ?')

# listProducts
content = content.replace('SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status, created_at AS createdAt FROM products ORDER BY id ASC', 'SELECT id, business_line_id AS businessLineId, store_id AS storeId, code, name, status, created_at AS createdAt FROM products WHERE company_id = ? ORDER BY id ASC')

# createRecipe
content = content.replace('INSERT INTO recipes (product_id, name, version, status) VALUES (?, ?, ?, ?)', 'INSERT INTO recipes (company_id, product_id, name, version, status) VALUES (?, ?, ?, ?, ?)')
content = content.replace('[input.productId ?? null,', '[companyId, input.productId ?? null,')
content = content.replace('SELECT id, product_id AS productId, name, version, status FROM recipes WHERE id = ?', 'SELECT id, product_id AS productId, name, version, status FROM recipes WHERE id = ? AND company_id = ?')

# createRecipeItem
content = content.replace('INSERT INTO recipe_items (recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?)', 'INSERT INTO recipe_items (company_id, recipe_id, product_id, quantity, unit) VALUES (?, ?, ?, ?, ?)')
content = content.replace('[input.recipeId ?? null,', '[companyId, input.recipeId ?? null,')
content = content.replace('SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ?', 'SELECT id, recipe_id AS recipeId, product_id AS productId, quantity, unit FROM recipe_items WHERE id = ? AND company_id = ?')

# createInventoryEntry
content = content.replace('INSERT INTO inventory (store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, ?, ?)', 'INSERT INTO inventory (company_id, store_id, product_id, quantity, reserved_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)')
content = content.replace('[\n      input.storeId ?? null,', '[\n      companyId,\n      input.storeId ?? null,')
content = content.replace('SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE id = ?', 'SELECT id, store_id AS storeId, product_id AS productId, quantity, reserved_quantity AS reservedQuantity, available_quantity AS availableQuantity FROM inventory WHERE id = ? AND company_id = ?')

# createProductionOrder
content = content.replace('INSERT INTO production_orders (store_id, business_line_id, status, target_quantity, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)', 'INSERT INTO production_orders (company_id, store_id, business_line_id, status, target_quantity, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
content = content.replace('[\n      input.storeId ?? null,', '[\n      companyId,\n      input.storeId ?? null,')
content = content.replace('SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE id = ?', 'SELECT id, store_id AS storeId, business_line_id AS businessLineId, status, target_quantity AS targetQuantity, started_at AS startedAt, completed_at AS completedAt FROM production_orders WHERE id = ? AND company_id = ?')

# createProductionOrderItem
content = content.replace('INSERT INTO production_order_items (production_order_id, product_id, quantity) VALUES (?, ?, ?)', 'INSERT INTO production_order_items (company_id, production_order_id, product_id, quantity) VALUES (?, ?, ?, ?)')
content = content.replace('[input.productionOrderId ?? null,', '[companyId, input.productionOrderId ?? null,')
content = content.replace('SELECT id, production_order_id AS productionOrderId, product_id AS productId, quantity FROM production_order_items WHERE id = ?', 'SELECT id, production_order_id AS productionOrderId, product_id AS productId, quantity FROM production_order_items WHERE id = ? AND company_id = ?')

# createWasteRecord
content = content.replace('INSERT INTO waste_records (store_id, product_id, quantity, reason) VALUES (?, ?, ?, ?)', 'INSERT INTO waste_records (company_id, store_id, product_id, quantity, reason) VALUES (?, ?, ?, ?, ?)')
content = content.replace('[\n      input.storeId ?? null,', '[\n      companyId,\n      input.storeId ?? null,')
content = content.replace('SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE id = ?', 'SELECT id, store_id AS storeId, product_id AS productId, quantity, reason FROM waste_records WHERE id = ? AND company_id = ?')

# listInventoryEntries
content = content.replace('FROM inventory ORDER BY id ASC', 'FROM inventory WHERE company_id = ? ORDER BY id ASC')

# listProductionOrders
content = content.replace('FROM production_orders ORDER BY id ASC', 'FROM production_orders WHERE company_id = ? ORDER BY id ASC')

# listWasteRecords
content = content.replace('FROM waste_records ORDER BY id ASC', 'FROM waste_records WHERE company_id = ? ORDER BY id ASC')

# getInventoryByProduct
content = content.replace('FROM inventory WHERE product_id = ?', 'FROM inventory WHERE product_id = ? AND company_id = ?')
content = content.replace('[productId],', '[productId, companyId],')

# getProductionOrdersByStore
content = content.replace('FROM production_orders WHERE store_id = ?', 'FROM production_orders WHERE store_id = ? AND company_id = ?')
content = content.replace('[storeId],', '[storeId, companyId],')

# getWasteRecordsByStore
content = content.replace('FROM waste_records WHERE store_id = ?', 'FROM waste_records WHERE store_id = ? AND company_id = ?')

# getInventoryByStoreAndProduct
content = content.replace('FROM inventory WHERE store_id = ? AND product_id = ?', 'FROM inventory WHERE store_id = ? AND product_id = ? AND company_id = ?')
content = content.replace('[storeId, productId],', '[storeId, productId, companyId],')

with open('worker/db/repositories.ts', 'w') as f:
    f.write(content)

with open('tests/db-model.test.ts', 'r') as f:
    test_content = f.read()

test_content = test_content.replace('CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE recipe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE production_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE production_order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')
test_content = test_content.replace('CREATE TABLE waste_records (id INTEGER PRIMARY KEY AUTOINCREMENT,', 'CREATE TABLE waste_records (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER,')

# Add 1 as companyId
test_content = re.sub(r'([a-zA-Z]+)\(db, (\{|id)', r'\1(db, 1, \2', test_content)
test_content = test_content.replace('listStores(db)', 'listStores(db, 1)')
test_content = test_content.replace('listBusinessLines(db)', 'listBusinessLines(db, 1)')
test_content = test_content.replace('listProducts(db)', 'listProducts(db, 1)')
test_content = test_content.replace('listInventoryEntries(db)', 'listInventoryEntries(db, 1)')
test_content = test_content.replace('listProductionOrders(db)', 'listProductionOrders(db, 1)')
test_content = test_content.replace('listWasteRecords(db)', 'listWasteRecords(db, 1)')

with open('tests/db-model.test.ts', 'w') as f:
    f.write(test_content)

