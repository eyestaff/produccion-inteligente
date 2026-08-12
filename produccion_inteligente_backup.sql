PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, company_id INTEGER);
INSERT INTO "stores" ("id","name","code","status","created_at","company_id") VALUES(1,'Panadería Central','PAN-01','active','2026-08-07 11:57:21',1);
CREATE TABLE business_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, company_id INTEGER);
INSERT INTO "business_lines" ("id","name","code","status","created_at","company_id") VALUES(1,'Panadería Tradicional','BL-01','active','2026-08-07 11:57:21',1);
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_line_id INTEGER,
  store_id INTEGER,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (business_line_id) REFERENCES business_lines(id),
  FOREIGN KEY (store_id) REFERENCES stores(id)
);
INSERT INTO "products" ("id","business_line_id","store_id","code","name","status","created_at","company_id") VALUES(1,1,1,'ING-HAR','Harina de Trigo (Saco 25kg)','active','2026-08-07 11:57:21',1);
INSERT INTO "products" ("id","business_line_id","store_id","code","name","status","created_at","company_id") VALUES(2,1,1,'ING-MAN','Mantequilla (Bloque 5kg)','active','2026-08-07 11:57:21',1);
INSERT INTO "products" ("id","business_line_id","store_id","code","name","status","created_at","company_id") VALUES(3,1,1,'ING-SAL','Sal fina (Kg)','active','2026-08-07 11:57:21',1);
INSERT INTO "products" ("id","business_line_id","store_id","code","name","status","created_at","company_id") VALUES(4,1,1,'PROD-CRO','Croissant Artesano','active','2026-08-07 11:57:21',1);
INSERT INTO "products" ("id","business_line_id","store_id","code","name","status","created_at","company_id") VALUES(5,1,1,'PROD-PAN','Pan de Masa Madre','active','2026-08-07 11:57:21',1);
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
INSERT INTO "recipes" ("id","product_id","name","version","status","created_at","company_id") VALUES(1,4,'Receta Croissant Artesano',1,'active','2026-08-07 11:57:21',1);
INSERT INTO "recipes" ("id","product_id","name","version","status","created_at","company_id") VALUES(2,5,'Receta Pan de Masa Madre',1,'active','2026-08-07 11:57:21',1);
CREATE TABLE recipe_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'u',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
INSERT INTO "recipe_items" ("id","recipe_id","product_id","quantity","unit","created_at","company_id") VALUES(1,1,1,0.05,'saco','2026-08-07 11:57:21',1);
INSERT INTO "recipe_items" ("id","recipe_id","product_id","quantity","unit","created_at","company_id") VALUES(2,1,2,0.1,'bloque','2026-08-07 11:57:21',1);
INSERT INTO "recipe_items" ("id","recipe_id","product_id","quantity","unit","created_at","company_id") VALUES(3,2,1,0.02,'saco','2026-08-07 11:57:21',1);
INSERT INTO "recipe_items" ("id","recipe_id","product_id","quantity","unit","created_at","company_id") VALUES(4,2,3,0.01,'kg','2026-08-07 11:57:21',1);
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, min_stock INTEGER NOT NULL DEFAULT 0, max_stock INTEGER NOT NULL DEFAULT 0, company_id INTEGER,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
INSERT INTO "inventory" ("id","store_id","product_id","quantity","reserved_quantity","available_quantity","updated_at","min_stock","max_stock","company_id") VALUES(1,1,1,-2,0,-2,'2026-08-07 11:57:21',10,50,1);
INSERT INTO "inventory" ("id","store_id","product_id","quantity","reserved_quantity","available_quantity","updated_at","min_stock","max_stock","company_id") VALUES(2,1,2,30,0,30,'2026-08-07 11:57:21',5,40,1);
INSERT INTO "inventory" ("id","store_id","product_id","quantity","reserved_quantity","available_quantity","updated_at","min_stock","max_stock","company_id") VALUES(3,1,3,2,0,2,'2026-08-07 11:57:21',10,30,1);
INSERT INTO "inventory" ("id","store_id","product_id","quantity","reserved_quantity","available_quantity","updated_at","min_stock","max_stock","company_id") VALUES(4,1,4,15,0,15,'2026-08-07 11:57:21',20,100,1);
INSERT INTO "inventory" ("id","store_id","product_id","quantity","reserved_quantity","available_quantity","updated_at","min_stock","max_stock","company_id") VALUES(5,1,5,0,0,0,'2026-08-07 11:57:21',50,200,1);
CREATE TABLE production_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER,
  business_line_id INTEGER,
  status TEXT NOT NULL DEFAULT 'planned',
  target_quantity INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (business_line_id) REFERENCES business_lines(id)
);
INSERT INTO "production_orders" ("id","store_id","business_line_id","status","target_quantity","started_at","completed_at","created_at","company_id") VALUES(1,1,1,'in_progress',100,NULL,NULL,'2026-08-07 11:57:22',1);
CREATE TABLE production_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  production_order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (production_order_id) REFERENCES production_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
INSERT INTO "production_order_items" ("id","production_order_id","product_id","quantity","created_at","company_id") VALUES(1,1,4,50,'2026-08-07 11:57:22',1);
INSERT INTO "production_order_items" ("id","production_order_id","product_id","quantity","created_at","company_id") VALUES(2,1,5,50,'2026-08-07 11:57:22',1);
CREATE TABLE waste_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'unknown',
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, company_id INTEGER,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE TABLE purchase_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  reason TEXT NOT NULL,                     -- 'negative_stock' | 'below_minimum' | 'high_consumption' | 'recent_waste'
  suggested_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'bought' | 'postponed'
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, discarded_reason TEXT, discarded_at TEXT, discarded_by INTEGER, accepted INTEGER DEFAULT NULL, stockout_occurred INTEGER DEFAULT NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_initial_schema.sql','2026-08-07 11:42:01');
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "companies" ("id","name","slug","status","created_at") VALUES(1,'Smart Group','SMT-P','active','2026-08-07 11:52:47');
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, must_change_password INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
INSERT INTO "users" ("id","company_id","email","password_hash","password_salt","role","status","created_at","must_change_password") VALUES(1,1,'admin@smartgroup.com','cb872080ee690e3c4d356acc53da79a090c06b8eef09fa60ca51a1cbf40b076f','2acc21484dd97049c35a7247e3a3300c','admin','active','2026-08-07 11:52:47',0);
INSERT INTO "users" ("id","company_id","email","password_hash","password_salt","role","status","created_at","must_change_password") VALUES(2,1,'eyestaff.ncarrillo@gmail.com','d7036f4f69708a3dadbf3a3c4b2d496b7c45742a4cb7199f8f1a78250f36b24d','6817769a64b8be0693c9b788b2ea7122','admin','active','2026-08-07 17:51:50',0);
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(1,1,'f01d92546b463194351cd50c881081e744508203d3099897c6dd684790e33457',1786708437702,'2026-08-07 11:53:57');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(2,1,'e8b96369407697486fe4aa61466b4b178acffca1a0864e03a6a2850d8f8e1986',1786708641147,'2026-08-07 11:57:21');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(3,2,'5de9d08cc8cfdc002c63d80511bab319102cfc966516f39ddbf8544a8fdb34c1',1786729922738,'2026-08-07 17:52:02');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(8,2,'45509b1239e60fb155652912dfdf9a123e08a49120e330bb57766da7fd971dbc',1786772457837,'2026-08-08 05:40:57');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(10,2,'76c3b54f38719c7e75d7da1e058c36a9d26d399f04845f0e253d10d1121271d4',1786772597000,'2026-08-08 05:43:17');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(12,2,'b21fea22cb8fec5c9987ead65f465dfe80736b98c72d71aca4277584f7763978',1786779133961,'2026-08-08 07:32:13');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(13,2,'cfe4f67bdffe77ebccb8761fd144d2b7c2f6af22a82fda79d8770d086d5fa8b1',1786788846571,'2026-08-08 10:14:06');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(14,2,'2c077cbcb424167b7efbf2b9dcd1e1ab77da740289700d5ec0f57ad4056b45ec',1786805435278,'2026-08-08 14:50:35');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(15,2,'c40b3d7b245ec2fd8c5f456fc2cc4ca112d04b53ec96d93c7c2f810d205d3dbe',1786818308760,'2026-08-08 18:25:08');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(20,2,'bfa4f96452091a1c11587cd63600e8155c7f5df0865f083615009805be4eeb24',1786858944583,'2026-08-09 05:42:24');
INSERT INTO "sessions" ("id","user_id","token","expires_at","created_at") VALUES(22,2,'3013a8d33ef5e62e0603663709e1ce0ed1c19ffe433598297c0178d37cfeccf0',1786861314503,'2026-08-09 06:21:54');
CREATE TABLE inventory_transactions (
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
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(1,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-08-07T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(2,1,1,4,NULL,'out',-12,'production',1,'Seed',NULL,NULL,'2026-08-07T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(3,1,1,5,NULL,'out',-57,'production',1,'Seed',NULL,NULL,'2026-08-07T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(4,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-08-06T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(5,1,1,4,NULL,'out',-45,'production',1,'Seed',NULL,NULL,'2026-08-06T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(6,1,1,5,NULL,'out',-76,'production',1,'Seed',NULL,NULL,'2026-08-06T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(7,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-08-05T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(8,1,1,4,NULL,'out',-24,'production',1,'Seed',NULL,NULL,'2026-08-05T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(9,1,1,5,NULL,'out',-53,'production',1,'Seed',NULL,NULL,'2026-08-05T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(10,1,1,1,NULL,'out',-2,'production',1,'Seed',NULL,NULL,'2026-08-04T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(11,1,1,4,NULL,'out',-22,'production',1,'Seed',NULL,NULL,'2026-08-04T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(12,1,1,5,NULL,'out',-42,'production',1,'Seed',NULL,NULL,'2026-08-04T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(13,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-08-03T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(14,1,1,4,NULL,'out',-28,'production',1,'Seed',NULL,NULL,'2026-08-03T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(15,1,1,5,NULL,'out',-29,'production',1,'Seed',NULL,NULL,'2026-08-03T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(16,1,1,1,NULL,'out',-2,'production',1,'Seed',NULL,NULL,'2026-08-02T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(17,1,1,4,NULL,'out',-48,'production',1,'Seed',NULL,NULL,'2026-08-02T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(18,1,1,5,NULL,'out',-58,'production',1,'Seed',NULL,NULL,'2026-08-02T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(19,1,1,1,NULL,'out',-6,'production',1,'Seed',NULL,NULL,'2026-08-01T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(20,1,1,4,NULL,'out',-48,'production',1,'Seed',NULL,NULL,'2026-08-01T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(21,1,1,5,NULL,'out',-57,'production',1,'Seed',NULL,NULL,'2026-08-01T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(22,1,1,1,NULL,'out',-2,'production',1,'Seed',NULL,NULL,'2026-07-31T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(23,1,1,4,NULL,'out',-10,'production',1,'Seed',NULL,NULL,'2026-07-31T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(24,1,1,5,NULL,'out',-67,'production',1,'Seed',NULL,NULL,'2026-07-31T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(25,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-30T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(26,1,1,4,NULL,'out',-10,'production',1,'Seed',NULL,NULL,'2026-07-30T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(27,1,1,5,NULL,'out',-65,'production',1,'Seed',NULL,NULL,'2026-07-30T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(28,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-07-29T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(29,1,1,4,NULL,'out',-13,'production',1,'Seed',NULL,NULL,'2026-07-29T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(30,1,1,5,NULL,'out',-63,'production',1,'Seed',NULL,NULL,'2026-07-29T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(31,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-28T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(32,1,1,4,NULL,'out',-12,'production',1,'Seed',NULL,NULL,'2026-07-28T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(33,1,1,5,NULL,'out',-64,'production',1,'Seed',NULL,NULL,'2026-07-28T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(34,1,1,1,NULL,'out',-2,'production',1,'Seed',NULL,NULL,'2026-07-27T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(35,1,1,4,NULL,'out',-46,'production',1,'Seed',NULL,NULL,'2026-07-27T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(36,1,1,5,NULL,'out',-65,'production',1,'Seed',NULL,NULL,'2026-07-27T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(37,1,1,1,NULL,'out',-6,'production',1,'Seed',NULL,NULL,'2026-07-26T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(38,1,1,4,NULL,'out',-17,'production',1,'Seed',NULL,NULL,'2026-07-26T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(39,1,1,5,NULL,'out',-54,'production',1,'Seed',NULL,NULL,'2026-07-26T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(40,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-07-25T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(41,1,1,4,NULL,'out',-13,'production',1,'Seed',NULL,NULL,'2026-07-25T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(42,1,1,5,NULL,'out',-28,'production',1,'Seed',NULL,NULL,'2026-07-25T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(43,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-07-24T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(44,1,1,4,NULL,'out',-46,'production',1,'Seed',NULL,NULL,'2026-07-24T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(45,1,1,5,NULL,'out',-38,'production',1,'Seed',NULL,NULL,'2026-07-24T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(46,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-23T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(47,1,1,4,NULL,'out',-14,'production',1,'Seed',NULL,NULL,'2026-07-23T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(48,1,1,5,NULL,'out',-75,'production',1,'Seed',NULL,NULL,'2026-07-23T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(49,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-22T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(50,1,1,4,NULL,'out',-38,'production',1,'Seed',NULL,NULL,'2026-07-22T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(51,1,1,5,NULL,'out',-41,'production',1,'Seed',NULL,NULL,'2026-07-22T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(52,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-21T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(53,1,1,4,NULL,'out',-12,'production',1,'Seed',NULL,NULL,'2026-07-21T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(54,1,1,5,NULL,'out',-45,'production',1,'Seed',NULL,NULL,'2026-07-21T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(55,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-20T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(56,1,1,4,NULL,'out',-40,'production',1,'Seed',NULL,NULL,'2026-07-20T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(57,1,1,5,NULL,'out',-59,'production',1,'Seed',NULL,NULL,'2026-07-20T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(58,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-07-19T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(59,1,1,4,NULL,'out',-24,'production',1,'Seed',NULL,NULL,'2026-07-19T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(60,1,1,5,NULL,'out',-76,'production',1,'Seed',NULL,NULL,'2026-07-19T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(61,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-07-18T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(62,1,1,4,NULL,'out',-31,'production',1,'Seed',NULL,NULL,'2026-07-18T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(63,1,1,5,NULL,'out',-60,'production',1,'Seed',NULL,NULL,'2026-07-18T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(64,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-07-17T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(65,1,1,4,NULL,'out',-30,'production',1,'Seed',NULL,NULL,'2026-07-17T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(66,1,1,5,NULL,'out',-36,'production',1,'Seed',NULL,NULL,'2026-07-17T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(67,1,1,1,NULL,'out',-5,'production',1,'Seed',NULL,NULL,'2026-07-16T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(68,1,1,4,NULL,'out',-46,'production',1,'Seed',NULL,NULL,'2026-07-16T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(69,1,1,5,NULL,'out',-75,'production',1,'Seed',NULL,NULL,'2026-07-16T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(70,1,1,1,NULL,'out',-6,'production',1,'Seed',NULL,NULL,'2026-07-15T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(71,1,1,4,NULL,'out',-24,'production',1,'Seed',NULL,NULL,'2026-07-15T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(72,1,1,5,NULL,'out',-43,'production',1,'Seed',NULL,NULL,'2026-07-15T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(73,1,1,1,NULL,'out',-6,'production',1,'Seed',NULL,NULL,'2026-07-14T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(74,1,1,4,NULL,'out',-17,'production',1,'Seed',NULL,NULL,'2026-07-14T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(75,1,1,5,NULL,'out',-51,'production',1,'Seed',NULL,NULL,'2026-07-14T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(76,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-07-13T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(77,1,1,4,NULL,'out',-26,'production',1,'Seed',NULL,NULL,'2026-07-13T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(78,1,1,5,NULL,'out',-24,'production',1,'Seed',NULL,NULL,'2026-07-13T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(79,1,1,1,NULL,'out',-6,'production',1,'Seed',NULL,NULL,'2026-07-12T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(80,1,1,4,NULL,'out',-16,'production',1,'Seed',NULL,NULL,'2026-07-12T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(81,1,1,5,NULL,'out',-48,'production',1,'Seed',NULL,NULL,'2026-07-12T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(82,1,1,1,NULL,'out',-4,'production',1,'Seed',NULL,NULL,'2026-07-11T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(83,1,1,4,NULL,'out',-10,'production',1,'Seed',NULL,NULL,'2026-07-11T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(84,1,1,5,NULL,'out',-66,'production',1,'Seed',NULL,NULL,'2026-07-11T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(85,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-07-10T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(86,1,1,4,NULL,'out',-29,'production',1,'Seed',NULL,NULL,'2026-07-10T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(87,1,1,5,NULL,'out',-39,'production',1,'Seed',NULL,NULL,'2026-07-10T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(88,1,1,1,NULL,'out',-3,'production',1,'Seed',NULL,NULL,'2026-07-09T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(89,1,1,4,NULL,'out',-11,'production',1,'Seed',NULL,NULL,'2026-07-09T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(90,1,1,5,NULL,'out',-72,'production',1,'Seed',NULL,NULL,'2026-07-09T11:57:21.933Z');
INSERT INTO "inventory_transactions" ("id","company_id","store_id","product_id","lot_id","type","quantity_change","reason","created_by","source_module","reference_type","reference_id","created_at") VALUES(91,1,1,3,NULL,'out',-5,'breakage',1,'Seed',NULL,NULL,'2026-08-06T11:57:22.006Z');
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO "password_reset_tokens" ("id","user_id","token_hash","expires_at","used_at","created_at") VALUES(1,2,'1820e8275b4cdcbcfcda6c847193edbf48d4c71bd0692842dbc7a0e73b1a0cf2',1786255784711,1786254081187,'2026-08-09 05:39:44');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('companies',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('users',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('sessions',22);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('stores',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('business_lines',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('products',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('recipes',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('recipe_items',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('inventory',5);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('inventory_transactions',91);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('production_orders',1);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('production_order_items',2);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('password_reset_tokens',1);
CREATE INDEX idx_products_business_line_id ON products(business_line_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_inventory_store_id ON inventory(store_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_production_orders_store_id ON production_orders(store_id);
CREATE INDEX idx_production_orders_business_line_id ON production_orders(business_line_id);
CREATE INDEX idx_waste_records_store_id ON waste_records(store_id);
CREATE INDEX idx_waste_records_product_id ON waste_records(product_id);
CREATE INDEX idx_purchase_requests_company ON purchase_requests(company_id);
CREATE INDEX idx_purchase_requests_store ON purchase_requests(store_id);
CREATE INDEX idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX idx_password_reset_tokens_token_hash
  ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);
