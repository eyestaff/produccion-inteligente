-- Create production_order_bom table
CREATE TABLE IF NOT EXISTS production_order_bom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  production_order_id INTEGER REFERENCES production_orders(id),
  product_id INTEGER REFERENCES products(id),
  planned_quantity REAL NOT NULL DEFAULT 0,
  actual_quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'u',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
