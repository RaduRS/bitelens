import 'server-only';
import { ulid } from 'ulid';
import { getDb, schema } from '@/lib/db/client';
import { evaluate } from '@/lib/rules/engine';
import { extractSignals } from '@/lib/rules/signals';
import { maxScoreCap } from '@/lib/rules/score';
import { DEFAULT_PROFILE } from '@/types/profile';
import type { Product } from '@/types/product';

interface RecordScanLogInput {
  type: 'photo' | 'barcode';
  product: Product;
  barcode?: string;
  /** Raw, pre-coercion AI response for photo scans. Omit for barcodes. */
  aiRaw?: unknown;
}

// Best-effort diagnostic logging. NEVER throws into the scan flow — if the DB is
// unreachable or DATABASE_URL is unset (e.g. local dev), we swallow the error so
// a logging failure can't break a user's scan. We log against DEFAULT_PROFILE so
// the stored verdict reflects the base scoring, independent of personal goals.
export async function recordScanLog({ type, product, barcode, aiRaw }: RecordScanLogInput): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) return;
    const signals = extractSignals(product);
    const result = evaluate(product, DEFAULT_PROFILE);
    const cap = maxScoreCap(signals, product);
    const db = getDb();
    await db.insert(schema.scanLogs).values({
      id: ulid(),
      type,
      barcode: barcode ?? null,
      name: product.name,
      category: product.category ?? null,
      novaGroup: product.novaGroup ?? null,
      confidence: typeof product.confidence === 'number' ? product.confidence : null,
      aiRaw: aiRaw ?? null,
      nutrition: product.nutrition,
      score: result.score,
      verdict: result.verdict,
      scoreCap: cap,
      triggeredRules: result.triggeredRuleIds,
    });
  } catch (err) {
    console.warn('[scan-log] failed to record scan diagnostic:', err);
  }
}
