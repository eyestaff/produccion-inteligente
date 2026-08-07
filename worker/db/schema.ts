import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex, real } from 'drizzle-orm/sqlite-core';

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const businessLines = sqliteTable('business_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  parentId: integer('parent_id'),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  businessLineId: integer('business_line_id').references(() => businessLines.id),
  categoryId: integer('category_id').references(() => categories.id),
  storeId: integer('store_id'), // Deprecated: products should belong to company, not store
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull().default('finished_good'), // raw_material, sub_assembly, finished_good, service
  baseUnit: text('base_unit').notNull().default('u'), // kg, l, u, g
  cost: real('cost').notNull().default(0),
  price: real('price').notNull().default(0),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  productId: integer('product_id').references(() => products.id),
  name: text('name').notNull(),
  yieldQuantity: integer('yield_quantity').notNull().default(1),
  version: integer('version').notNull().default(1),
  status: text('status').notNull().default('draft'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const recipeItems = sqliteTable('recipe_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  recipeId: integer('recipe_id').references(() => recipes.id),
  productId: integer('product_id').references(() => products.id),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit').notNull().default('u'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const inventory = sqliteTable(
  'inventory',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    companyId: integer('company_id').references(() => companies.id),
    storeId: integer('store_id').references(() => stores.id),
    productId: integer('product_id').references(() => products.id),
    quantity: real('quantity').notNull().default(0),
    reservedQuantity: real('reserved_quantity').notNull().default(0),
    availableQuantity: real('available_quantity').notNull().default(0),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    storeProductIdx: uniqueIndex('idx_inventory_store_product').on(table.storeId, table.productId),
  }),
);

export const inventoryTransactions = sqliteTable('inventory_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  storeId: integer('store_id').references(() => stores.id),
  productId: integer('product_id').references(() => products.id),
  lotId: integer('lot_id'),
  type: text('type').notNull(), // 'in', 'out', 'adjustment', 'production', 'reversion'
  quantityChange: real('quantity_change').notNull(),
  reason: text('reason').notNull(), // 'production', 'caducity', 'breakage', 'adjustment', 'theft', 'return'
  createdBy: integer('created_by').notNull(),
  sourceModule: text('source_module').notNull(),
  referenceType: text('reference_type'),
  referenceId: integer('reference_id'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const productionOrders = sqliteTable('production_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  storeId: integer('store_id').references(() => stores.id),
  businessLineId: integer('business_line_id').references(() => businessLines.id),
  status: text('status').notNull().default('planned'),
  targetQuantity: integer('target_quantity').notNull().default(0),
  actualQuantity: integer('actual_quantity').notNull().default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const productionOrderItems = sqliteTable('production_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  productionOrderId: integer('production_order_id').references(() => productionOrders.id),
  productId: integer('product_id').references(() => products.id),
  quantity: real('quantity').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const productionOrderBom = sqliteTable('production_order_bom', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  productionOrderId: integer('production_order_id').references(() => productionOrders.id),
  productId: integer('product_id').references(() => products.id),
  plannedQuantity: real('planned_quantity').notNull().default(0),
  actualQuantity: real('actual_quantity').notNull().default(0),
  unit: text('unit').notNull().default('u'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const wasteRecords = sqliteTable('waste_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  storeId: integer('store_id').references(() => stores.id),
  productId: integer('product_id').references(() => products.id),
  quantity: real('quantity').notNull().default(0),
  reason: text('reason').notNull().default('unknown'),
  recordedAt: text('recorded_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const forecasts = sqliteTable('forecasts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  storeId: integer('store_id').references(() => stores.id),
  targetDate: text('target_date').notNull(),
  status: text('status').notNull().default('draft'), // draft, approved, executed
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const forecastItems = sqliteTable('forecast_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id),
  forecastId: integer('forecast_id').references(() => forecasts.id),
  productId: integer('product_id').references(() => products.id),
  historicalBase: real('historical_base').notNull().default(0),
  suggestedQuantity: real('suggested_quantity').notNull().default(0),
  adjustedQuantity: real('adjusted_quantity').notNull().default(0),
  actualConsumption: real('actual_consumption').notNull().default(0),
  deviationPercentage: real('deviation_percentage').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
