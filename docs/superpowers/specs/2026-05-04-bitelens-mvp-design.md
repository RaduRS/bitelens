# BiteLens MVP — Phase 1 Design

**Date:** 2026-05-04
**Status:** Approved (architecture); implementation pending
**Sources of truth:** `bitelens-mvp-prd-updated.md` (PRD) and `docs/design/` (Claude Design bundle).

---

## Scope

Phase 1 ships:

- Home (Scan tab)
- Barcode camera scan
- Result screen with verdict ring, score, badges (Nutri-Score / NOVA / Eco-Score), reasons, additives, flags, nutrition, allergen list, ingredients, alternatives carousel
- History (All / Good / Caution / Avoid filters + search)
- Profile / "You" (diet, allergens, goals, About)
- Allergen-aware alert banner on Result screen

Stubs (visible in nav so the design works, but content shows a "Coming next" panel):

- Discover
- Photo scan
- Compare

Phase 2 (later): photo recognition (Claude Vision or LogMeal), Discover, Compare, alternatives graph beyond the carousel, optional sharing.

## Stack

- **Framework:** Next.js 16.2.4, App Router, RSC by default, `src/` layout. Confirmed with `node_modules/next/dist/docs/`. Always read the relevant doc before using a feature.
- **React:** 19.2.4 (canary surface bundled with App Router).
- **Styling:** Tailwind v4 with a `@theme` block carrying the design's oklch tokens. CSS variables for animations. No CSS-in-JS runtime.
- **Fonts:** `next/font/google` → Geist + Geist Mono.
- **DB:** Neon Postgres (provided at deploy). Access via Drizzle ORM + `@neondatabase/serverless` driver (HTTP-pool, edge-friendly).
- **Barcode scanning:** `@zxing/browser` (iPhone-only target, iOS Safari has no native `BarcodeDetector`).
- **On-device storage:** `localStorage` for profile JSON; IndexedDB via `idb` for scan history and favorites.
- **PWA:** Per `02-guides/progressive-web-apps.md` — `app/manifest.webmanifest`, service worker for offline shell + product cache.
- **Deployment:** GitHub repo → Vercel project. Env: `DATABASE_URL`.

## Folder layout

```
src/
  app/
    layout.tsx                 # Root layout, fonts, theme, service worker registration
    globals.css                # Tailwind v4 import, @theme, animations (bl-scan/pulse/pop/spin/fadein)
    page.tsx                   # Home (Scan tab) — primary entry
    (tabs)/
      layout.tsx               # Wraps children with TabBar
      history/page.tsx         # History
      you/page.tsx             # Profile
      discover/page.tsx        # Stub: "Discover · coming next"
    barcode/page.tsx           # Camera scan (no tab bar)
    photo/page.tsx             # Stub: "Photo scan · coming next"
    result/[barcode]/page.tsx  # Result screen (server component)
    compare/[a]/page.tsx       # Stub
    api/
      products/[barcode]/route.ts   # Cache-first product lookup
    manifest.webmanifest/route.ts   # PWA manifest as a route
    sw.ts                      # Service worker source (built via Next.js)
  components/
    layout/TopBar.tsx
    layout/TabBar.tsx
    layout/Wordmark.tsx
    home/PrimaryActionCard.tsx
    home/QuickStats.tsx
    home/ProfileWatchBanner.tsx
    barcode/Scanner.tsx        # Client component, owns camera + zxing
    barcode/Corners.tsx
    barcode/ModePill.tsx
    result/VerdictRing.tsx
    result/VerdictBadge.tsx
    result/NutriScoreBadge.tsx
    result/EcoScoreBadge.tsx
    result/NovaPill.tsx
    result/AdditiveRow.tsx
    result/AllergenAlert.tsx
    result/FlagChip.tsx
    result/ReasonRow.tsx
    result/NutritionBlock.tsx
    result/ConfidenceBar.tsx   # Built but unused in Phase 1 (lives for Phase 2 photo)
    product/ProductThumb.tsx
    product/RecentRow.tsx
    product/AlternativeCard.tsx
    profile/DietPicker.tsx
    profile/AllergenChips.tsx
    profile/GoalChips.tsx
    ui/SectionLabel.tsx
    ui/EmptyState.tsx
    ui/IconButton.tsx
  lib/
    db/client.ts               # Neon connection
    db/schema.ts               # Drizzle schema: products
    off/client.ts              # Open Food Facts fetch
    off/normalize.ts           # OFF response → our Product shape
    rules/signals.ts           # Extract numeric signals from a product
    rules/registry.ts          # Rule[] — each rule = { id, severity, when, explain }
    rules/engine.ts            # evaluate(product, profile) → Verdict
    rules/score.ts             # Score → verdict band mapping
    additives/registry.ts      # E-number → risk + explanation
    profile/storage.ts         # localStorage wrapper
    profile/defaults.ts
    history/storage.ts         # IndexedDB wrapper for scans
    pwa/register.ts            # Service worker registration helper
  hooks/
    useProfile.ts
    useHistory.ts
    useFavorites.ts
  types/
    product.ts                 # Product, Nutrition, Allergen, Additive
    verdict.ts                 # Verdict, Reason, Flag, Severity
    profile.ts
```

## Data model

### Neon — `products` table

```ts
products = {
  barcode: text PRIMARY KEY,
  brand: text,
  name: text,
  subtitle: text,
  ingredients: text[],
  allergens: text[],            // canonical keys: gluten, dairy, eggs, nuts, peanuts, soy, fish, shellfish, sesame
  additives: jsonb,             // [{ code, name, risk, detail }]
  nutrition: jsonb,             // { serving, kcal, protein, carbs, sugar, fat, satFat, fiber, sodium }
  nutri_score: text,            // 'A'|'B'|'C'|'D'|'E'|null
  eco_score: text,              // 'A'|'B'|'C'|'D'|'E'|null
  nova_group: int,              // 1..4 | null
  source: text,                 // 'off'
  source_fetched_at: timestamptz,
  signals: jsonb,               // pre-computed signal snapshot
  created_at: timestamptz default now(),
  updated_at: timestamptz default now(),
}
```

Verdict is **not** stored — it's a pure function of `(signals, profile)` and profile is per-user. We compute it client-side.

### On-device — IndexedDB `scans` store

```ts
{
  id: string                     // ULID
  barcode: string                // FK to products
  scannedAt: number              // ms
  verdict: 'good' | 'caution' | 'avoid'
  score: number
  favorite: boolean
  // Snapshot of the rendered fields so history works fully offline
  snapshot: { brand, name, subtitle, swatch?, glyph?, nutriScore, ecoScore, novaGroup }
}
```

Capped at 100 most-recent entries. LRU eviction.

### On-device — `localStorage` profile

```ts
{
  diet: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian',
  allergens: AllergenKey[],       // subset of canonical keys
  goals: GoalKey[],               // 'low_sugar' | 'low_sodium' | 'high_protein' | 'less_processed' | 'high_fiber'
  schemaVersion: 1,
}
```

## Rules engine

Pure TypeScript, no AI. Three layers:

1. **Signals** (`signals.ts`) — `extract(product) → SignalSet`. Numeric/boolean facts: `sugarPerServing`, `sodiumPerServing`, `additiveMaxRisk`, `additiveCount`, `nutriScoreOrdinal` (A=0…E=4), `novaGroup`, `containsAllergens: AllergenKey[]`, `containsIngredient(...denylist)`, `proteinPerServing`, `fiberPerServing`.
2. **Rule registry** (`registry.ts`) — array of:

```ts
type Rule = {
  id: string,
  severity: 'low' | 'moderate' | 'high',  // 5 / 12 / 25 score points
  when: (s: SignalSet, p: Profile) => boolean,
  explain: (s: SignalSet, p: Product) => Reason,
}
```

Examples (initial set):

- `high_added_sugar` (high) — `sugarPerServing >= 15g`
- `moderate_added_sugar` (moderate) — `sugarPerServing >= 10g`
- `high_sodium` (moderate) — `sodiumPerServing >= 600mg`
- `additive_high_risk` (high) — any additive with `risk: 'high'`
- `additive_moderate_risk` (moderate) — any additive with `risk: 'moderate'`
- `ultra_processed` (moderate) — `novaGroup === 4`
- `nutri_score_d_or_e` (moderate) — `nutriScore in ['D','E']`
- `allergen_match` (high, profile-aware) — `containsAllergens ∩ profile.allergens` non-empty
- `low_sugar_goal_breach` (low, profile-aware) — `'low_sugar' ∈ profile.goals && sugarPerServing >= 8`
- `less_processed_goal_breach` (low, profile-aware) — `'less_processed' ∈ profile.goals && novaGroup >= 3`
- Positive observations (no severity penalty, but emitted as `kind: 'pos'` reasons): `whole_food`, `high_protein`, `no_additives`, `nutri_score_a_or_b`.

3. **Engine** (`engine.ts`) — `evaluate(product, profile) → { verdict, score, reasons, flags, summary }`:
   - Start at score 100.
   - For each triggered negative rule: subtract by severity (low=5, moderate=12, high=25). Floor at 0.
   - Verdict bands: `>=70 → good`, `40..69 → caution`, `<40 → avoid`.
   - Reasons: triggered negatives ordered by severity desc, then triggered positives, capped at 5.
   - Flags: triggered high/moderate rules surface as `FlagChip` with `tone` matching severity (`high → avoid`, `moderate → caution`).
   - Summary: a short templated sentence chosen from the dominant signal set (e.g., "Ultra-processed, high sugar load." / "Whole-food, low sugar, no concerning additives."). Templates live in `rules/explanations.ts`.

Tests: every rule gets a unit test with positive + negative fixture. The engine has a snapshot test per sample product from `data.jsx` to keep parity with the design's verdicts/scores.

## Data flow

### Barcode scan

1. `/barcode` mounts the `<Scanner>` client component.
2. `Scanner` calls `getUserMedia({ video: { facingMode: 'environment' } })`, pipes into a `<video>`, hands to zxing's `BrowserMultiFormatReader`.
3. On detect: `router.push('/result/' + decodedText)`.
4. Result page (server component) calls a server action / route handler `getProduct(barcode)`:
   - Try Neon `products.barcode = ?`.
   - On miss: `fetch('https://world.openfoodfacts.org/api/v2/product/' + barcode + '.json', { next: { revalidate: 86400 }})`, normalize, insert into Neon, return.
   - Normalization layer is the only place that knows OFF's field names.
5. Server returns `{ product, signals }` to the page.
6. A client island (`<ResultClient>`) reads profile from `localStorage`, runs `evaluate(product, profile)`, writes a scan entry to IndexedDB, renders the screen.

### Manual entry / fallback

If camera permission is denied or zxing fails twice, show a manual barcode input field. Same downstream path.

### Cache-hit history

Tapping a history item routes to `/result/<barcode>?from=history`. The route handler still goes through the same lookup; Neon hit makes it instant. Snapshot in IndexedDB is fallback when fully offline (service worker serves the page shell, IndexedDB serves the data).

## Visual fidelity

- The `:root` block in `docs/design/project/BiteLens.html` is ported into Tailwind v4's `@theme` so utility classes like `text-text-dim`, `bg-surface`, `text-accent` match the design tokens. Color values land as oklch + glow variants exactly as in the prototype.
- The five `@keyframes` (bl-scan, bl-pulse, bl-pop, bl-spin, bl-fadein) are copied verbatim into `globals.css`.
- Components keep computed inline styles where the prototype does (verdict ring's SVG strokes, additive risk dot glows) — those are pixel-tied. Tailwind handles structural layout.
- Each design component maps to exactly one React component. No re-imagining shapes.

## Error & edge handling

- **Camera denied:** show fallback panel with "Enter barcode manually" input.
- **Barcode not in OFF:** show "We couldn't find this product. Try another scan or enter details manually." Phase 1 stops here — no manual product creation.
- **Network down:** if barcode is in IndexedDB history snapshot, render from snapshot with a "Cached result" tag. Otherwise show offline state with retry.
- **Profile not yet hydrated:** Result page renders ring + verdict using empty profile, then re-renders with personalized warnings once profile loads. Use `useSyncExternalStore` to avoid hydration warnings.
- **Tilted/blurry barcode:** zxing handles. After 8 seconds with no detection, surface a "Hold steadier or enter manually" hint.

## Testing

- Unit tests (`vitest`): rules engine (every rule), score banding, OFF normalizer, additive registry lookup.
- Snapshot tests on the 8 sample products from `docs/design/project/data.jsx` — verdict, score, top-5 reasons must match the design's intent.
- Component visual smoke: storybook-like page at `/dev/components` (dev-only) that renders every primitive against fixed sample data, so we can eyeball-compare to the design HTML side-by-side.
- E2E: not in Phase 1.

## Build sequence (handed to writing-plans)

1. Tooling: install Drizzle, `@neondatabase/serverless`, `@zxing/browser`, `idb`, `vitest`. Add scripts.
2. Theme + globals: port BiteLens.html tokens into Tailwind v4 `@theme`, add animations, wire Geist fonts.
3. Type definitions + sample fixtures (port `data.jsx` to TS so we can render before Neon is wired).
4. Primitive components: VerdictRing, VerdictBadge, NutriScoreBadge, EcoScoreBadge, NovaPill, FlagChip, ReasonRow, AdditiveRow, AllergenAlert, NutritionBlock, ProductThumb, RecentRow, AlternativeCard, TopBar, TabBar, Wordmark, SectionLabel, EmptyState, IconButton, ConfidenceBar.
5. Profile storage + `useProfile` hook + Profile (You) screen.
6. History storage + `useHistory` hook + History screen.
7. Rules engine: signals, rule registry, engine, score, explanations, additive registry. Tests.
8. Home screen wired to recent scans + profile banner.
9. Barcode scanner client component + manual fallback + permission handling.
10. Neon schema + Drizzle migration. Server route handler `/api/products/[barcode]`. OFF client + normalizer.
11. Result screen wiring everything together. Snapshot test against sample products.
12. Stub pages for Discover, Photo, Compare with design-consistent "coming next" panel.
13. PWA: manifest, service worker, install prompt later.
14. GitHub repo + Vercel project.

## Open items for next phase (not in scope here)

- Photo recognition provider (Claude Vision via Anthropic SDK is leading candidate per the user's plan).
- Compare flow.
- Discover with category tiles + top-rated.
- Real alternatives graph beyond hand-curated `alternatives` field.
- Anonymous device-id sync (only if user requests cross-device later).
