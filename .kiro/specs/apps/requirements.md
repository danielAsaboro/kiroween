# Apps — Requirements

## Overview

Two Vite applications sharing all components from `/skeleton`. A landing page. A GitHub Actions pipeline. Smoke tests.

---

## R1 Vite apps

- `apps/app-one` — Geopolitics board: US strikes Iran (lead), Hormuz closure, China × Taiwan.
- `apps/app-two` — Layoffs board: Microsoft 2026, Meta 2026.
- Each app has `index.html` and `src/main.ts`.
- `main.ts` builds the seed tree, hydrates it with numbers from `/skeleton/src/grader` (app-one) or inline Collecting state (app-two), and mounts `BoardUI` from `/skeleton/src/ui`.
- **No code is copied between apps.** Both import exclusively from `@kiroween/skeleton`.

### app-one — Graded

- Lead question: **"US strikes Iran by February 28, 2026?"**
- Numbers come from `fixtures/omens/board-data.json` via `loadBoardData()`.
- Tells: fresh-wallets (killed), tankers (pending), pizza (collecting).
- The replay covers hours 0–199 plus Settled.

### app-two — Honestly Ungraded

- Lead question: **Microsoft 2026 layoffs** (Kalshi KXCOMPANYLAYOFF).
- About 12 settled layoff markets — under the preregistered floor of 30.
- All sources are in Collecting state: CA/WA WARN filings, SEC EDGAR 8-K Item 2.05, job-board openings (Greenhouse, Lever, Ashby).
- The board shows the ungraded banner; score cards carry the low-n warning.

---

## R2 Landing page

- `site/index.html` — static HTML, no JS framework, no login.
- One-line pitch: "An open tells board. Signals earn weight only from markets that settled."
- Links: app-one, app-two, GitHub repo, score table (scoreTable in board-data.json).
- Styled with the same design tokens as the boards (graphite + amber).

---

## R3 Build

- `pnpm dev` starts both apps in parallel (via workspace `--if-present dev`).
- `pnpm build` writes a single static site to `dist-site/`:
  - `dist-site/index.html` — landing page
  - `dist-site/app-one/` — app-one bundle
  - `dist-site/app-two/` — app-two bundle
- Base path is `/kiroween/` (configurable) so it works under `https://danielasaboro.github.io/kiroween/`.
- A root `vite.config.ts` orchestrates the multi-app build.

---

## R4 GitHub Actions

- `.github/workflows/pages.yml`
- Triggers: push to `main`.
- Steps: checkout → setup Node 24 + pnpm → `pnpm install` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` → deploy `dist-site/` to GitHub Pages.
- Uses `actions/upload-pages-artifact` and `actions/deploy-pages`.

---

## R5 Smoke tests

- One vitest + jsdom test file per app: `apps/app-one/src/app-one.test.ts`, `apps/app-two/src/app-two.test.ts`.
- Each test:
  1. Imports the seed tree builder and hydration from the app's `main.ts` (exported as named functions).
  2. Mounts into a jsdom `document.body`.
  3. Advances the playhead to `SETTLED`.
  4. Asserts:
     - Island text contains "Settled YES" (app-one) or the ungraded banner text (app-two).
     - The lead question name appears in the index.
     - The board mounts without throwing.

---

## Acceptance

- `pnpm test` passes all smoke tests.
- `pnpm lint` clean.
- `pnpm typecheck` clean.
- `pnpm build` produces `dist-site/` with at least `index.html`, `app-one/index.html`, `app-two/index.html`.
