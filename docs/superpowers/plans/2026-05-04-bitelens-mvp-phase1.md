# BiteLens MVP — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 of BiteLens — a dark, lime-accented PWA on iPhone that scans packaged-food barcodes, looks them up against a Neon-cached Open Food Facts mirror, runs a transparent rules engine to produce a verdict (Good/Caution/Avoid), and renders the design exactly per `docs/design/`.

**Architecture:** Next.js 16 App Router (RSC by default) + Tailwind v4 + Geist fonts. Neon Postgres via Drizzle holds a global product cache. localStorage holds the user profile; IndexedDB holds scan history. `@zxing/browser` powers barcode detection in iOS Safari. Rules engine is pure TS — verdicts are deterministic functions of `(product, profile)`. Stubs ship for Discover/Photo/Compare so navigation works end-to-end.

**Tech Stack:** Next.js 16.2.4 · React 19.2.4 · TypeScript 5 · Tailwind v4 · Geist (next/font) · Drizzle ORM · @neondatabase/serverless · @zxing/browser · idb · ulid · vitest · @testing-library/react.

**Source spec:** `docs/superpowers/specs/2026-05-04-bitelens-mvp-design.md` — read before starting.
**Visual reference:** `docs/design/project/{BiteLens.html,components.jsx,screens.jsx,data.jsx}` — port pixel-for-pixel.
**PRD:** `bitelens-mvp-prd-updated.md`.
**Next.js docs:** Always read the relevant guide in `node_modules/next/dist/docs/` before using a new Next 16 API.

**Repo:** `https://github.com/RaduRS/bitelens` — push after each task. Main branch.

---

## File map (decomposition lock-in)

```
src/
  app/
    layout.tsx                       (modify — add metadata, viewport, SW registration)
    globals.css                      (rewrite — design tokens + animations)
    page.tsx                         (rewrite — Home/Scan tab)
    (tabs)/
      layout.tsx                     (new — TabBar wrapper)
      history/page.tsx               (new)
      you/page.tsx                   (new)
      discover/page.tsx              (new — stub)
    barcode/page.tsx                 (new — full-screen scanner)
    photo/page.tsx                   (new — stub)
    compare/[a]/page.tsx             (new — stub)
    result/[barcode]/page.tsx        (new — server component)
    result/[barcode]/result-client.tsx (new — client island)
    api/products/[barcode]/route.ts  (new — cache-first lookup)
    manifest.webmanifest/route.ts    (new — PWA manifest)
  components/                        (new — see Tasks 4-9)
  lib/                               (new — see Tasks 10-12,15)
  hooks/                             (new — see Tasks 10-11)
  types/                             (new — see Task 3)
  fixtures/sample-products.ts        (new — Task 3)
drizzle/
  schema.ts                          (new — Task 14)
drizzle.config.ts                    (new — Task 14)
vitest.config.ts                     (new — Task 1)
.env.local.example                   (new — Task 1)
.gitignore                            (modify — Task 1)
```

---

## Task 1: Tooling, deps, env, vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Read the relevant Next 16 testing guide**

Run: `ls node_modules/next/dist/docs/01-app/02-guides/testing/`
Open and skim each file inside (vitest is bundled). Take note of any required test config.

- [ ] **Step 2: Install runtime deps**

```bash
npm install drizzle-orm @neondatabase/serverless @zxing/browser idb ulid
```

- [ ] **Step 3: Install dev deps**

```bash
npm install -D drizzle-kit vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react@19 dotenv @vitejs/plugin-react vite-tsconfig-paths @testing-library/dom
```

- [ ] **Step 4: Add scripts to `package.json`**

Replace the `scripts` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run",
  "db:generate": "drizzle-kit generate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 6: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 7: Create `.env.local.example`**

```
# Neon Postgres connection string. Get it from https://console.neon.tech
DATABASE_URL=
```

- [ ] **Step 8: Add env files to `.gitignore`**

Add these lines to `.gitignore` (if not already present):

```
.env.local
.env*.local
```

- [ ] **Step 9: Sanity-check tests run**

Run: `npm run test:run`
Expected: vitest reports "No test files found" — exit code 0. (No tests yet; we just confirm the runner works.)

- [ ] **Step 10: Commit and push**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts .env.local.example .gitignore
git commit -m "chore: add tooling — drizzle, zxing, idb, vitest"
git push
```

---

## Task 2: Design tokens, fonts, animations

**Files:**
- Rewrite: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Rewrite `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0b;
  --color-surface: #131316;
  --color-surface-2: #1a1a1e;
  --color-text: #f4f4f5;
  --color-text-dim: #8a8a90;
  --color-border: rgba(255, 255, 255, 0.07);

  --color-accent: oklch(0.86 0.20 130);
  --color-accent-glow: oklch(0.86 0.20 130 / 0.4);
  --color-amber: oklch(0.82 0.16 75);
  --color-amber-glow: oklch(0.82 0.16 75 / 0.4);
  --color-red: oklch(0.68 0.22 22);
  --color-red-glow: oklch(0.68 0.22 22 / 0.4);

  --font-sans: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

button { font-family: inherit; }
input { font-family: inherit; }

@keyframes bl-scan {
  0%   { top: 8%; }
  100% { top: 88%; }
}
@keyframes bl-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.6; }
}
@keyframes bl-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes bl-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes bl-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-bl-scan   { animation: bl-scan 1.4s ease-in-out infinite alternate; }
.animate-bl-pulse  { animation: bl-pulse 1.2s ease-in-out infinite; }
.animate-bl-pop    { animation: bl-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.animate-bl-spin   { animation: bl-spin 1.6s linear infinite; }
.animate-bl-fadein { animation: bl-fadein 0.3s ease-out both; }
```

- [ ] **Step 2: Update `src/app/layout.tsx` metadata + viewport**

Replace the file contents:

```tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BiteLens — Food Scanner",
  description: "Scan packaged food, see what's in it, decide instantly.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "BiteLens", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-text">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace placeholder home page**

Rewrite `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="p-6 text-text">
      <h1 className="font-mono text-accent">BiteLens scaffolding</h1>
    </main>
  );
}
```

- [ ] **Step 4: Verify dev server renders dark theme**

Run: `npm run dev`
Open `http://localhost:3000` in a browser. Expected: black background, lime mono "BiteLens scaffolding" text. No console errors.
Stop the server with Ctrl+C.

- [ ] **Step 5: Commit and push**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: design tokens, fonts, animations"
git push
```

---

## Task 3: Core types and sample fixtures

**Files:**
- Create: `src/types/product.ts`, `src/types/verdict.ts`, `src/types/profile.ts`, `src/fixtures/sample-products.ts`, `src/fixtures/profile-options.ts`

- [ ] **Step 1: Create `src/types/product.ts`**

```ts
export type AllergenKey =
  | 'gluten' | 'dairy' | 'eggs' | 'nuts' | 'peanuts'
  | 'soy' | 'fish' | 'shellfish' | 'sesame';

export type AdditiveRisk = 'none' | 'low' | 'moderate' | 'high';

export interface Additive {
  code: string;
  name: string;
  risk: AdditiveRisk;
  detail: string;
}

export interface Nutrition {
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  satFat: number;
  fiber: number;
  sodium: number;
}

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type NovaGroup = 1 | 2 | 3 | 4;

export interface Product {
  id: string;
  type: 'barcode' | 'photo';
  brand: string;
  name: string;
  subtitle: string;
  swatch: string;
  glyph: string;
  ingredients?: string[];
  components?: string[];
  allergens: AllergenKey[];
  additives: Additive[];
  nutrition: Nutrition;
  nutriScore: NutriScoreGrade | null;
  ecoScore: NutriScoreGrade | null;
  novaGroup: NovaGroup | null;
  alternatives?: string[];
  confidence?: number;
  favorite?: boolean;
  timeAgo?: string;
}
```

- [ ] **Step 2: Create `src/types/verdict.ts`**

```ts
import type { Product } from './product';

export type VerdictLevel = 'good' | 'caution' | 'avoid';
export type Severity = 'low' | 'moderate' | 'high';
export type ReasonKind = 'pos' | 'neg' | 'neu';
export type FlagTone = 'good' | 'caution' | 'avoid';

export interface Reason {
  kind: ReasonKind;
  text: string;
}

export interface Flag {
  tone: FlagTone;
  label: string;
  detail?: string;
}

export interface VerdictResult {
  verdict: VerdictLevel;
  score: number;
  summary: string;
  reasons: Reason[];
  flags: Flag[];
  triggeredRuleIds: string[];
}

export interface VerdictContext {
  product: Product;
}
```

- [ ] **Step 3: Create `src/types/profile.ts`**

```ts
import type { AllergenKey } from './product';

export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type GoalKey = 'low_sugar' | 'low_sodium' | 'high_protein' | 'less_processed' | 'high_fiber';

export interface Profile {
  diet: Diet;
  allergens: AllergenKey[];
  goals: GoalKey[];
  schemaVersion: 1;
}

export const DEFAULT_PROFILE: Profile = {
  diet: 'omnivore',
  allergens: [],
  goals: [],
  schemaVersion: 1,
};
```

- [ ] **Step 4: Create `src/fixtures/profile-options.ts`**

```ts
import type { AllergenKey, Diet, GoalKey } from '@/types/product';
import type { } from '@/types/profile';

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  gluten: 'Gluten', dairy: 'Dairy', eggs: 'Eggs', nuts: 'Tree nuts', peanuts: 'Peanuts',
  soy: 'Soy', fish: 'Fish', shellfish: 'Shellfish', sesame: 'Sesame',
};

export const DIET_OPTIONS: { id: Diet; label: string }[] = [
  { id: 'omnivore', label: 'Omnivore' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
];

export const GOAL_OPTIONS: { id: GoalKey; label: string }[] = [
  { id: 'low_sugar', label: 'Low sugar' },
  { id: 'low_sodium', label: 'Low sodium' },
  { id: 'high_protein', label: 'High protein' },
  { id: 'less_processed', label: 'Less processed' },
  { id: 'high_fiber', label: 'High fiber' },
];
```

(Note: `Diet` and `GoalKey` are declared in `src/types/profile.ts`; the import above pulls them via re-export. Add this re-export to `src/types/product.ts` at the bottom — `export type { Diet, GoalKey, Profile } from './profile';` — so `@/types/product` is the single import root.)

- [ ] **Step 5: Append re-exports to `src/types/product.ts`**

Append:

```ts
export type { Diet, GoalKey, Profile } from './profile';
```

- [ ] **Step 6: Create `src/fixtures/sample-products.ts`**

Port `docs/design/project/data.jsx` line-by-line into TypeScript. Open that file and create:

```ts
import type { Product } from '@/types/product';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p_oat_crisps', type: 'barcode', favorite: true,
    brand: 'Stoneground', name: 'Sea Salt Oat Crisps',
    subtitle: 'Sea Salt · 150g', swatch: '#c9a86b', glyph: 'O',
    ingredients: ['Whole oats', 'Sunflower oil', 'Brown rice flour', 'Sea salt', 'Rosemary extract'],
    allergens: ['gluten'], additives: [],
    nutrition: { serving: '30g (≈12 crisps)', kcal: 128, protein: 4.2, carbs: 18, sugar: 1.2, fat: 4.1, satFat: 0.6, fiber: 2.8, sodium: 180 },
    nutriScore: 'B', ecoScore: 'B', novaGroup: 2,
    timeAgo: 'Just now',
  },
  {
    id: 'p_strawberry_yogurt', type: 'barcode',
    brand: 'Meadow Cup', name: 'Strawberry Cream Yogurt',
    subtitle: 'Lowfat · 150g cup', swatch: '#e8a3a3', glyph: 'Y',
    ingredients: ['Lowfat milk', 'Sugar', 'Strawberry puree (8%)', 'Modified corn starch', 'Pectin', 'Natural flavor', 'Live cultures'],
    allergens: ['dairy'],
    additives: [
      { code: 'E1442', name: 'Hydroxypropyl distarch phosphate', risk: 'low', detail: 'Modified starch used as a thickener. Generally safe but indicates ultra-processing.' },
      { code: 'E440', name: 'Pectin', risk: 'none', detail: 'Natural fiber from fruit, used as gelling agent. Considered safe.' },
    ],
    nutrition: { serving: '150g cup', kcal: 142, protein: 6.0, carbs: 22, sugar: 18, fat: 2.4, satFat: 1.5, fiber: 0.4, sodium: 75 },
    nutriScore: 'C', ecoScore: 'C', novaGroup: 4,
    alternatives: ['p_plain_yogurt'], timeAgo: '12 min ago',
  },
  {
    id: 'p_cola', type: 'barcode',
    brand: 'Crestwave', name: 'Citrus Cola Original',
    subtitle: 'Carbonated · 355ml can', swatch: '#3a2418', glyph: 'C',
    ingredients: ['Carbonated water', 'High-fructose corn syrup', 'Caramel color (E150d)', 'Phosphoric acid', 'Natural flavors', 'Caffeine'],
    allergens: [],
    additives: [
      { code: 'E150d', name: 'Caramel color (Class IV)', risk: 'high', detail: 'Sulphite ammonia caramel. Trace 4-MEI is classified by IARC as possibly carcinogenic.' },
      { code: 'E338', name: 'Phosphoric acid', risk: 'moderate', detail: 'Strong acidity associated with enamel erosion and reduced calcium absorption.' },
    ],
    nutrition: { serving: '355ml can', kcal: 155, protein: 0, carbs: 39, sugar: 39, fat: 0, satFat: 0, fiber: 0, sodium: 45 },
    nutriScore: 'E', ecoScore: 'D', novaGroup: 4,
    alternatives: ['p_sparkling', 'p_kombucha'], timeAgo: '1 hr ago',
  },
  {
    id: 'p_grain_bowl', type: 'photo', brand: '', name: 'Grain bowl with salmon',
    subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
    components: ['Salmon (≈110g)', 'Quinoa', 'Mixed greens', 'Avocado', 'Cherry tomatoes', 'Lemon-tahini dressing'],
    allergens: ['fish', 'sesame'], additives: [],
    nutrition: { serving: 'Estimated bowl', kcal: 520, protein: 28, carbs: 48, sugar: 6, fat: 22, satFat: 4, fiber: 9, sodium: 480 },
    nutriScore: 'A', ecoScore: 'A', novaGroup: 1, confidence: 0.86, timeAgo: '3 hrs ago',
  },
  {
    id: 'p_protein_bar', type: 'barcode',
    brand: 'Vertex', name: 'Almond Cocoa Protein Bar',
    subtitle: 'Snack · 50g bar', swatch: '#5a4030', glyph: 'P',
    ingredients: ['Whey protein blend', 'Almonds', 'Maltitol syrup', 'Cocoa', 'Soy lecithin', 'Natural flavor'],
    allergens: ['dairy', 'nuts', 'soy'],
    additives: [
      { code: 'E965', name: 'Maltitol', risk: 'moderate', detail: 'Sugar alcohol. Can cause bloating, gas, or diarrhea in larger amounts.' },
      { code: 'E322', name: 'Soy lecithin', risk: 'low', detail: 'Common emulsifier derived from soy. Generally recognized as safe.' },
    ],
    nutrition: { serving: '50g bar', kcal: 198, protein: 12, carbs: 22, sugar: 5, fat: 9, satFat: 3, fiber: 5, sodium: 140 },
    nutriScore: 'C', ecoScore: 'C', novaGroup: 4, timeAgo: 'Yesterday',
  },
  {
    id: 'p_sparkling', type: 'barcode', favorite: true,
    brand: 'Rivermark', name: 'Cucumber Mint Sparkling',
    subtitle: 'Beverage · 330ml', swatch: '#9bbf9b', glyph: 'S',
    ingredients: ['Carbonated water', 'Natural cucumber flavor', 'Natural mint flavor'],
    allergens: [], additives: [],
    nutrition: { serving: '330ml can', kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, satFat: 0, fiber: 0, sodium: 15 },
    nutriScore: 'A', ecoScore: 'A', novaGroup: 1, timeAgo: 'Yesterday',
  },
  {
    id: 'p_plain_yogurt', type: 'barcode',
    brand: 'Meadow Cup', name: 'Plain Greek Yogurt',
    subtitle: 'Whole milk · 170g cup', swatch: '#f5ecd9', glyph: 'G',
    ingredients: ['Pasteurized whole milk', 'Live active cultures'],
    allergens: ['dairy'], additives: [],
    nutrition: { serving: '170g cup', kcal: 120, protein: 15, carbs: 5, sugar: 5, fat: 5, satFat: 3, fiber: 0, sodium: 50 },
    nutriScore: 'A', ecoScore: 'B', novaGroup: 1, timeAgo: '2 days ago',
  },
  {
    id: 'p_kombucha', type: 'barcode',
    brand: 'Fermentry', name: 'Ginger Kombucha',
    subtitle: 'Fermented tea · 330ml', swatch: '#c89860', glyph: 'K',
    ingredients: ['Filtered water', 'Black tea', 'Cane sugar', 'Ginger root', 'Live kombucha cultures'],
    allergens: [], additives: [],
    nutrition: { serving: '330ml bottle', kcal: 38, protein: 0, carbs: 9, sugar: 4, fat: 0, satFat: 0, fiber: 0, sodium: 10 },
    nutriScore: 'B', ecoScore: 'A', novaGroup: 3, timeAgo: '3 days ago',
  },
];

export const PRODUCT_INDEX: Record<string, Product> =
  Object.fromEntries(SAMPLE_PRODUCTS.map(p => [p.id, p]));
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: clean exit (0). Fix any errors before continuing.

- [ ] **Step 8: Commit and push**

```bash
git add src/types src/fixtures
git commit -m "feat: core types and sample-product fixtures"
git push
```

---

## Task 4: Atomic primitives — Wordmark, IconButton, SectionLabel, EmptyState, ScanTypeIcon

**Files:**
- Create: `src/components/layout/Wordmark.tsx`, `src/components/ui/IconButton.tsx`, `src/components/ui/SectionLabel.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/ScanTypeIcon.tsx`

- [ ] **Step 1: `Wordmark.tsx`** — Port from `docs/design/project/screens.jsx:5-16`.

```tsx
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
        <circle cx="11" cy="11" r="5" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" />
        <circle cx="11" cy="11" r="1.6" fill="var(--color-accent)" />
      </svg>
      <span
        className="text-text font-semibold"
        style={{ fontSize: size * 0.82, letterSpacing: '-0.02em' }}
      >BiteLens</span>
    </div>
  );
}
```

- [ ] **Step 2: `IconButton.tsx`** — circular 36×36 button used everywhere in the design.

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function IconButton({
  children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={
        'flex h-9 w-9 items-center justify-center rounded-full text-text ' +
        'bg-white/[0.06] border-[0.5px] border-white/10 ' +
        'cursor-pointer ' + className
      }
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: `SectionLabel.tsx`** — port `components.jsx:410-423`.

```tsx
import type { ReactNode } from 'react';

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div
        className="font-mono text-text-dim uppercase"
        style={{ fontSize: 11, letterSpacing: '0.16em' }}
      >{children}</div>
      {action}
    </div>
  );
}
```

- [ ] **Step 4: `EmptyState.tsx`** — port `screens.jsx:729-746`.

```tsx
export function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <div
        className="mb-1 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px dashed rgba(255,255,255,0.1)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ color: 'var(--color-text-dim)' }}>
          <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 7V11L13.5 12.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-text">{title}</div>
      <div className="max-w-[240px] text-[13px] leading-[1.5] text-text-dim">{sub}</div>
    </div>
  );
}
```

- [ ] **Step 5: `ScanTypeIcon.tsx`** — port `components.jsx:361-382`.

```tsx
export function ScanTypeIcon({ type }: { type: 'barcode' | 'photo' }) {
  const c = 'var(--color-text-dim)';
  if (type === 'barcode') {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11">
        <rect x="0.5" y="1" width="1" height="9" fill={c} />
        <rect x="2.5" y="1" width="0.5" height="9" fill={c} />
        <rect x="4" y="1" width="1.5" height="9" fill={c} />
        <rect x="6.5" y="1" width="0.5" height="9" fill={c} />
        <rect x="8" y="1" width="1" height="9" fill={c} />
        <rect x="10" y="1" width="0.5" height="9" fill={c} />
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 11 11">
      <rect x="0.5" y="2.5" width="10" height="7.5" rx="1.2" fill="none" stroke={c} strokeWidth="0.8" />
      <circle cx="5.5" cy="6.25" r="2" fill="none" stroke={c} strokeWidth="0.8" />
      <rect x="4" y="1" width="3" height="1.5" rx="0.4" fill={c} />
    </svg>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Commit and push**

```bash
git add src/components
git commit -m "feat(ui): atomic primitives — Wordmark, IconButton, SectionLabel, EmptyState, ScanTypeIcon"
git push
```

---

## Task 5: Verdict primitives — VerdictRing and VerdictBadge

**Files:**
- Create: `src/components/verdict/verdict-tokens.ts`, `src/components/verdict/VerdictRing.tsx`, `src/components/verdict/VerdictBadge.tsx`

- [ ] **Step 1: `verdict-tokens.ts`**

```ts
import type { VerdictLevel } from '@/types/verdict';

export const VERDICT: Record<VerdictLevel, { label: string; color: string; glow: string }> = {
  good:    { label: 'Good',    color: 'var(--color-accent)', glow: 'var(--color-accent-glow)' },
  caution: { label: 'Caution', color: 'var(--color-amber)',  glow: 'var(--color-amber-glow)' },
  avoid:   { label: 'Avoid',   color: 'var(--color-red)',    glow: 'var(--color-red-glow)' },
};
```

- [ ] **Step 2: `VerdictRing.tsx`** — port `components.jsx:9-61`.

```tsx
'use client';
import { useEffect, useState } from 'react';
import type { VerdictLevel } from '@/types/verdict';
import { VERDICT } from './verdict-tokens';

interface Props {
  verdict?: VerdictLevel;
  score?: number;
  size?: number;
  showScore?: boolean;
  animateIn?: boolean;
}

export function VerdictRing({
  verdict = 'good', score = 84, size = 156, showScore = true, animateIn = false,
}: Props) {
  const v = VERDICT[verdict];
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const [progress, setProgress] = useState(animateIn ? 0 : pct);

  useEffect(() => {
    if (!animateIn) { setProgress(pct); return; }
    let raf: number;
    let t0: number | undefined;
    const tick = (t: number) => {
      if (t0 === undefined) t0 = t;
      const k = Math.min(1, (t - t0) / 900);
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(eased * pct);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct, animateIn]);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full"
        style={{
          inset: -10,
          background: `radial-gradient(circle, ${v.glow} 0%, transparent 65%)`,
          opacity: 0.6, filter: 'blur(8px)',
        }}
      />
      <svg width={size} height={size} className="relative" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={v.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${v.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showScore && (
          <div
            className="font-mono font-semibold"
            style={{
              fontSize: size * 0.32, color: v.color, lineHeight: 1,
              letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
            }}
          >{Math.round(score)}</div>
        )}
        <div
          className="font-semibold"
          style={{
            marginTop: showScore ? 4 : 0,
            fontSize: showScore ? 12 : 22,
            letterSpacing: showScore ? '0.18em' : '0.02em',
            textTransform: showScore ? 'uppercase' : 'none',
            color: v.color,
          }}
        >{v.label}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `VerdictBadge.tsx`** — port `components.jsx:63-89`.

```tsx
import type { VerdictLevel } from '@/types/verdict';
import { VERDICT } from './verdict-tokens';

export function VerdictBadge({
  verdict = 'good', score, size = 'md',
}: { verdict?: VerdictLevel; score?: number; size?: 'sm' | 'md' }) {
  const v = VERDICT[verdict];
  const small = size === 'sm';
  return (
    <div
      className="inline-flex items-center gap-1.5 font-semibold uppercase"
      style={{
        height: small ? 22 : 28, padding: small ? '0 8px' : '0 10px', borderRadius: 999,
        background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
        border: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
        color: v.color, fontSize: small ? 10 : 11, letterSpacing: '0.12em',
      }}
    >
      <span
        style={{
          width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%',
          background: v.color, boxShadow: `0 0 6px ${v.glow}`,
        }}
      />
      {v.label}
      {score != null && (
        <span
          className="font-mono"
          style={{
            marginLeft: 2, paddingLeft: 8, fontWeight: 500, letterSpacing: 0,
            borderLeft: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
          }}
        >{score}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
git add src/components/verdict
git commit -m "feat(ui): VerdictRing + VerdictBadge"
git push
```

---

## Task 6: Score badges — NutriScoreBadge, EcoScoreBadge, NovaPill

**Files:**
- Create: `src/components/badges/NutriScoreBadge.tsx`, `src/components/badges/EcoScoreBadge.tsx`, `src/components/badges/NovaPill.tsx`

- [ ] **Step 1: `NutriScoreBadge.tsx`** — port `components.jsx:92-121`.

```tsx
import type { NutriScoreGrade } from '@/types/product';

const COLORS: Record<NutriScoreGrade, string> = {
  A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f',
};
const RANKS: NutriScoreGrade[] = ['A', 'B', 'C', 'D', 'E'];

export function NutriScoreBadge({ grade = 'A', size = 'md' }: { grade?: NutriScoreGrade; size?: 'md' | 'lg' }) {
  const idx = RANKS.indexOf(grade);
  const w = size === 'lg' ? 100 : 76;
  const h = size === 'lg' ? 28 : 22;
  return (
    <div
      className="inline-flex items-center overflow-hidden"
      style={{
        width: w, height: h, borderRadius: 4,
        boxShadow: '0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.06)',
      }}
    >
      {RANKS.map((r, i) => {
        const active = i === idx;
        return (
          <div
            key={r}
            className="flex h-full items-center justify-center font-mono font-bold"
            style={{
              flex: active ? 1.4 : 1,
              background: active ? COLORS[r] : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: size === 'lg' ? 13 : 10,
            }}
          >{r}</div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: `EcoScoreBadge.tsx`** — port `components.jsx:124-142`.

```tsx
import type { NutriScoreGrade } from '@/types/product';

const COLORS: Record<NutriScoreGrade, string> = {
  A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f',
};

export function EcoScoreBadge({ grade = 'A' }: { grade?: NutriScoreGrade }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-text"
      style={{
        padding: '4px 8px 4px 6px', borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        fontSize: 11, fontWeight: 500,
      }}
    >
      <span
        className="flex items-center justify-center font-mono font-bold text-white"
        style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS[grade], fontSize: 9 }}
      >{grade}</span>
      <span className="font-mono uppercase text-text-dim" style={{ fontSize: 10, letterSpacing: '0.08em' }}>Eco</span>
    </div>
  );
}
```

- [ ] **Step 3: `NovaPill.tsx`** — port `components.jsx:145-164`.

```tsx
import type { NovaGroup } from '@/types/product';

const COLORS: Record<NovaGroup, string> = { 1: '#1e7d4a', 2: '#7ab63e', 3: '#ee8225', 4: '#cc1f1f' };
const LABELS: Record<NovaGroup, string> = {
  1: 'Unprocessed', 2: 'Processed culinary', 3: 'Processed', 4: 'Ultra-processed',
};

export function NovaPill({ group = 1 }: { group?: NovaGroup }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-text"
      style={{
        padding: '4px 10px 4px 6px', borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        fontSize: 11,
      }}
    >
      <span
        className="flex items-center justify-center font-mono font-bold text-white"
        style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS[group], fontSize: 9 }}
      >{group}</span>
      <span className="text-text-dim" style={{ fontSize: 11 }}>{LABELS[group]}</span>
    </div>
  );
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
git add src/components/badges
git commit -m "feat(ui): score badges — Nutri, Eco, NOVA"
git push
```

---

## Task 7: Result-screen primitives — AdditiveRow, AllergenAlert, FlagChip, ReasonRow, NutritionBlock, ConfidenceBar

**Files:**
- Create one file per component under `src/components/result/`.

- [ ] **Step 1: `AdditiveRow.tsx`** — port `components.jsx:167-199`.

```tsx
import type { Additive } from '@/types/product';

const RISK_META: Record<Additive['risk'], { color: string; label: string }> = {
  none:     { color: 'var(--color-accent)', label: 'No risk' },
  low:      { color: 'var(--color-accent)', label: 'Low risk' },
  moderate: { color: 'var(--color-amber)',  label: 'Moderate risk' },
  high:     { color: 'var(--color-red)',    label: 'High risk' },
};

export function AdditiveRow({ additive, isLast }: { additive: Additive; isLast: boolean }) {
  const meta = RISK_META[additive.risk];
  return (
    <div
      className="px-4 py-[14px]"
      style={{ borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
    >
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className="font-mono text-text-dim"
          style={{
            fontSize: 11, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
          }}
        >{additive.code}</span>
        <span className="flex-1 text-text" style={{ fontSize: 14, fontWeight: 500 }}>{additive.name}</span>
        <span
          className="inline-flex items-center gap-[5px] font-semibold uppercase"
          style={{ fontSize: 10, color: meta.color, letterSpacing: '0.1em' }}
        >
          <span
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: meta.color, boxShadow: `0 0 5px ${meta.color}`,
            }}
          />
          {meta.label}
        </span>
      </div>
      <div className="text-text-dim" style={{ fontSize: 12, lineHeight: 1.5 }}>{additive.detail}</div>
    </div>
  );
}
```

- [ ] **Step 2: `AllergenAlert.tsx`** — port `components.jsx:202-224`.

```tsx
import type { AllergenKey } from '@/types/product';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';

export function AllergenAlert({ matched }: { matched: AllergenKey[] }) {
  if (!matched.length) return null;
  return (
    <div
      className="flex items-start gap-3"
      style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'color-mix(in oklab, var(--color-red) 14%, transparent)',
        border: '0.5px solid color-mix(in oklab, var(--color-red) 40%, transparent)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ color: 'var(--color-red)', marginTop: 1, flexShrink: 0 }}>
        <path d="M10 2L18 17H2L10 2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
      </svg>
      <div className="flex-1">
        <div className="mb-[3px] font-semibold" style={{ fontSize: 13, color: 'var(--color-red)', letterSpacing: '0.04em' }}>
          Contains allergens you avoid
        </div>
        <div className="text-text" style={{ fontSize: 13, lineHeight: 1.4 }}>
          {matched.map(a => ALLERGEN_LABELS[a]).join(', ')}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `FlagChip.tsx`** — port `components.jsx:226-244`.

```tsx
import type { Flag } from '@/types/verdict';

export function FlagChip({ tone = 'caution', label, detail }: Flag) {
  const color =
    tone === 'avoid' ? 'var(--color-red)' :
    tone === 'caution' ? 'var(--color-amber)' :
    'var(--color-accent)';
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.07)', fontSize: 13,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <path d="M7 1.5L13 12.5H1L7 1.5Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="6.5" y="5.5" width="1" height="3.5" rx="0.5" fill={color} />
        <circle cx="7" cy="10.5" r="0.7" fill={color} />
      </svg>
      <span className="text-text" style={{ fontWeight: 500 }}>{label}</span>
      {detail && <span className="font-mono text-text-dim" style={{ fontSize: 11 }}>{detail}</span>}
    </div>
  );
}
```

- [ ] **Step 4: `ReasonRow.tsx`** — port `components.jsx:246-265`.

```tsx
import type { Reason } from '@/types/verdict';

export function ReasonRow({ kind, text }: Reason) {
  const color =
    kind === 'pos' ? 'var(--color-accent)' :
    kind === 'neg' ? 'var(--color-red)' :
    'var(--color-text-dim)';
  const icon =
    kind === 'pos' ? <path d="M2 6.5L5 9.5L10 3.5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /> :
    kind === 'neg' ? <path d="M3 3l6 6M9 3l-6 6" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" /> :
    <line x1="3" y1="6" x2="9" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className="flex flex-shrink-0 items-center justify-center"
        style={{
          width: 20, height: 20, borderRadius: '50%', marginTop: 1,
          background: `color-mix(in oklab, ${color} 14%, transparent)`,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">{icon}</svg>
      </div>
      <div className="flex-1 text-text" style={{ fontSize: 14, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}
```

- [ ] **Step 5: `NutritionBlock.tsx`** — port `components.jsx:267-304`.

```tsx
import type { Nutrition } from '@/types/product';

export function NutritionBlock({ nutrition }: { nutrition: Nutrition }) {
  const items = [
    { label: 'Calories', value: nutrition.kcal, unit: 'kcal', warn: false },
    { label: 'Protein',  value: nutrition.protein, unit: 'g', warn: false },
    { label: 'Carbs',    value: nutrition.carbs, unit: 'g', warn: false },
    { label: 'Sugar',    value: nutrition.sugar, unit: 'g', warn: nutrition.sugar >= 10 },
    { label: 'Fat',      value: nutrition.fat, unit: 'g', warn: false },
    { label: 'Sat. fat', value: nutrition.satFat, unit: 'g', warn: false },
    { label: 'Fiber',    value: nutrition.fiber, unit: 'g', warn: false },
    { label: 'Sodium',   value: nutrition.sodium, unit: 'mg', warn: nutrition.sodium >= 400 },
  ];
  return (
    <div>
      <div
        className="mb-2.5 font-mono uppercase text-text-dim"
        style={{ fontSize: 11, letterSpacing: '0.14em' }}
      >Per {nutrition.serving}</div>
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.05)', borderRadius: 14,
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {items.map(it => (
          <div key={it.label} className="flex flex-col gap-1 bg-surface p-[14px]">
            <div className="text-text-dim" style={{ fontSize: 11, letterSpacing: '0.04em' }}>{it.label}</div>
            <div className="flex items-baseline gap-[3px]">
              <span
                className="font-mono"
                style={{
                  fontSize: 19, fontWeight: 500,
                  color: it.warn ? 'var(--color-amber)' : 'var(--color-text)',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                }}
              >{it.value}</span>
              <span className="font-mono text-text-dim" style={{ fontSize: 10 }}>{it.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `ConfidenceBar.tsx`** — port `components.jsx:384-408` (lives in repo for Phase 2 photo flow; will not be referenced in Phase 1 screens).

```tsx
export function ConfidenceBar({ value = 0.86 }: { value?: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.8 ? 'good' : value >= 0.5 ? 'mid' : 'low';
  const color =
    tone === 'good' ? 'var(--color-accent)' :
    tone === 'mid'  ? 'var(--color-amber)'  :
    'var(--color-red)';
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.07)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
        <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex-1">
        <div className="mb-1 text-text-dim" style={{ fontSize: 12, letterSpacing: '0.04em' }}>Visual confidence</div>
        <div className="overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>
      <span
        className="font-mono"
        style={{
          fontSize: 13, color, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
        }}
      >{pct}%</span>
    </div>
  );
}
```

- [ ] **Step 7: Verify + commit**

```bash
npx tsc --noEmit
git add src/components/result
git commit -m "feat(ui): result-screen primitives"
git push
```

---

## Task 8: Product primitives — ProductThumb, RecentRow, AlternativeCard

**Files:** `src/components/product/{ProductThumb,RecentRow,AlternativeCard}.tsx`

- [ ] **Step 1: `ProductThumb.tsx`** — port `components.jsx:306-325`.

```tsx
import type { Product } from '@/types/product';

export function ProductThumb({
  product, size = 44, radius = 10,
}: { product: Pick<Product, 'swatch' | 'glyph'>; size?: number; radius?: number }) {
  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center overflow-hidden font-mono"
      style={{
        width: size, height: size, borderRadius: radius,
        background: `linear-gradient(135deg, ${product.swatch} 0%, color-mix(in oklab, ${product.swatch} 60%, #000) 100%)`,
        fontWeight: 500, fontSize: size * 0.42, color: 'rgba(255,255,255,0.85)',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 1px 0 rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px)',
        }}
      />
      <span className="relative">{product.glyph}</span>
    </div>
  );
}
```

- [ ] **Step 2: `RecentRow.tsx`** — port `components.jsx:327-359`.

```tsx
import type { Product } from '@/types/product';
import { ProductThumb } from './ProductThumb';
import { ScanTypeIcon } from '@/components/ui/ScanTypeIcon';
import { VerdictBadge } from '@/components/verdict/VerdictBadge';
import type { VerdictLevel } from '@/types/verdict';

interface Props {
  product: Product & { verdict: VerdictLevel; score: number };
  onClick?: () => void;
  showFav?: boolean;
}

export function RecentRow({ product, onClick, showFav }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3.5 border-0 bg-transparent px-4 py-3 text-left text-inherit"
    >
      <ProductThumb product={product} size={44} />
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] flex items-center gap-2">
          <ScanTypeIcon type={product.type} />
          <span
            className="font-mono uppercase text-text-dim"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {product.type === 'barcode' ? 'Barcode' : 'Photo'}
            {product.timeAgo ? ` · ${product.timeAgo}` : ''}
          </span>
          {showFav && product.favorite && (
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: 'var(--color-accent)' }}>
              <path d="M5 1L6.2 3.6L9 4L7 6L7.5 9L5 7.5L2.5 9L3 6L1 4L3.8 3.6L5 1Z" fill="currentColor" />
            </svg>
          )}
        </div>
        <div
          className="overflow-hidden text-ellipsis whitespace-nowrap text-text"
          style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em' }}
        >{product.name}</div>
      </div>
      <VerdictBadge verdict={product.verdict} score={product.score} size="sm" />
    </button>
  );
}
```

- [ ] **Step 3: `AlternativeCard.tsx`** — port `components.jsx:426-456`.

```tsx
import type { Product } from '@/types/product';
import type { VerdictLevel } from '@/types/verdict';
import { ProductThumb } from './ProductThumb';
import { VERDICT } from '@/components/verdict/verdict-tokens';

interface Props {
  product: Product & { verdict: VerdictLevel; score: number };
  onClick?: () => void;
}

export function AlternativeCard({ product, onClick }: Props) {
  const v = VERDICT[product.verdict];
  return (
    <button
      onClick={onClick}
      className="flex flex-shrink-0 cursor-pointer flex-col gap-2.5 bg-surface text-left text-inherit"
      style={{
        width: 168, padding: 14, borderRadius: 16,
        border: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <ProductThumb product={product} size={40} />
        <div
          className="inline-flex items-center gap-1 font-mono font-semibold"
          style={{
            padding: '3px 7px', borderRadius: 999,
            background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
            color: v.color, fontSize: 11,
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: v.color }} />
          {product.score}
        </div>
      </div>
      <div>
        <div
          className="mb-[3px] font-mono uppercase text-text-dim"
          style={{ fontSize: 10, letterSpacing: '0.08em' }}
        >{product.brand}</div>
        <div
          className="text-text"
          style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, letterSpacing: '-0.005em' }}
        >{product.name}</div>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Verify + commit**

```bash
npx tsc --noEmit
git add src/components/product
git commit -m "feat(ui): product primitives — Thumb, RecentRow, AlternativeCard"
git push
```

---

## Task 9: Layout — TopBar and TabBar

**Files:** `src/components/layout/{TopBar,TabBar}.tsx`

- [ ] **Step 1: `TopBar.tsx`** — port `screens.jsx:18-49`.

```tsx
import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';
import { IconButton } from '@/components/ui/IconButton';

interface Props {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
  leading?: 'wordmark' | 'spacer' | 'back';
}

export function TopBar({ onBack, title, right, leading }: Props) {
  const showBack = !!onBack;
  const showWordmark = !showBack && !title && leading !== 'spacer';
  const showSpacer = !showBack && (!!title || leading === 'spacer');
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: '60px 20px 12px' }}>
      {showBack && (
        <IconButton onClick={onBack} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7L9 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      )}
      {showWordmark && <Wordmark />}
      {showSpacer && <div style={{ width: 36, height: 36 }} />}
      {title && <div className="font-semibold text-text" style={{ fontSize: 15 }}>{title}</div>}
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
```

- [ ] **Step 2: `TabBar.tsx`** — port `components.jsx:459-493`. Use `usePathname`/`useRouter` from `next/navigation` so it works as a client nav component.

```tsx
'use client';
import { usePathname, useRouter } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'scan', label: 'Scan', href: '/',
    icon: (
      <path
        d="M3 5V3a1 1 0 011-1h2M16 5V3a1 1 0 00-1-1h-2M3 13v2a1 1 0 001 1h2M16 13v2a1 1 0 01-1 1h-2M2 9.5h16"
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    ),
  },
  {
    id: 'discover', label: 'Discover', href: '/discover',
    icon: (
      <>
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <line x1="13" y1="13" x2="17" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'history', label: 'History', href: '/history',
    icon: (
      <>
        <circle cx="9" cy="10" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 6.5v3.5l2.4 1.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'you', label: 'You', href: '/you',
    icon: (
      <>
        <circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M2.5 16c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-around"
      style={{
        paddingBottom: 32, paddingTop: 6,
        background: 'rgba(10,10,11,0.85)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {TABS.map(t => {
        const active = pathname === t.href || (t.href === '/' && pathname === '/');
        return (
          <button
            key={t.id}
            onClick={() => router.push(t.href)}
            className="flex cursor-pointer flex-col items-center gap-[3px] border-0 bg-transparent"
            style={{
              padding: '6px 14px',
              color: active ? 'var(--color-accent)' : 'var(--color-text-dim)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit
git add src/components/layout
git commit -m "feat(ui): TopBar and TabBar"
git push
```

---

## Task 10: Profile storage and `useProfile` hook + Profile (You) screen

**Files:**
- Create: `src/lib/profile/storage.ts`, `src/hooks/useProfile.ts`, `src/app/(tabs)/layout.tsx`, `src/app/(tabs)/you/page.tsx`

- [ ] **Step 1: `src/lib/profile/storage.ts`**

```ts
import type { Profile } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';

const KEY = 'bitelens.profile.v1';

export function loadProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Profile;
    if (parsed.schemaVersion !== 1) return DEFAULT_PROFILE;
    return parsed;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}
```

- [ ] **Step 2: Add tests for `storage.ts`**

Create `src/lib/profile/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfile, saveProfile } from './storage';
import { DEFAULT_PROFILE } from '@/types/profile';

describe('profile storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns DEFAULT_PROFILE when nothing is saved', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
  });

  it('round-trips a saved profile', () => {
    saveProfile({ ...DEFAULT_PROFILE, allergens: ['nuts'], goals: ['low_sugar'] });
    expect(loadProfile().allergens).toEqual(['nuts']);
    expect(loadProfile().goals).toEqual(['low_sugar']);
  });

  it('falls back to default when stored schema is incompatible', () => {
    window.localStorage.setItem('bitelens.profile.v1', JSON.stringify({ schemaVersion: 99 }));
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
  });
});
```

Run: `npm run test:run`. Expected: 3 passing tests.

- [ ] **Step 3: `src/hooks/useProfile.ts`**

```ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';
import { loadProfile, saveProfile } from '@/lib/profile/storage';

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const update = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  return { profile, setProfile: update, hydrated };
}
```

- [ ] **Step 4: `src/app/(tabs)/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { TabBar } from '@/components/layout/TabBar';

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
```

- [ ] **Step 5: `src/app/(tabs)/you/page.tsx`** — port `screens.jsx:833-943`.

```tsx
'use client';
import { TopBar } from '@/components/layout/TopBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useProfile } from '@/hooks/useProfile';
import { ALLERGEN_LABELS, DIET_OPTIONS, GOAL_OPTIONS } from '@/fixtures/profile-options';
import type { AllergenKey, GoalKey } from '@/types/product';

export default function YouPage() {
  const { profile, setProfile } = useProfile();

  const toggleAllergen = (a: AllergenKey) => {
    const next = profile.allergens.includes(a)
      ? profile.allergens.filter(x => x !== a)
      : [...profile.allergens, a];
    setProfile({ ...profile, allergens: next });
  };

  const toggleGoal = (g: GoalKey) => {
    const next = profile.goals.includes(g)
      ? profile.goals.filter(x => x !== g)
      : [...profile.goals, g];
    setProfile({ ...profile, goals: next });
  };

  return (
    <div className="flex h-full flex-col overflow-auto" style={{ paddingBottom: 72 }}>
      <TopBar title="Profile" right={<div style={{ width: 36, height: 36 }} />} />

      <div className="flex flex-col gap-6 px-5 pb-6">
        <div
          className="flex items-center gap-3.5"
          style={{
            padding: 20, borderRadius: 18,
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 15%, var(--color-surface)) 0%, var(--color-surface) 80%)',
            border: '0.5px solid color-mix(in oklab, var(--color-accent) 30%, transparent)',
          }}
        >
          <div
            className="flex items-center justify-center font-mono font-semibold"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'color-mix(in oklab, var(--color-accent) 24%, transparent)',
              border: '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)',
              color: 'var(--color-accent)', fontSize: 20,
            }}
          >YO</div>
          <div className="flex-1">
            <div className="font-semibold text-text" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>You</div>
            <div className="mt-0.5 text-text-dim" style={{ fontSize: 12 }}>Personal scan profile</div>
          </div>
        </div>

        <div>
          <SectionLabel>Diet</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map(d => {
              const active = profile.diet === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setProfile({ ...profile, diet: d.id })}
                  className="cursor-pointer text-left"
                  style={{
                    padding: 12, borderRadius: 12,
                    background: active ? 'color-mix(in oklab, var(--color-accent) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text)',
                    fontSize: 14, fontWeight: 500,
                  }}
                >{d.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Allergens to avoid</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ALLERGEN_LABELS) as AllergenKey[]).map(a => {
              const active = profile.allergens.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggleAllergen(a)}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    background: active ? 'color-mix(in oklab, var(--color-red) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-red) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-red)' : 'var(--color-text)',
                    fontSize: 13, fontWeight: 500,
                  }}
                >{ALLERGEN_LABELS[a]}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Goals</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(g => {
              const active = profile.goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="cursor-pointer"
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    background: active ? 'color-mix(in oklab, var(--color-accent) 14%, transparent)' : 'var(--color-surface)',
                    border: active ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text)',
                    fontSize: 13, fontWeight: 500,
                  }}
                >{g.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>About</SectionLabel>
          <div className="overflow-hidden bg-surface" style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Scoring methodology', detail: 'How scores work' },
              { label: 'Data sources', detail: 'Open Food Facts' },
              { label: 'Privacy', detail: 'On-device by default' },
              { label: 'Version', detail: '1.0.0' },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center gap-3"
                style={{
                  padding: '14px 16px',
                  borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
                }}
              >
                <span className="flex-1 text-text" style={{ fontSize: 14 }}>{row.label}</span>
                <span className="text-text-dim" style={{ fontSize: 12 }}>{row.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Browser smoke test**

Run: `npm run dev`. Open `http://localhost:3000/you`. Expected: dark Profile screen with diet picker, allergen chips, goal chips. Toggling chips persists across reload (localStorage).
Stop server.

- [ ] **Step 7: Commit and push**

```bash
git add src/lib/profile src/hooks/useProfile.ts src/app/\(tabs\)
git commit -m "feat: profile storage hook + You screen"
git push
```

---

## Task 11: Scan history (IndexedDB) and `useHistory` hook

**Files:**
- Create: `src/lib/history/storage.ts`, `src/lib/history/storage.test.ts`, `src/hooks/useHistory.ts`

- [ ] **Step 1: `src/lib/history/storage.ts`**

```ts
import { openDB, type IDBPDatabase } from 'idb';
import type { Product } from '@/types/product';
import type { VerdictLevel } from '@/types/verdict';

export interface ScanEntry {
  id: string;
  barcode: string;
  scannedAt: number;
  verdict: VerdictLevel;
  score: number;
  favorite: boolean;
  snapshot: Pick<Product, 'brand' | 'name' | 'subtitle' | 'swatch' | 'glyph' | 'type' | 'nutriScore' | 'ecoScore' | 'novaGroup'>;
}

const DB_NAME = 'bitelens';
const STORE = 'scans';
const MAX_ENTRIES = 100;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byScannedAt', 'scannedAt');
        store.createIndex('byBarcode', 'barcode');
      },
    });
  }
  return dbPromise;
}

export async function recordScan(entry: ScanEntry): Promise<void> {
  const db = await getDB();
  await db.put(STORE, entry);
  // Cap to MAX_ENTRIES, oldest first.
  const tx = db.transaction(STORE, 'readwrite');
  const idx = tx.store.index('byScannedAt');
  const all = await idx.getAllKeys();
  if (all.length > MAX_ENTRIES) {
    for (const key of all.slice(0, all.length - MAX_ENTRIES)) {
      await tx.store.delete(key as IDBValidKey);
    }
  }
  await tx.done;
}

export async function listScans(): Promise<ScanEntry[]> {
  const db = await getDB();
  const all = await db.getAll(STORE) as ScanEntry[];
  return all.sort((a, b) => b.scannedAt - a.scannedAt);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getDB();
  const entry = await db.get(STORE, id) as ScanEntry | undefined;
  if (!entry) return;
  await db.put(STORE, { ...entry, favorite });
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
}
```

- [ ] **Step 2: `src/lib/history/storage.test.ts`** (uses `fake-indexeddb`)

Install: `npm install -D fake-indexeddb`.

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { recordScan, listScans, setFavorite, clearHistory, type ScanEntry } from './storage';

const sample = (id: string, when: number): ScanEntry => ({
  id, barcode: '12345', scannedAt: when,
  verdict: 'good', score: 80, favorite: false,
  snapshot: { brand: 'X', name: 'Y', subtitle: '', swatch: '#fff', glyph: 'X', type: 'barcode', nutriScore: 'A', ecoScore: 'A', novaGroup: 1 },
});

describe('history storage', () => {
  beforeEach(async () => { await clearHistory(); });

  it('records and lists scans newest first', async () => {
    await recordScan(sample('a', 1));
    await recordScan(sample('b', 3));
    await recordScan(sample('c', 2));
    const all = await listScans();
    expect(all.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('toggles favorite', async () => {
    await recordScan(sample('a', 1));
    await setFavorite('a', true);
    expect((await listScans())[0].favorite).toBe(true);
  });
});
```

Run: `npm run test:run`. Expected: 5 tests passing total (3 from profile + 2 here).

- [ ] **Step 3: `src/hooks/useHistory.ts`**

```ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import { listScans, setFavorite as setFavStore, type ScanEntry } from '@/lib/history/storage';

export function useHistory() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    setScans(await listScans());
    setHydrated(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    const cur = scans.find(s => s.id === id);
    if (!cur) return;
    await setFavStore(id, !cur.favorite);
    await refresh();
  }, [scans, refresh]);

  return { scans, hydrated, refresh, toggleFavorite };
}
```

- [ ] **Step 4: Commit and push**

```bash
git add src/lib/history src/hooks/useHistory.ts package.json package-lock.json
git commit -m "feat: scan history storage + useHistory hook"
git push
```

---

## Task 12: Rules engine — signals, additives registry (TDD)

**Files:**
- Create: `src/lib/additives/registry.ts`, `src/lib/rules/signals.ts`, `src/lib/rules/signals.test.ts`

- [ ] **Step 1: `src/lib/additives/registry.ts`**

```ts
import type { Additive } from '@/types/product';

export const ADDITIVE_REGISTRY: Record<string, Omit<Additive, 'code'>> = {
  E150d: { name: 'Caramel color (Class IV)', risk: 'high', detail: 'Sulphite ammonia caramel. Trace 4-MEI is classified by IARC as possibly carcinogenic.' },
  E338:  { name: 'Phosphoric acid',          risk: 'moderate', detail: 'Strong acidity associated with enamel erosion and reduced calcium absorption.' },
  E1442: { name: 'Hydroxypropyl distarch phosphate', risk: 'low', detail: 'Modified starch used as a thickener. Generally safe but indicates ultra-processing.' },
  E440:  { name: 'Pectin', risk: 'none', detail: 'Natural fiber from fruit, used as gelling agent. Considered safe.' },
  E965:  { name: 'Maltitol', risk: 'moderate', detail: 'Sugar alcohol. Can cause bloating, gas, or diarrhea in larger amounts.' },
  E322:  { name: 'Soy lecithin', risk: 'low', detail: 'Common emulsifier derived from soy. Generally recognized as safe.' },
};

export function lookupAdditive(code: string): Additive | undefined {
  const meta = ADDITIVE_REGISTRY[code];
  return meta ? { code, ...meta } : undefined;
}
```

- [ ] **Step 2: Write failing tests for `signals.ts`**

`src/lib/rules/signals.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractSignals } from './signals';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';

describe('extractSignals', () => {
  it('captures numeric facts from Cola', () => {
    const s = extractSignals(PRODUCT_INDEX.p_cola);
    expect(s.sugarPerServing).toBe(39);
    expect(s.sodiumPerServing).toBe(45);
    expect(s.proteinPerServing).toBe(0);
    expect(s.additiveMaxRisk).toBe('high');
    expect(s.additiveCount).toBe(2);
    expect(s.novaGroup).toBe(4);
    expect(s.nutriScoreOrdinal).toBe(4);
    expect(s.containsAllergens).toEqual([]);
  });

  it('captures allergens from Protein Bar', () => {
    const s = extractSignals(PRODUCT_INDEX.p_protein_bar);
    expect(s.containsAllergens.sort()).toEqual(['dairy', 'nuts', 'soy']);
    expect(s.additiveMaxRisk).toBe('moderate');
  });

  it('returns "none" max-risk for additive-free products', () => {
    const s = extractSignals(PRODUCT_INDEX.p_oat_crisps);
    expect(s.additiveMaxRisk).toBe('none');
    expect(s.additiveCount).toBe(0);
  });
});
```

Run: `npm run test:run`. Expected: 3 failures with "extractSignals is not defined".

- [ ] **Step 3: Implement `src/lib/rules/signals.ts`**

```ts
import type { Product, AllergenKey, AdditiveRisk, NutriScoreGrade, NovaGroup } from '@/types/product';

export interface SignalSet {
  sugarPerServing: number;
  sodiumPerServing: number;
  proteinPerServing: number;
  fiberPerServing: number;
  satFatPerServing: number;
  kcalPerServing: number;
  additiveMaxRisk: AdditiveRisk;
  additiveCount: number;
  nutriScore: NutriScoreGrade | null;
  nutriScoreOrdinal: number;        // 0..4 (A..E), or 5 if null
  ecoScore: NutriScoreGrade | null;
  novaGroup: NovaGroup | null;
  containsAllergens: AllergenKey[];
  ingredientsLower: string[];
}

const RISK_RANK: Record<AdditiveRisk, number> = { none: 0, low: 1, moderate: 2, high: 3 };

export function extractSignals(p: Product): SignalSet {
  const additiveMaxRisk: AdditiveRisk = (p.additives.length === 0)
    ? 'none'
    : p.additives.reduce<AdditiveRisk>(
        (acc, a) => (RISK_RANK[a.risk] > RISK_RANK[acc] ? a.risk : acc),
        'none',
      );
  const ranks = { A: 0, B: 1, C: 2, D: 3, E: 4 } as const;
  return {
    sugarPerServing: p.nutrition.sugar,
    sodiumPerServing: p.nutrition.sodium,
    proteinPerServing: p.nutrition.protein,
    fiberPerServing: p.nutrition.fiber,
    satFatPerServing: p.nutrition.satFat,
    kcalPerServing: p.nutrition.kcal,
    additiveMaxRisk,
    additiveCount: p.additives.length,
    nutriScore: p.nutriScore,
    nutriScoreOrdinal: p.nutriScore ? ranks[p.nutriScore] : 5,
    ecoScore: p.ecoScore,
    novaGroup: p.novaGroup,
    containsAllergens: [...p.allergens],
    ingredientsLower: (p.ingredients ?? p.components ?? []).map(s => s.toLowerCase()),
  };
}
```

Run: `npm run test:run`. Expected: 8 passing.

- [ ] **Step 4: Commit and push**

```bash
git add src/lib/additives src/lib/rules
git commit -m "feat(rules): signals extractor + additive registry (TDD)"
git push
```

---

## Task 13: Rules engine — registry, score, engine, explanations (TDD)

**Files:**
- Create: `src/lib/rules/registry.ts`, `src/lib/rules/engine.ts`, `src/lib/rules/score.ts`, `src/lib/rules/explanations.ts`, `src/lib/rules/engine.test.ts`

- [ ] **Step 1: `src/lib/rules/score.ts`**

```ts
import type { VerdictLevel, Severity } from '@/types/verdict';

export const SEVERITY_POINTS: Record<Severity, number> = { low: 5, moderate: 12, high: 25 };

export function bandToVerdict(score: number): VerdictLevel {
  if (score >= 70) return 'good';
  if (score >= 40) return 'caution';
  return 'avoid';
}
```

- [ ] **Step 2: `src/lib/rules/registry.ts`**

```ts
import type { Product } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { Severity, Reason, Flag } from '@/types/verdict';
import type { SignalSet } from './signals';

export interface RuleHit {
  reason?: Reason;
  flag?: Flag;
}

export interface Rule {
  id: string;
  severity: Severity | 'pos';     // 'pos' = positive observation, no penalty
  when: (s: SignalSet, profile: Profile, p: Product) => boolean;
  build: (s: SignalSet, p: Product) => RuleHit;
}

export const RULES: Rule[] = [
  {
    id: 'high_added_sugar',
    severity: 'high',
    when: s => s.sugarPerServing >= 15,
    build: s => ({
      reason: { kind: 'neg', text: `High added sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'avoid', label: 'High sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'moderate_added_sugar',
    severity: 'moderate',
    when: s => s.sugarPerServing >= 10 && s.sugarPerServing < 15,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate added sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'caution', label: 'Added sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'high_sodium',
    severity: 'moderate',
    when: s => s.sodiumPerServing >= 600,
    build: s => ({
      reason: { kind: 'neg', text: `High sodium — ${s.sodiumPerServing}mg per serving` },
      flag:   { tone: 'caution', label: 'High sodium', detail: `${s.sodiumPerServing}mg` },
    }),
  },
  {
    id: 'additive_high_risk',
    severity: 'high',
    when: s => s.additiveMaxRisk === 'high',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a high-risk additive' },
      flag:   { tone: 'avoid', label: 'High-risk additive' },
    }),
  },
  {
    id: 'additive_moderate_risk',
    severity: 'moderate',
    when: s => s.additiveMaxRisk === 'moderate',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a moderate-risk additive' },
      flag:   { tone: 'caution', label: 'Moderate-risk additive' },
    }),
  },
  {
    id: 'ultra_processed',
    severity: 'moderate',
    when: s => s.novaGroup === 4,
    build: () => ({
      reason: { kind: 'neg', text: 'Ultra-processed (NOVA group 4)' },
      flag:   { tone: 'caution', label: 'Ultra-processed', detail: 'NOVA 4' },
    }),
  },
  {
    id: 'nutri_score_de',
    severity: 'moderate',
    when: s => s.nutriScore === 'D' || s.nutriScore === 'E',
    build: s => ({
      reason: { kind: 'neg', text: `Nutri-Score ${s.nutriScore}` },
    }),
  },
  {
    id: 'allergen_match',
    severity: 'high',
    when: (s, profile) => s.containsAllergens.some(a => profile.allergens.includes(a)),
    build: (s, p) => {
      // Profile is needed for the matched intersection — passed via separate call site.
      const { allergens } = p;
      return {
        reason: { kind: 'neg', text: `Contains allergens you avoid` },
        flag:   { tone: 'avoid', label: 'Allergen', detail: allergens.join(', ') },
      };
    },
  },
  {
    id: 'goal_low_sugar_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('low_sugar') && s.sugarPerServing >= 8,
    build: s => ({
      reason: { kind: 'neg', text: `Above your low-sugar goal (${s.sugarPerServing}g)` },
    }),
  },
  {
    id: 'goal_less_processed_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('less_processed') && (s.novaGroup ?? 0) >= 3,
    build: s => ({
      reason: { kind: 'neg', text: `Processing level (NOVA ${s.novaGroup}) above your goal` },
    }),
  },
  {
    id: 'pos_no_additives',
    severity: 'pos',
    when: s => s.additiveCount === 0,
    build: () => ({ reason: { kind: 'pos', text: 'No additives detected' } }),
  },
  {
    id: 'pos_high_protein',
    severity: 'pos',
    when: s => s.proteinPerServing >= 10,
    build: s => ({ reason: { kind: 'pos', text: `Good protein content (${s.proteinPerServing}g)` } }),
  },
  {
    id: 'pos_nutri_a_b',
    severity: 'pos',
    when: s => s.nutriScore === 'A' || s.nutriScore === 'B',
    build: s => ({ reason: { kind: 'pos', text: `Nutri-Score ${s.nutriScore}` } }),
  },
  {
    id: 'pos_low_sugar',
    severity: 'pos',
    when: s => s.sugarPerServing < 5 && (s.kcalPerServing > 0),
    build: () => ({ reason: { kind: 'pos', text: 'Low sugar' } }),
  },
];
```

- [ ] **Step 3: `src/lib/rules/explanations.ts`**

```ts
import type { SignalSet } from './signals';

export function buildSummary(triggered: string[], s: SignalSet): string {
  if (triggered.includes('high_added_sugar') && triggered.includes('ultra_processed')) {
    return 'Ultra-processed, high sugar load.';
  }
  if (triggered.includes('additive_high_risk')) {
    return 'Contains a concerning additive.';
  }
  if (triggered.includes('allergen_match')) {
    return 'Contains an allergen you watch.';
  }
  if (triggered.includes('high_added_sugar') || triggered.includes('moderate_added_sugar')) {
    return 'Sweetened more than ideal.';
  }
  if (triggered.includes('ultra_processed')) {
    return 'Ultra-processed product.';
  }
  if (s.additiveCount === 0 && s.sugarPerServing < 5 && (s.nutriScoreOrdinal <= 1)) {
    return 'Whole-food, low sugar, no concerning additives.';
  }
  if (s.proteinPerServing >= 10 && s.sugarPerServing < 8) {
    return 'Solid protein, controlled sugar.';
  }
  return 'Mixed profile — review the details below.';
}
```

- [ ] **Step 4: `src/lib/rules/engine.ts`**

```ts
import type { Product } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { VerdictResult, Reason, Flag } from '@/types/verdict';
import { extractSignals } from './signals';
import { RULES } from './registry';
import { SEVERITY_POINTS, bandToVerdict } from './score';
import { buildSummary } from './explanations';

const MAX_REASONS = 5;

export function evaluate(product: Product, profile: Profile): VerdictResult {
  const signals = extractSignals(product);
  let score = 100;
  const triggeredRuleIds: string[] = [];
  const negReasons: Reason[] = [];
  const posReasons: Reason[] = [];
  const flags: Flag[] = [];

  for (const rule of RULES) {
    if (!rule.when(signals, profile, product)) continue;
    triggeredRuleIds.push(rule.id);
    if (rule.severity !== 'pos') {
      score -= SEVERITY_POINTS[rule.severity];
    }
    const hit = rule.build(signals, product);
    if (hit.reason) (hit.reason.kind === 'pos' ? posReasons : negReasons).push(hit.reason);
    if (hit.flag) flags.push(hit.flag);
  }

  score = Math.max(0, score);
  const verdict = bandToVerdict(score);
  const reasons = [...negReasons, ...posReasons].slice(0, MAX_REASONS);
  const summary = buildSummary(triggeredRuleIds, signals);

  return { verdict, score, summary, reasons, flags, triggeredRuleIds };
}
```

- [ ] **Step 5: Test fixtures-driven snapshot**

`src/lib/rules/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluate } from './engine';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';
import { DEFAULT_PROFILE } from '@/types/profile';

describe('evaluate', () => {
  it('cola is Avoid', () => {
    const r = evaluate(PRODUCT_INDEX.p_cola, DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
    expect(r.score).toBeLessThan(40);
    expect(r.triggeredRuleIds).toContain('high_added_sugar');
    expect(r.triggeredRuleIds).toContain('additive_high_risk');
    expect(r.triggeredRuleIds).toContain('ultra_processed');
  });

  it('strawberry yogurt is Caution', () => {
    const r = evaluate(PRODUCT_INDEX.p_strawberry_yogurt, DEFAULT_PROFILE);
    expect(r.verdict).toBe('caution');
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.score).toBeLessThan(70);
  });

  it('plain yogurt is Good', () => {
    const r = evaluate(PRODUCT_INDEX.p_plain_yogurt, DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it('sparkling water is Good with positives', () => {
    const r = evaluate(PRODUCT_INDEX.p_sparkling, DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.reasons.some(x => x.kind === 'pos')).toBe(true);
  });

  it('allergen profile triggers allergen_match flag', () => {
    const r = evaluate(PRODUCT_INDEX.p_protein_bar, { ...DEFAULT_PROFILE, allergens: ['nuts'] });
    expect(r.triggeredRuleIds).toContain('allergen_match');
    expect(r.flags.some(f => f.label === 'Allergen')).toBe(true);
  });
});
```

Run: `npm run test:run`. Expected: all green. If verdict bands miss, tune `SEVERITY_POINTS` until the four sample expectations hold.

- [ ] **Step 6: Commit and push**

```bash
git add src/lib/rules
git commit -m "feat(rules): registry, score banding, engine, explanations (TDD)"
git push
```

---

## Task 14: Neon schema + Drizzle setup + Open Food Facts client + route handler

**Files:**
- Create: `drizzle.config.ts`, `drizzle/schema.ts`, `src/lib/db/client.ts`, `src/lib/off/client.ts`, `src/lib/off/normalize.ts`, `src/lib/off/normalize.test.ts`, `src/app/api/products/[barcode]/route.ts`

- [ ] **Step 1: Read the relevant docs**

```bash
ls node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
```

Read `route.md` (or whichever describes the route handler signature in 16.x).

- [ ] **Step 2: `drizzle/schema.ts`**

```ts
import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  barcode: text('barcode').primaryKey(),
  brand: text('brand').notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull(),
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
```

- [ ] **Step 3: `drizzle.config.ts`**

```ts
import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

- [ ] **Step 4: `src/lib/db/client.ts`**

```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../../../drizzle/schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  _db = drizzle(neon(url), { schema });
  return _db;
}

export { schema };
```

- [ ] **Step 5: `src/lib/off/normalize.ts`**

```ts
import type { Product, NutriScoreGrade, NovaGroup, AllergenKey, Additive } from '@/types/product';
import { lookupAdditive } from '@/lib/additives/registry';

interface OFFRaw {
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    ingredients_text?: string;
    allergens_tags?: string[];
    additives_tags?: string[];
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    nova_group?: number | string;
    serving_size?: string;
    nutriments?: {
      'energy-kcal_serving'?: number; 'energy-kcal_100g'?: number;
      proteins_serving?: number; proteins_100g?: number;
      carbohydrates_serving?: number; carbohydrates_100g?: number;
      sugars_serving?: number; sugars_100g?: number;
      fat_serving?: number; fat_100g?: number;
      'saturated-fat_serving'?: number; 'saturated-fat_100g'?: number;
      fiber_serving?: number; fiber_100g?: number;
      sodium_serving?: number; sodium_100g?: number;
    };
  };
  status?: number;
}

const ALLERGEN_MAP: Record<string, AllergenKey> = {
  'en:gluten': 'gluten', 'en:milk': 'dairy', 'en:eggs': 'eggs',
  'en:nuts': 'nuts', 'en:peanuts': 'peanuts', 'en:soybeans': 'soy',
  'en:fish': 'fish', 'en:crustaceans': 'shellfish', 'en:sesame-seeds': 'sesame',
};

function pickGrade(g?: string): NutriScoreGrade | null {
  if (!g) return null;
  const u = g.toUpperCase();
  return (u === 'A' || u === 'B' || u === 'C' || u === 'D' || u === 'E') ? u : null;
}

function pickNova(n?: number | string): NovaGroup | null {
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  if (v === 1 || v === 2 || v === 3 || v === 4) return v;
  return null;
}

function pickServing(serving?: number, per100?: number): number {
  if (typeof serving === 'number' && Number.isFinite(serving)) return Math.round(serving * 10) / 10;
  if (typeof per100 === 'number' && Number.isFinite(per100)) return Math.round(per100 * 10) / 10;
  return 0;
}

export function normalizeOFF(raw: OFFRaw, barcode: string): Product | null {
  if (raw.status !== 1 || !raw.product) return null;
  const p = raw.product;
  const n = p.nutriments ?? {};
  const ingredients = (p.ingredients_text ?? '').split(/,\s*/).filter(Boolean);
  const allergens = (p.allergens_tags ?? [])
    .map(t => ALLERGEN_MAP[t]).filter(Boolean) as AllergenKey[];
  const additives: Additive[] = (p.additives_tags ?? [])
    .map(t => t.replace(/^en:/i, '').toUpperCase())
    .map(code => lookupAdditive(code) ?? { code, name: code, risk: 'low' as const, detail: 'No detailed info on file.' });

  return {
    id: barcode,
    type: 'barcode',
    brand: (p.brands ?? '').split(',')[0]?.trim() || 'Unknown',
    name: p.product_name ?? 'Unknown product',
    subtitle: p.quantity ?? '',
    swatch: '#7a8a5e',
    glyph: (p.product_name ?? '?').slice(0, 1).toUpperCase(),
    ingredients,
    allergens: Array.from(new Set(allergens)),
    additives,
    nutrition: {
      serving: p.serving_size ?? 'serving',
      kcal:    pickServing(n['energy-kcal_serving'], n['energy-kcal_100g']),
      protein: pickServing(n.proteins_serving, n.proteins_100g),
      carbs:   pickServing(n.carbohydrates_serving, n.carbohydrates_100g),
      sugar:   pickServing(n.sugars_serving, n.sugars_100g),
      fat:     pickServing(n.fat_serving, n.fat_100g),
      satFat:  pickServing(n['saturated-fat_serving'], n['saturated-fat_100g']),
      fiber:   pickServing(n.fiber_serving, n.fiber_100g),
      sodium:  Math.round(pickServing(n.sodium_serving, n.sodium_100g) * 1000),  // OFF stores g, we want mg
    },
    nutriScore: pickGrade(p.nutriscore_grade),
    ecoScore:   pickGrade(p.ecoscore_grade),
    novaGroup:  pickNova(p.nova_group),
  };
}
```

- [ ] **Step 6: Test the normalizer**

`src/lib/off/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { normalizeOFF } from './normalize';

describe('normalizeOFF', () => {
  it('returns null when product not found', () => {
    expect(normalizeOFF({ status: 0 }, '000')).toBeNull();
  });

  it('maps OFF allergen tags to canonical keys', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Test', brands: 'X', quantity: '100g',
        allergens_tags: ['en:milk', 'en:gluten'],
        nutriments: { 'energy-kcal_serving': 100 },
      },
    }, '111');
    expect(r?.allergens.sort()).toEqual(['dairy', 'gluten']);
  });

  it('converts sodium grams → milligrams', () => {
    const r = normalizeOFF({
      status: 1,
      product: { product_name: 'X', brands: 'Y', nutriments: { sodium_serving: 0.45 } },
    }, '222');
    expect(r?.nutrition.sodium).toBe(450);
  });
});
```

Run: `npm run test:run`. Expected: 3 new green.

- [ ] **Step 7: `src/lib/off/client.ts`**

```ts
import { normalizeOFF } from './normalize';
import type { Product } from '@/types/product';

export async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BiteLens/1.0 (https://github.com/RaduRS/bitelens)' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return normalizeOFF(json, barcode);
}
```

- [ ] **Step 8: Route handler `src/app/api/products/[barcode]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { fetchProductFromOFF } from '@/lib/off/client';
import { extractSignals } from '@/lib/rules/signals';
import type { Product } from '@/types/product';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ barcode: string }> },
) {
  const { barcode } = await ctx.params;
  if (!/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }
  const db = getDb();

  const cached = await db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);
  if (cached.length > 0) {
    const row = cached[0];
    const product: Product = rowToProduct(row);
    return NextResponse.json({ product, source: 'cache' });
  }

  const fresh = await fetchProductFromOFF(barcode);
  if (!fresh) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const signals = extractSignals(fresh);
  await db.insert(schema.products).values({
    barcode, brand: fresh.brand, name: fresh.name, subtitle: fresh.subtitle,
    ingredients: fresh.ingredients ?? [], allergens: fresh.allergens,
    additives: fresh.additives, nutrition: fresh.nutrition,
    nutriScore: fresh.nutriScore, ecoScore: fresh.ecoScore, novaGroup: fresh.novaGroup,
    signals,
  }).onConflictDoNothing();

  return NextResponse.json({ product: fresh, source: 'live' });
}

function rowToProduct(row: typeof schema.products.$inferSelect): Product {
  return {
    id: row.barcode, type: 'barcode',
    brand: row.brand, name: row.name, subtitle: row.subtitle,
    swatch: '#7a8a5e', glyph: row.name.slice(0, 1).toUpperCase(),
    ingredients: row.ingredients,
    allergens: row.allergens as Product['allergens'],
    additives: row.additives as Product['additives'],
    nutrition: row.nutrition as Product['nutrition'],
    nutriScore: row.nutriScore as Product['nutriScore'],
    ecoScore: row.ecoScore as Product['ecoScore'],
    novaGroup: row.novaGroup as Product['novaGroup'],
  };
}
```

- [ ] **Step 9: Push schema to Neon (requires DATABASE_URL — ask user when ready)**

Wait for the user to provide the Neon URL. Once they do, write it into `.env.local`:

```
DATABASE_URL="postgresql://..."
```

Then:

```bash
npm run db:push
```

Expected: drizzle-kit creates the `products` table.

- [ ] **Step 10: Commit and push**

```bash
git add drizzle.config.ts drizzle/ src/lib/db src/lib/off src/app/api package.json package-lock.json
git commit -m "feat(db): drizzle schema + OFF normalizer + cache-first route handler"
git push
```

---

## Task 15: Home (Scan) page wired to history + profile banner

**Files:**
- Rewrite: `src/app/page.tsx`
- Create: `src/components/home/PrimaryActionCard.tsx`, `src/components/home/QuickStats.tsx`, `src/components/home/ProfileWatchBanner.tsx`

- [ ] **Step 1: `src/components/home/PrimaryActionCard.tsx`** — port `screens.jsx:176-214`.

```tsx
import type { ReactNode } from 'react';

interface Props {
  tone: 'primary' | 'ghost';
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick?: () => void;
}

export function PrimaryActionCard({ tone, eyebrow, title, subtitle, icon, onClick }: Props) {
  const isPrimary = tone === 'primary';
  return (
    <button
      onClick={onClick}
      className="relative flex w-full cursor-pointer items-center gap-4 overflow-hidden text-left text-text"
      style={{
        padding: 20, borderRadius: 22,
        background: isPrimary
          ? 'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, var(--color-surface)) 0%, var(--color-surface) 80%)'
          : 'var(--color-surface)',
        border: isPrimary
          ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)'
          : '0.5px solid rgba(255,255,255,0.07)',
        boxShadow: isPrimary ? '0 0 24px color-mix(in oklab, var(--color-accent) 12%, transparent)' : 'none',
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center"
        style={{
          width: 52, height: 52, borderRadius: 14,
          background: isPrimary ? 'color-mix(in oklab, var(--color-accent) 18%, transparent)' : 'rgba(255,255,255,0.05)',
          border: isPrimary ? '0.5px solid color-mix(in oklab, var(--color-accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
          color: isPrimary ? 'var(--color-accent)' : 'var(--color-text)',
        }}
      >{icon}</div>
      <div className="min-w-0 flex-1">
        <div
          className="mb-1 font-mono uppercase"
          style={{
            fontSize: 10,
            color: isPrimary ? 'var(--color-accent)' : 'var(--color-text-dim)',
            letterSpacing: '0.18em',
          }}
        >{eyebrow}</div>
        <div className="mb-0.5 font-semibold" style={{ fontSize: 17, letterSpacing: '-0.01em' }}>{title}</div>
        <div className="text-text-dim" style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ color: 'var(--color-text-dim)' }}>
        <path d="M5 3L11 9L5 15" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: `src/components/home/QuickStats.tsx`** — port `screens.jsx:91-112`.

```tsx
interface Props {
  avgScore: number;
  goodCount: number;
  total: number;
}

export function QuickStats({ avgScore, goodCount, total }: Props) {
  const items = [
    { label: 'Avg score', value: avgScore || '—', color: 'var(--color-accent)' },
    { label: 'Good picks', value: total ? `${goodCount}/${total}` : '—', color: 'var(--color-text)' },
    { label: 'This week', value: total, color: 'var(--color-text)' },
  ];
  return (
    <div className="px-5 pt-6">
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.05)', borderRadius: 14,
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {items.map(s => (
          <div key={s.label} className="bg-surface text-center" style={{ padding: '12px 12px' }}>
            <div
              className="font-mono"
              style={{
                fontSize: 22, fontWeight: 500, color: s.color,
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}
            >{s.value}</div>
            <div
              className="mt-0.5 uppercase text-text-dim"
              style={{ fontSize: 10, letterSpacing: '0.1em' }}
            >{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/home/ProfileWatchBanner.tsx`** — port `screens.jsx:121-150`.

```tsx
'use client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/profile';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';

export function ProfileWatchBanner({ profile }: { profile: Profile }) {
  const router = useRouter();
  if (profile.allergens.length === 0) return null;
  return (
    <div className="px-5 pt-5">
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: '12px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="flex flex-shrink-0 items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 6.5L5 9L10 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 text-text-dim" style={{ fontSize: 12 }}>
          Watching for{' '}
          <span className="text-text" style={{ fontWeight: 500 }}>
            {profile.allergens.map(a => ALLERGEN_LABELS[a]).join(', ')}
          </span>{' '}· {profile.goals.length} goal{profile.goals.length === 1 ? '' : 's'}
        </div>
        <button
          onClick={() => router.push('/you')}
          className="cursor-pointer border-0 bg-transparent"
          style={{ color: 'var(--color-accent)', fontSize: 12, fontWeight: 500 }}
        >Edit</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Move home page into `(tabs)` group**

Delete `src/app/page.tsx`. Create `src/app/(tabs)/page.tsx`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryActionCard } from '@/components/home/PrimaryActionCard';
import { QuickStats } from '@/components/home/QuickStats';
import { ProfileWatchBanner } from '@/components/home/ProfileWatchBanner';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { RecentRow } from '@/components/product/RecentRow';
import { useProfile } from '@/hooks/useProfile';
import { useHistory } from '@/hooks/useHistory';

export default function HomePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { scans } = useHistory();

  const goodCount = scans.filter(s => s.verdict === 'good').length;
  const avgScore = scans.length
    ? Math.round(scans.reduce((s, r) => s + r.score, 0) / scans.length)
    : 0;

  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar
        right={
          <IconButton onClick={() => router.push('/you')} aria-label="Profile">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M2 12c1.2-2.2 3-3.4 5-3.4s3.8 1.2 5 3.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </IconButton>
        }
      />

      <div className="px-6 pt-4">
        <div
          className="mb-3.5 flex items-center gap-2 font-mono uppercase"
          style={{ fontSize: 11, color: 'var(--color-accent)', letterSpacing: '0.22em' }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)',
            }}
          />
          Ready to scan
        </div>
        <h1
          className="m-0 font-semibold text-text"
          style={{ fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.025em' }}
        >
          Point. Scan.<br />
          <span className="text-text-dim">Understand.</span>
        </h1>
      </div>

      <QuickStats avgScore={avgScore} goodCount={goodCount} total={scans.length} />

      <div className="flex flex-col gap-3 px-5 pt-5">
        <PrimaryActionCard
          tone="primary" eyebrow="Primary" title="Scan a barcode" subtitle="For packaged products"
          onClick={() => router.push('/barcode')}
          icon={
            <svg width="20" height="20" viewBox="0 0 22 22">
              <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <line x1="3.5" y1="5" x2="3.5" y2="17" /><line x1="6" y1="5" x2="6" y2="17" />
                <line x1="8.5" y1="5" x2="8.5" y2="17" /><line x1="11" y1="5" x2="11" y2="17" />
                <line x1="13.5" y1="5" x2="13.5" y2="17" /><line x1="16" y1="5" x2="16" y2="17" />
                <line x1="18.5" y1="5" x2="18.5" y2="17" />
              </g>
            </svg>
          }
        />
        <PrimaryActionCard
          tone="ghost" eyebrow="Visual" title="Photograph food" subtitle="Real meals & fresh items"
          onClick={() => router.push('/photo')}
          icon={
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
              <rect x="7.5" y="3.5" width="7" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          }
        />
      </div>

      <ProfileWatchBanner profile={profile} />

      <div className="flex-1 px-5 pt-6">
        <SectionLabel
          action={
            <button
              onClick={() => router.push('/history')}
              className="inline-flex cursor-pointer items-center border-0 bg-transparent font-mono uppercase text-text-dim"
              style={{ fontSize: 12, letterSpacing: '0.08em' }}
            >
              View all
              <svg width="9" height="9" viewBox="0 0 9 9" style={{ marginLeft: 4 }}>
                <path d="M2 1.5L6 4.5L2 7.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          }
        >Recent · {scans.length}</SectionLabel>
        {scans.length > 0 ? (
          <div
            className="overflow-hidden bg-surface"
            style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {scans.slice(0, 3).map((s, i) => (
              <div
                key={s.id}
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
              >
                <RecentRow
                  product={{
                    id: s.barcode, type: s.snapshot.type,
                    brand: s.snapshot.brand, name: s.snapshot.name, subtitle: s.snapshot.subtitle,
                    swatch: s.snapshot.swatch, glyph: s.snapshot.glyph,
                    nutriScore: s.snapshot.nutriScore, ecoScore: s.snapshot.ecoScore, novaGroup: s.snapshot.novaGroup,
                    allergens: [], additives: [], nutrition: { serving: '', kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, satFat: 0, fiber: 0, sodium: 0 },
                    favorite: s.favorite,
                    verdict: s.verdict, score: s.score,
                  }}
                  onClick={() => router.push(`/result/${s.barcode}`)}
                  showFav
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center text-text-dim"
            style={{ padding: '20px 0', fontSize: 13 }}
          >No scans yet. Tap above to start.</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Sanity-check Home in browser**

Run: `npm run dev`. Open `/`. Expected: Home with the dark hero "Point. Scan. Understand.", stats showing dashes (no history yet), two action cards, no profile banner (no allergens). Tab bar at the bottom with Scan highlighted.
Stop server.

- [ ] **Step 6: Commit and push**

```bash
git add src/app src/components/home
git commit -m "feat: Home (Scan) page wired to profile + history"
git push
```

---

## Task 16: Barcode scanner page (`@zxing/browser`)

**Files:**
- Create: `src/app/barcode/page.tsx`, `src/components/barcode/Scanner.tsx`, `src/components/barcode/Corners.tsx`

- [ ] **Step 1: `src/components/barcode/Corners.tsx`** — port `screens.jsx:315-326`.

```tsx
type Pos = 'tl' | 'tr' | 'bl' | 'br';

export function Corners({ verdict }: { verdict?: 'good' }) {
  const c = verdict === 'good' ? 'var(--color-accent)' : 'rgba(255,255,255,0.85)';
  const sz = 26, w = 2;
  const base = { position: 'absolute' as const, width: sz, height: sz };
  const styles: Record<Pos, React.CSSProperties> = {
    tl: { ...base, top: 0, left: 0, borderTop: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderTopLeftRadius: 6 },
    tr: { ...base, top: 0, right: 0, borderTop: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderTopRightRadius: 6 },
    bl: { ...base, bottom: 0, left: 0, borderBottom: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderBottomLeftRadius: 6 },
    br: { ...base, bottom: 0, right: 0, borderBottom: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderBottomRightRadius: 6 },
  };
  const glow = verdict === 'good' ? '0 0 12px var(--color-accent-glow)' : 'none';
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as Pos[]).map(p => (
        <div key={p} style={{ ...styles[p], boxShadow: glow, transition: 'all 0.3s' }} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: `src/components/barcode/Scanner.tsx`**

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Corners } from './Corners';

type Phase = 'idle' | 'scanning' | 'success' | 'error';

export function Scanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        if (!videoRef.current) return;
        setPhase('scanning');
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _err, ctrl) => {
            if (result) {
              setPhase('success');
              ctrl.stop();
              const code = result.getText();
              setTimeout(() => router.push(`/result/${encodeURIComponent(code)}`), 600);
            }
          },
        );
        controlsRef.current = controls;
      } catch (e) {
        setPhase('error');
        setErrorText(e instanceof Error ? e.message : 'Camera unavailable');
      }
    })();

    return () => {
      controlsRef.current?.stop();
    };
  }, [router]);

  const submitManual = (code: string) => {
    const trimmed = code.trim();
    if (!/^\d{6,14}$/.test(trimmed)) return;
    router.push(`/result/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative h-full overflow-hidden bg-black">
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }}
      />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 280, height: 180 }}>
        <Corners verdict={phase === 'success' ? 'good' : undefined} />
        {phase === 'scanning' && (
          <div
            className="animate-bl-scan absolute"
            style={{
              left: 8, right: 8, height: 2, borderRadius: 1,
              background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
              boxShadow: '0 0 12px var(--color-accent-glow), 0 0 24px var(--color-accent-glow)',
            }}
          />
        )}
        {phase === 'success' && (
          <div
            className="animate-bl-pop absolute inset-0 flex items-center justify-center"
            style={{
              background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
              borderRadius: 12,
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--color-accent)',
                boxShadow: '0 0 24px var(--color-accent-glow)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 26 26">
                <path d="M7 13L11 17L19 9" stroke="#0a0a0b" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-28 left-0 right-0 px-8 text-center">
        <div
          className="inline-flex items-center gap-2 text-text"
          style={{
            padding: '10px 16px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            fontSize: 13,
          }}
        >
          {phase === 'scanning' && (
            <>
              <span
                className="animate-bl-pulse"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent-glow)',
                }}
              />
              Hold steady — scanning
            </>
          )}
          {phase === 'success' && <><span style={{ color: 'var(--color-accent)' }}>✓</span> Got it</>}
          {phase === 'error' && <span style={{ color: 'var(--color-red)' }}>{errorText}</span>}
        </div>
      </div>

      {phase === 'error' && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6">
          <ManualInput onSubmit={submitManual} />
        </div>
      )}
    </div>
  );
}

function ManualInput({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [v, setV] = useState('');
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(v); }}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <input
        value={v} onChange={e => setV(e.target.value)} inputMode="numeric"
        placeholder="Enter barcode"
        className="flex-1 outline-none"
        style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          color: 'var(--color-text)', fontSize: 14,
        }}
      />
      <button
        type="submit"
        className="cursor-pointer text-bg"
        style={{
          padding: '10px 14px', borderRadius: 12,
          background: 'var(--color-accent)', fontWeight: 600, border: 0,
        }}
      >Go</button>
    </form>
  );
}
```

- [ ] **Step 3: `src/app/barcode/page.tsx`**

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Scanner } from '@/components/barcode/Scanner';

export default function BarcodePage() {
  const router = useRouter();
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 z-10">
        <TopBar onBack={() => router.push('/')} />
      </div>
      <Scanner />
    </div>
  );
}
```

- [ ] **Step 4: Smoke-test**

Run: `npm run dev`. Open `/barcode` on a device with a camera (or simulate camera in DevTools). Expected: the camera permission prompt, then a live feed with the corner brackets + animated scan-line. On a denied permission, the manual input appears with an error message.
Stop server.

- [ ] **Step 5: Commit and push**

```bash
git add src/app/barcode src/components/barcode
git commit -m "feat: barcode scanner page with @zxing/browser + manual fallback"
git push
```

---

## Task 17: Result screen (server component + client island)

**Files:**
- Create: `src/app/result/[barcode]/page.tsx`, `src/app/result/[barcode]/result-client.tsx`

- [ ] **Step 1: `src/app/result/[barcode]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ResultClient } from './result-client';
import type { Product } from '@/types/product';

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { barcode } = await params;
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const res = await fetch(`${proto}://${host}/api/products/${encodeURIComponent(barcode)}`, { cache: 'no-store' });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Product fetch failed: ${res.status}`);
  const { product } = (await res.json()) as { product: Product };
  return <ResultClient product={product} />;
}
```

- [ ] **Step 2: `src/app/result/[barcode]/result-client.tsx`** — port `screens.jsx:490-673`.

```tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ulid } from 'ulid';
import type { Product } from '@/types/product';
import { TopBar } from '@/components/layout/TopBar';
import { IconButton } from '@/components/ui/IconButton';
import { ScanTypeIcon } from '@/components/ui/ScanTypeIcon';
import { ProductThumb } from '@/components/product/ProductThumb';
import { VerdictRing } from '@/components/verdict/VerdictRing';
import { NutriScoreBadge } from '@/components/badges/NutriScoreBadge';
import { NovaPill } from '@/components/badges/NovaPill';
import { EcoScoreBadge } from '@/components/badges/EcoScoreBadge';
import { AllergenAlert } from '@/components/result/AllergenAlert';
import { ReasonRow } from '@/components/result/ReasonRow';
import { FlagChip } from '@/components/result/FlagChip';
import { NutritionBlock } from '@/components/result/NutritionBlock';
import { AdditiveRow } from '@/components/result/AdditiveRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';
import { useProfile } from '@/hooks/useProfile';
import { evaluate } from '@/lib/rules/engine';
import { recordScan } from '@/lib/history/storage';
import { VERDICT } from '@/components/verdict/verdict-tokens';

const HIGHLIGHT = /sugar|syrup|maltitol|color|phosphoric|modified/i;

export function ResultClient({ product }: { product: Product }) {
  const router = useRouter();
  const { profile, hydrated } = useProfile();
  const result = evaluate(product, profile);
  const v = VERDICT[result.verdict];
  const matchedAllergens = product.allergens.filter(a => profile.allergens.includes(a));

  useEffect(() => {
    if (!hydrated) return;
    void recordScan({
      id: ulid(),
      barcode: product.id,
      scannedAt: Date.now(),
      verdict: result.verdict,
      score: result.score,
      favorite: !!product.favorite,
      snapshot: {
        brand: product.brand, name: product.name, subtitle: product.subtitle,
        swatch: product.swatch, glyph: product.glyph, type: product.type,
        nutriScore: product.nutriScore, ecoScore: product.ecoScore, novaGroup: product.novaGroup,
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, product.id]);

  return (
    <div className="relative h-screen overflow-y-auto">
      <div
        className="relative pb-7"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklab, ${v.color} 12%, var(--color-bg)) 0%, var(--color-bg) 70%)`,
        }}
      >
        <TopBar
          onBack={() => router.push('/')}
          right={
            <IconButton onClick={() => router.push(`/compare/${product.id}`)} aria-label="Compare">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="1" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <rect x="8" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </IconButton>
          }
        />

        <div className="px-6 pt-2">
          <div
            className="mb-[18px] flex items-center gap-2 font-mono uppercase text-text-dim"
            style={{ fontSize: 11, letterSpacing: '0.16em' }}
          >
            <ScanTypeIcon type={product.type} />
            {product.type === 'photo' ? 'Photo Result' : 'Barcode Result'}
          </div>

          <div className="mb-5 flex items-center gap-4">
            <ProductThumb product={product} size={64} radius={14} />
            <div className="min-w-0 flex-1">
              {product.brand && (
                <div
                  className="mb-[3px] font-mono uppercase text-text-dim"
                  style={{ fontSize: 11, letterSpacing: '0.08em' }}
                >{product.brand}</div>
              )}
              <div
                className="mb-1 font-semibold text-text"
                style={{ fontSize: 21, lineHeight: 1.15, letterSpacing: '-0.02em' }}
              >{product.name}</div>
              <div className="text-text-dim" style={{ fontSize: 13 }}>{product.subtitle}</div>
            </div>
          </div>

          <div className="flex justify-center" style={{ padding: '8px 0 16px' }}>
            <VerdictRing verdict={result.verdict} score={result.score} size={156} animateIn />
          </div>

          <div
            className="text-center text-text"
            style={{ fontSize: 16, lineHeight: 1.45, padding: '0 12px', letterSpacing: '-0.005em' }}
          >{result.summary}</div>

          <div className="mt-[18px] flex flex-wrap justify-center gap-2">
            {product.nutriScore && <NutriScoreBadge grade={product.nutriScore} />}
            {product.novaGroup && <NovaPill group={product.novaGroup} />}
            {product.ecoScore && <EcoScoreBadge grade={product.ecoScore} />}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pb-8">
        {matchedAllergens.length > 0 && <AllergenAlert matched={matchedAllergens} />}

        <div>
          <SectionLabel>Why · {result.reasons.length} signals</SectionLabel>
          <div
            className="bg-surface"
            style={{ borderRadius: 14, padding: '6px 16px', border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {result.reasons.map((r, i) => (
              <div
                key={i}
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
              >
                <ReasonRow {...r} />
              </div>
            ))}
          </div>
        </div>

        {result.flags.length > 0 && (
          <div>
            <SectionLabel>Flags</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {result.flags.map((f, i) => <FlagChip key={i} {...f} />)}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Nutrition</SectionLabel>
          <NutritionBlock nutrition={product.nutrition} />
        </div>

        {product.additives.length > 0 && (
          <div>
            <SectionLabel>Additives · {product.additives.length}</SectionLabel>
            <div
              className="overflow-hidden bg-surface"
              style={{ borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              {product.additives.map((a, i) => (
                <AdditiveRow key={a.code} additive={a} isLast={i === product.additives.length - 1} />
              ))}
            </div>
          </div>
        )}

        {product.allergens.length > 0 && (
          <div>
            <SectionLabel>Allergens</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {product.allergens.map(a => {
                const isMatch = matchedAllergens.includes(a);
                return (
                  <div
                    key={a}
                    style={{
                      padding: '6px 12px', borderRadius: 999,
                      background: isMatch ? 'color-mix(in oklab, var(--color-red) 14%, transparent)' : 'rgba(255,255,255,0.04)',
                      border: isMatch ? '0.5px solid color-mix(in oklab, var(--color-red) 35%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                      color: isMatch ? 'var(--color-red)' : 'var(--color-text)',
                      fontSize: 12, fontWeight: 500,
                    }}
                  >{ALLERGEN_LABELS[a]}</div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>{product.type === 'photo' ? 'Detected components' : 'Ingredients'}</SectionLabel>
          <div
            className="bg-surface text-text"
            style={{
              padding: 16, borderRadius: 14, fontSize: 14, lineHeight: 1.6,
              border: '0.5px solid rgba(255,255,255,0.06)', letterSpacing: '-0.005em',
            }}
          >
            {(product.ingredients ?? product.components ?? []).map((ing, i, arr) => (
              <span key={i}>
                <span style={{ color: HIGHLIGHT.test(ing) ? 'var(--color-amber)' : 'inherit' }}>{ing}</span>
                {i < arr.length - 1 && <span className="text-text-dim">, </span>}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push('/barcode')}
          className="flex w-full cursor-pointer items-center justify-center gap-2 text-bg"
          style={{
            padding: 16, border: 0, borderRadius: 14,
            background: 'var(--color-accent)',
            fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
            boxShadow: '0 0 24px var(--color-accent-glow)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4M12 1V5H8M4 15V11H8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Scan another
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `not-found.tsx` for the result route**

`src/app/result/[barcode]/not-found.tsx`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col">
      <TopBar onBack={() => router.push('/')} />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title="Product not found"
          sub="We couldn't find this barcode. Try again or scan a different product."
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Manual smoke-test (offline rules — needs Neon optional)**

Without Neon (DATABASE_URL unset), the route handler will throw — that's fine, this task ships the page. Verification deferred to Task 18.

- [ ] **Step 5: Commit and push**

```bash
git add src/app/result
git commit -m "feat: result screen with verdict ring, badges, additives, allergens"
git push
```

---

## Task 18: History page

**Files:** `src/app/(tabs)/history/page.tsx`

- [ ] **Step 1: Implement** — port `screens.jsx:676-727`.

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { RecentRow } from '@/components/product/RecentRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHistory } from '@/hooks/useHistory';
import type { VerdictLevel } from '@/types/verdict';

const FILTERS: { id: 'all' | VerdictLevel; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'good',    label: 'Good' },
  { id: 'caution', label: 'Caution' },
  { id: 'avoid',   label: 'Avoid' },
];

export default function HistoryPage() {
  const router = useRouter();
  const { scans } = useHistory();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<typeof FILTERS[number]['id']>('all');

  const filtered = scans.filter(s => {
    if (filter !== 'all' && s.verdict !== filter) return false;
    if (q) {
      const needle = q.toLowerCase();
      if (!s.snapshot.name.toLowerCase().includes(needle) && !s.snapshot.brand.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar title="History" right={<div style={{ width: 36, height: 36 }} />} />
      <div className="px-5 pt-2 pb-4">
        <div
          className="flex items-center gap-2.5 bg-surface"
          style={{
            padding: '10px 14px', borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: 'var(--color-text-dim)' }}>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search recents"
            className="flex-1 border-0 bg-transparent outline-none text-text"
            style={{ fontSize: 14, letterSpacing: '-0.005em' }}
          />
        </div>
      </div>
      <div className="flex gap-2 px-5 pb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="cursor-pointer"
            style={{
              padding: '7px 14px', borderRadius: 999,
              background: filter === f.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: '0.5px solid rgba(255,255,255,0.07)',
              color: filter === f.id ? 'var(--color-text)' : 'var(--color-text-dim)',
              fontSize: 12, fontWeight: 500,
            }}
          >{f.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {filtered.length > 0 ? (
          <div
            className="overflow-hidden bg-surface"
            style={{ borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)' }}
          >
            {filtered.map((s, i) => (
              <div
                key={s.id}
                style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
              >
                <RecentRow
                  product={{
                    id: s.barcode, type: s.snapshot.type,
                    brand: s.snapshot.brand, name: s.snapshot.name, subtitle: s.snapshot.subtitle,
                    swatch: s.snapshot.swatch, glyph: s.snapshot.glyph,
                    nutriScore: s.snapshot.nutriScore, ecoScore: s.snapshot.ecoScore, novaGroup: s.snapshot.novaGroup,
                    allergens: [], additives: [],
                    nutrition: { serving: '', kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, satFat: 0, fiber: 0, sodium: 0 },
                    favorite: s.favorite, verdict: s.verdict, score: s.score,
                  }}
                  onClick={() => router.push(`/result/${s.barcode}`)}
                  showFav
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={q ? 'No matches' : 'No recent scans yet'}
            sub={q ? 'Try a different search.' : 'Scans will appear here automatically.'}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit and push**

```bash
git add src/app/\(tabs\)/history
git commit -m "feat: history screen with filters + search"
git push
```

---

## Task 19: Stub pages — Discover, Photo, Compare

**Files:** `src/app/(tabs)/discover/page.tsx`, `src/app/photo/page.tsx`, `src/app/compare/[a]/page.tsx`

- [ ] **Step 1: Reusable stub component**

`src/components/ui/ComingNext.tsx`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';

interface Props {
  title: string;
  description: string;
  showBack?: boolean;
}

export function ComingNext({ title, description, showBack }: Props) {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col" style={{ paddingBottom: 72 }}>
      <TopBar
        title={title}
        onBack={showBack ? () => router.back() : undefined}
        right={!showBack ? <div style={{ width: 36, height: 36 }} /> : undefined}
      />
      <div className="flex flex-1 items-center justify-center px-6">
        <div
          className="max-w-sm text-center"
          style={{
            padding: 28, borderRadius: 18,
            background: 'var(--color-surface)',
            border: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)',
              color: 'var(--color-accent)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 2v16M2 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mb-2 font-semibold text-text" style={{ fontSize: 17 }}>{title}</div>
          <div className="text-text-dim" style={{ fontSize: 13, lineHeight: 1.5 }}>{description}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Discover stub** — `src/app/(tabs)/discover/page.tsx`

```tsx
import { ComingNext } from '@/components/ui/ComingNext';

export default function DiscoverPage() {
  return <ComingNext title="Discover" description="Browse, search, and find top-rated products. Coming in the next phase." />;
}
```

- [ ] **Step 3: Photo stub** — `src/app/photo/page.tsx`

```tsx
import { ComingNext } from '@/components/ui/ComingNext';

export default function PhotoPage() {
  return <ComingNext title="Photo scan" description="Snap a meal — we'll identify it and estimate nutrition. Coming in the next phase." showBack />;
}
```

- [ ] **Step 4: Compare stub** — `src/app/compare/[a]/page.tsx`

```tsx
import { ComingNext } from '@/components/ui/ComingNext';

export default function ComparePage() {
  return <ComingNext title="Compare" description="Side-by-side comparison with healthier alternatives. Coming in the next phase." showBack />;
}
```

- [ ] **Step 5: Commit and push**

```bash
git add src/app src/components/ui/ComingNext.tsx
git commit -m "feat: stub pages for discover, photo, compare"
git push
```

---

## Task 20: PWA — manifest + service worker registration

**Files:** `src/app/manifest.webmanifest/route.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png` (placeholder), `src/lib/pwa/register.ts`, modify `src/app/layout.tsx`

- [ ] **Step 1: Read the PWA guide**

Open and read `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` end-to-end. Take note of any required service-worker file conventions.

- [ ] **Step 2: Create placeholder icons**

```bash
mkdir -p public/icons
node -e "
const fs = require('fs'); const path = require('path');
const png192 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMAAAADAAQMAAABjxK4nAAAAA1BMVEUKCgsAcl4PAAAAEElEQVR4nGNgGAWjYBSMAAACgAABEzGdLgAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync(path.join('public/icons','icon-192.png'), png192);
fs.writeFileSync(path.join('public/icons','icon-512.png'), png192);
console.log('icons written');
"
```

(Replace these with real BiteLens icons later — 192×192 and 512×512 PNGs. The placeholders are 1×1 so the manifest loads but Lighthouse will warn.)

- [ ] **Step 3: `src/app/manifest.webmanifest/route.ts`**

```ts
export function GET() {
  const body = {
    name: 'BiteLens',
    short_name: 'BiteLens',
    description: 'Scan packaged food, see what is in it, decide instantly.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/manifest+json' },
  });
}
```

- [ ] **Step 4: Service worker source**

Per the PWA guide, place the SW where it needs to be (the guide will say `public/sw.js` or a route). Use the file convention from the guide. As of Next 16 the typical pattern is a public-static `sw.js`:

`public/sw.js`:

```js
const CACHE = 'bitelens-v1';
const SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
      return res;
    }).catch(() => caches.match('/')))
  );
});
```

- [ ] **Step 5: `src/lib/pwa/register.ts`**

```ts
'use client';
import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
```

- [ ] **Step 6: Mount in `layout.tsx`**

Modify `src/app/layout.tsx` body to include `<PwaRegister />`:

```tsx
import { PwaRegister } from '@/lib/pwa/register';
// ...
<body className="min-h-full bg-bg text-text">
  {children}
  <PwaRegister />
</body>
```

- [ ] **Step 7: Verify build succeeds**

Run: `npm run build`
Expected: clean build with no TypeScript errors.

- [ ] **Step 8: Commit and push**

```bash
git add src/app/manifest.webmanifest src/app/layout.tsx src/lib/pwa public/sw.js public/icons
git commit -m "feat(pwa): manifest, service worker, registration"
git push
```

---

## Task 21: Vercel deployment

**Files:** none (web UI work)

- [ ] **Step 1: User provides Neon `DATABASE_URL`**

Wait for the user. Once provided:

```bash
echo "DATABASE_URL=\"<value>\"" >> .env.local
npm run db:push
```

Verify the `products` table exists by running `npm run db:studio` and inspecting the schema.

- [ ] **Step 2: Connect repo to Vercel**

Through the Vercel dashboard (UI):
1. Import `https://github.com/RaduRS/bitelens`.
2. Set project framework to "Next.js" (auto-detected).
3. Add environment variable `DATABASE_URL` with the Neon string.
4. Deploy.

- [ ] **Step 3: Smoke test the live URL**

On an iPhone:
1. Open the Vercel URL.
2. Confirm dark home screen renders, "Add to Home Screen" works (manifest valid).
3. Tap "Scan a barcode" — camera should request permission. Scan a real barcode (try the back of any pantry item).
4. Confirm result screen shows verdict ring, badges, reasons. Confirm Neon row appears in `db:studio`.
5. Tap "You" → toggle nuts allergen → re-scan a peanut/almond product → confirm allergen alert banner appears.

- [ ] **Step 4: Commit final README touch-up if anything was off**

(Likely no commit needed.)

---

## Self-review

Spec coverage check (against `docs/superpowers/specs/2026-05-04-bitelens-mvp-design.md`):

- Home (Scan tab) — Task 15
- Barcode scanner with manual fallback — Task 16
- Result screen with verdict ring, badges (Nutri/Eco/NOVA), additives, allergen alert, nutrition, ingredients, alternatives stub — Task 17
- History with filters + search — Task 18
- You / Profile (diet, allergens, goals) — Task 10
- Stubs for Discover/Photo/Compare — Task 19
- Neon `products` table cache — Task 14
- localStorage profile + IndexedDB history — Tasks 10, 11
- Rules engine (signals, registry, score, engine, explanations) — Tasks 12, 13
- Additive registry — Task 12
- PWA manifest + SW — Task 20
- Vercel deployment — Task 21
- Tailwind v4 `@theme`, fonts, animations — Task 2
- Sample fixtures — Task 3

Placeholder scan: no "TBD", no "implement later", every step has code or exact commands.

Type consistency: `Verdict`/`VerdictLevel` consistent across files; `RuleHit`/`Rule` types match between `registry.ts` and `engine.ts`; `ScanEntry.snapshot` shape matches what `RecentRow` consumes; `Product` + `Profile` imports use the `@/types/product` re-export root.

One known calibration risk: rule severity points may not produce the exact verdict bands the spec calls out for every sample fixture. Step 13.5 asks the engineer to tune `SEVERITY_POINTS` until the four targeted assertions hold (cola=avoid, strawberry yogurt=caution, plain yogurt=good, sparkling=good). This is the only place where empirical calibration is expected, and the test names exactly which products to target.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-04-bitelens-mvp-phase1.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
