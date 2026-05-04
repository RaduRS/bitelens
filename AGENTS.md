<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BiteLens project sources of truth

- **Product spec:** `bitelens-mvp-prd-updated.md` (root) — features, screens, rules engine, build order.
- **Visual design bundle:** `docs/design/` — exported from Claude Design. Read `docs/design/README.md` first, then `docs/design/project/BiteLens.html` (tokens + animations), then the imported `*.jsx` files (`data.jsx`, `components.jsx`, `screens.jsx`, `app.jsx`, `ios-frame.jsx`, `tweaks-panel.jsx`). Recreate the design pixel-perfectly in our Next.js stack — match the visual output, don't copy the prototype's React-via-Babel structure.
- **Approved design spec (when written):** `docs/superpowers/specs/<date>-bitelens-mvp-design.md`.
- **Stack:** Next.js 16.2.4 + React 19.2.4 + Tailwind v4 + App Router + `src/`. Deployment target: Vercel via GitHub. Database: Neon Postgres (provided later).
