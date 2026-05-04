import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  barcode: text('barcode').primaryKey(),
  brand: text('brand').notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull(),
  imageUrl: text('image_url'),
  ingredients: jsonb('ingredients').$type<string[]>().notNull(),
  allergens: jsonb('allergens').$type<string[]>().notNull(),
  additives: jsonb('additives').$type<unknown[]>().notNull(),
  nutrition: jsonb('nutrition').$type<unknown>().notNull(),
  nutriScore: text('nutri_score'),
  ecoScore: text('eco_score'),
  novaGroup: integer('nova_group'),
  source: text('source').notNull().default('off'),
  sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true }).notNull().defaultNow(),
  signals: jsonb('signals').$type<unknown>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;
