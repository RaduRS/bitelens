// One-off migration: create the scan_logs diagnostic table.
// Purely additive (CREATE TABLE IF NOT EXISTS) — does not touch existing tables.
// Run with:  node scripts/create-scan-logs.mjs
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set (check .env)');
  process.exit(1);
}
const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS scan_logs (
    id text PRIMARY KEY,
    scanned_at timestamptz NOT NULL DEFAULT now(),
    type text NOT NULL,
    barcode text,
    name text NOT NULL,
    category text,
    nova_group integer,
    confidence real,
    ai_raw jsonb,
    nutrition jsonb,
    score integer NOT NULL,
    verdict text NOT NULL,
    score_cap integer,
    triggered_rules jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

const rows = await sql`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'scan_logs'
  ORDER BY ordinal_position
`;
console.log('✓ scan_logs ready. Columns:');
for (const r of rows) console.log('   -', r.column_name, `(${r.data_type})`);
