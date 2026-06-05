import { pgTable, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core';

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
  category: text('category'),
  source: text('source').notNull().default('off'),
  sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true }).notNull().defaultNow(),
  signals: jsonb('signals').$type<unknown>(),
  // Raw OFF taxonomy tags retained so derived flags (isOrganic, pesticide
  // advisory) can be re-computed at read time. Same pattern as the additive
  // re-enrichment in rowToProduct — store the raw tag, run the live registry
  // on every read so registry updates flow to existing cached rows.
  labels: jsonb('labels').$type<string[]>(),
  origins: jsonb('origins').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type ProductInsert = typeof products.$inferInsert;

// Diagnostic log of every scan: the INPUT the scorer saw (for photos this is
// the raw, non-deterministic AI response we'd otherwise discard) plus the
// OUTPUT verdict it produced. Lets us reconstruct, after the fact, exactly why
// a given scan scored the way it did — e.g. "the banana scored 26 because the
// vision model labelled it `dessert`". Without this, photo misclassifications
// are unrecoverable once the screen is closed.
export const scanLogs = pgTable('scan_logs', {
  id: text('id').primaryKey(),
  scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
  type: text('type').notNull(),                 // 'photo' | 'barcode'
  barcode: text('barcode'),                     // null for photos
  name: text('name').notNull(),
  category: text('category'),
  novaGroup: integer('nova_group'),
  confidence: real('confidence'),               // photos only — AI self-rated 0..1
  // The raw AI analysis (category/processing/nutrition the model returned BEFORE
  // our coercion). The smoking gun for vision misclassification. Null for barcode.
  aiRaw: jsonb('ai_raw').$type<unknown>(),
  // The coerced product nutrition + signals actually fed to the scorer.
  nutrition: jsonb('nutrition').$type<unknown>(),
  // Verdict output, recomputed against the default profile at scan time.
  score: integer('score').notNull(),
  verdict: text('verdict').notNull(),           // 'good' | 'caution' | 'avoid'
  scoreCap: integer('score_cap'),               // the maxScoreCap ceiling applied
  triggeredRules: jsonb('triggered_rules').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ScanLogRow = typeof scanLogs.$inferSelect;
export type ScanLogInsert = typeof scanLogs.$inferInsert;
