-- Reparación controlada de D1 producción
-- No elimina ni modifica datos existentes.

-- 0005: producción
ALTER TABLE production_orders
ADD COLUMN actual_quantity INTEGER NOT NULL DEFAULT 0;

-- 0006: catálogo maestro
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  company_id INTEGER,
  parent_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

ALTER TABLE products
ADD COLUMN category_id INTEGER REFERENCES categories(id);

ALTER TABLE products
ADD COLUMN type TEXT NOT NULL DEFAULT 'finished_good';

ALTER TABLE products
ADD COLUMN base_unit TEXT NOT NULL DEFAULT 'u';

ALTER TABLE products
ADD COLUMN cost REAL NOT NULL DEFAULT 0;

ALTER TABLE products
ADD COLUMN price REAL NOT NULL DEFAULT 0;

-- 0007: persistencia de Forecast
CREATE TABLE forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  company_id INTEGER,
  store_id INTEGER,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE forecast_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  company_id INTEGER,
  forecast_id INTEGER,
  product_id INTEGER,
  historical_base REAL NOT NULL DEFAULT 0,
  suggested_quantity REAL NOT NULL DEFAULT 0,
  adjusted_quantity REAL NOT NULL DEFAULT 0,
  actual_consumption REAL NOT NULL DEFAULT 0,
  deviation_percentage REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (forecast_id) REFERENCES forecasts(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 0008: BOM de órdenes de producción
CREATE TABLE production_order_bom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  production_order_id INTEGER REFERENCES production_orders(id),
  product_id INTEGER REFERENCES products(id),
  planned_quantity REAL NOT NULL DEFAULT 0,
  actual_quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'u',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
