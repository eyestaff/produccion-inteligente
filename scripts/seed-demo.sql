CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, status TEXT DEFAULT "active", created_at TEXT DEFAULT CURRENT_TIMESTAMP);
-- Seed Data for Producción Inteligente Demo
-- Company 1
INSERT OR IGNORE INTO companies (id, name, slug) VALUES (1, 'Panaderías Gran Vía', 'gran-via');

-- Stores
INSERT OR IGNORE INTO stores (id, company_id, name, code) VALUES (1, 1, 'Obrador Central', 'ST-OBRADOR');
INSERT OR IGNORE INTO stores (id, company_id, name, code) VALUES (2, 1, 'Tienda Gran Vía', 'ST-GRANVIA');

-- Business Lines
INSERT OR IGNORE INTO business_lines (id, company_id, name, code) VALUES (1, 1, 'Panadería', 'BL-PAN');
INSERT OR IGNORE INTO business_lines (id, company_id, name, code) VALUES (2, 1, 'Bollería', 'BL-BOLL');

-- Products (Raw Materials)
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (1, 1, 1, 'RM-HARINA', 'Harina de Trigo (Kg)');
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (2, 1, 2, 'RM-MANTE', 'Mantequilla (Kg)');
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (3, 1, 1, 'RM-LEV', 'Levadura (g)');
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (4, 1, 2, 'RM-AZUCAR', 'Azúcar (Kg)');

-- Products (Finished Goods)
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (5, 1, 2, 'FG-CROISS', 'Croissant de Mantequilla');
INSERT OR IGNORE INTO products (id, company_id, business_line_id, code, name) VALUES (6, 1, 1, 'FG-BAGUET', 'Baguette Clásica');

-- Recipes
INSERT OR IGNORE INTO recipes (id, company_id, product_id, name, yield_quantity, version) VALUES (1, 1, 5, 'Croissant Standard', 100, 1);
INSERT OR IGNORE INTO recipes (id, company_id, product_id, name, yield_quantity, version) VALUES (2, 1, 6, 'Baguette Standard', 50, 1);

-- Recipe Items (Ingredients)
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (1, 1, 1, 1, 2, 'kg');
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (2, 1, 1, 2, 1, 'kg');
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (3, 1, 1, 3, 200, 'g');
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (4, 1, 1, 4, 1, 'kg');
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (5, 1, 2, 1, 10, 'kg');
INSERT OR IGNORE INTO recipe_items (id, company_id, recipe_id, product_id, quantity, unit) VALUES (6, 1, 2, 3, 500, 'g');

-- Initial Inventory (Snapshot)
INSERT OR IGNORE INTO inventory (id, company_id, store_id, product_id, quantity, available_quantity) VALUES (1, 1, 1, 1, 500, 500);
INSERT OR IGNORE INTO inventory (id, company_id, store_id, product_id, quantity, available_quantity) VALUES (2, 1, 1, 2, 100, 100);
INSERT OR IGNORE INTO inventory (id, company_id, store_id, product_id, quantity, available_quantity) VALUES (3, 1, 1, 3, 50000, 50000);
INSERT OR IGNORE INTO inventory (id, company_id, store_id, product_id, quantity, available_quantity) VALUES (4, 1, 1, 4, 200, 200);

-- Production Orders Mock (Empty so we can see the Empty State)
DELETE FROM production_order_items;
DELETE FROM production_orders;
