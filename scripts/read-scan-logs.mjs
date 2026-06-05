// Read recent scan diagnostics. Run with:  node scripts/read-scan-logs.mjs [limit]
// Shows, per scan: what the AI returned (category/nova/confidence), the nutrition
// the scorer saw, and the verdict it produced + which rules fired. This is how we
// reconstruct "why did food X score Y" after the fact.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = neon(url);
const limit = Number(process.argv[2]) || 15;

const rows = await sql`
  SELECT scanned_at, type, name, category, nova_group, confidence,
         score, verdict, score_cap, triggered_rules, ai_raw, nutrition
  FROM scan_logs ORDER BY scanned_at DESC LIMIT ${limit}
`;

if (rows.length === 0) { console.log('No scans logged yet.'); process.exit(0); }

for (const r of rows) {
  const when = new Date(r.scanned_at).toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n[${when}] ${r.type.toUpperCase()}  "${r.name}"`);
  console.log(`  verdict: ${r.verdict.toUpperCase()} (score ${r.score}, cap ${r.score_cap})`);
  console.log(`  category=${r.category}  nova=${r.nova_group}  confidence=${r.confidence ?? '—'}`);
  console.log(`  rules fired: ${(r.triggered_rules ?? []).join(', ') || '(none)'}`);
  if (r.ai_raw) {
    const a = r.ai_raw;
    console.log(`  AI raw: category=${a.category} processing=${a.processing} fvl%=${a.fvlPercent} kcal=${a.nutrition?.kcal} sugar=${a.nutrition?.sugar}g`);
  }
}
console.log('');
