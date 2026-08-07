-- Sprint 12: Módulo de Compras y Reposición
-- Añade stock mínimo a inventario y tabla de solicitudes de compra

-- 1. Añadir min_stock y max_stock al inventario
ALTER TABLE inventory ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE inventory ADD COLUMN max_stock INTEGER NOT NULL DEFAULT 0;

-- 2. Tabla de solicitudes de reposición (purchase_requests)
CREATE TABLE IF NOT EXISTS purchase_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  reason TEXT NOT NULL,                     -- 'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste'
  suggested_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'bought' | 'postponed'
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_company ON purchase_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_store ON purchase_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
