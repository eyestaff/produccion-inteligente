-- Sprint 14 (Fix): Multi-tenant architecture and auth tables

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 3. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Create inventory_transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  store_id INTEGER,
  product_id INTEGER,
  lot_id INTEGER,
  type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  source_module TEXT NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add company_id to existing tables
ALTER TABLE stores ADD COLUMN company_id INTEGER;
ALTER TABLE business_lines ADD COLUMN company_id INTEGER;
ALTER TABLE products ADD COLUMN company_id INTEGER;
ALTER TABLE recipes ADD COLUMN company_id INTEGER;
ALTER TABLE recipe_items ADD COLUMN company_id INTEGER;
ALTER TABLE inventory ADD COLUMN company_id INTEGER;
ALTER TABLE production_orders ADD COLUMN company_id INTEGER;
ALTER TABLE production_order_items ADD COLUMN company_id INTEGER;
ALTER TABLE waste_records ADD COLUMN company_id INTEGER;
