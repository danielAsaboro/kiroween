# Apps — Tasks

## Task 1 — Install Vite

Add `vite` and `@types/node` to root devDependencies. Add `vite` scripts to app-one and app-two `package.json`.

## Task 2 — app-one seed + hydration + entry

- `apps/app-one/src/seed.ts` — `buildAppOneTree(): BoardNode`
- `apps/app-one/src/hydrate.ts` — `hydrateAppOne(data: BoardData): ValOf`
- `apps/app-one/src/main.ts` — `mountAppOne(root: HTMLElement): BoardUI` (exported for tests)
- `apps/app-one/index.html`
- `apps/app-one/vite.config.ts`

## Task 3 — app-two seed + hydration + entry

- `apps/app-two/src/seed.ts` — `buildAppTwoTree(): BoardNode`
- `apps/app-two/src/hydrate.ts` — `hydrateAppTwo(): ValOf`
- `apps/app-two/src/main.ts` — `mountAppTwo(root: HTMLElement): BoardUI` (exported for tests)
- `apps/app-two/index.html`
- `apps/app-two/vite.config.ts`

## Task 4 — Landing page

- `site/index.html` — pitch, links, inline styles matching the design system.

## Task 5 — Root Vite build config

- Root `vite.config.ts` orchestrating the full static-site build to `dist-site/`.
- Copies `site/index.html` as `dist-site/index.html`.
- Runs app-one into `dist-site/app-one/`, app-two into `dist-site/app-two/`.

## Task 6 — GitHub Actions

- `.github/workflows/pages.yml`

## Task 7 — Smoke tests

- `apps/app-one/src/app-one.test.ts`
- `apps/app-two/src/app-two.test.ts`

## Task 8 — Green CI

`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass.
Report test counts and built file list.
