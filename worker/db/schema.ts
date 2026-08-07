import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const businessLines = sqliteTable('business_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessLineId: integer('business_line_id').references(() => businessLines.id),
  storeId: integer('store_id').references(() => stores.id),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id),
  name: text('name').notNull(),
  version: integer('version').notNull().default(1),
  status: text('status').notNull().default('draft'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const recipeItems = sqliteTable('recipe_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').references(() => recipes.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull().default(1),
  unit: text('unit').notNull().default('u'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').references(() => stores.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull().default(0),
  reservedQuantity: integer('reserved_quantity').notNull().default(0),
  availableQuantity: integer('available_quantity').notNull().default(0),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const productionOrders = sqliteTable('production_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').references(() => stores.id),
  businessLineId: integer('business_line_id').references(() => businessLines.id),
  status: text('status').notNull().default('planned'),
  targetQuantity: integer('target_quantity').notNull().default(0),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const productionOrderItems = sqliteTable('production_order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productionOrderId: integer('production_order_id').references(() => productionOrders.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const wasteRecords = sqliteTable('waste_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').references(() => stores.id),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull().default(0),
  reason: text('reason').notNull().default('unknown'),
  recordedAt: text('recorded_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
