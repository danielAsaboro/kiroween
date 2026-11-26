# Apps — Design

## Package layout

```
apps/app-one/
  index.html          Vite entry point
  vite.config.ts      base: /kiroween/app-one/
  package.json        name: @kiroween/app-one, scripts: dev, build
  src/
    seed.ts           buildAppOneTree(): BoardNode — the topic tree with interest values
    hydrate.ts        hydrateAppOne(data): valOf function over board-data.json
    main.ts           DOM setup + BoardUI mount (also exports mountAppOne for tests)
    app-one.test.ts   smoke test

apps/app-two/
  index.html
  vite.config.ts      base: /kiroween/app-two/
  package.json        name: @kiroween/app-two, scripts: dev, build
  src/
    seed.ts           buildAppTwoTree(): BoardNode — layoffs tree, all Collecting
    hydrate.ts        hydrateAppTwo(): valOf returning ungraded/collecting state
    main.ts           DOM setup + BoardUI mount (also exports mountAppTwo for tests)
    app-two.test.ts   smoke test

site/
  index.html          landing page (pure HTML + inline styles)

vite.config.ts        root: orchestrates multi-app build to dist-site/
```

## Seed trees

### app-one (buildAppOneTree)

```
Front page (page)
  Geopolitics (section)
    US strikes Iran (question, id: iran)      ← lead
      Fresh wallets (source, id: iran.wallets)
        poly (node)
      Tankers (source, id: iran.tankers)
        adsb (node)
      Pizza (source, id: iran.pizza)
        pizzint (node)
    Hormuz closure (question, id: hormuz)
    China × Taiwan (question, id: taiwan)
```

Interest values: `nodeInterest({ questionGraded: true/false, sourceGraded: false, ... })` from `@kiroween/skeleton`.

### app-two (buildAppTwoTree)

```
Front page (page)
  Layoffs (section)
    Microsoft 2026 (question, id: msft)       ← lead
      WARN filings (source, id: msft.warn)
        wa-esd (node), ca-edd (node)
      EDGAR 8-K (source, id: msft.edgar)
        edgar (node)
      Job boards (source, id: msft.jobs)
        greenhouse (node)
    Meta 2026 (question, id: meta)
      WARN filings (source, id: meta.warn)
        ca-edd (node)
      Job boards (source, id: meta.jobs)
        greenhouse (node)
```

All weights 0, all verdicts `collecting`.

## Hydration

### app-one (hydrateAppOne)

```typescript
function valOf(nodeId: string, playhead: number): { gap: string; tells: string; market: string; lit: boolean }
```

- For the lead question `iran`: reads `data.replay.hours[playhead]`, returns formatted gap/tells/market.
- For other nodes: returns their tell state from `data.tells[...]`.
- Numbers come exclusively from `loadBoardData()`.

### app-two (hydrateAppTwo)

```typescript
function valOf(nodeId: string, _playhead: number): { gap: string; tells: string; market: string; lit: boolean }
```

Returns fixed ungraded/collecting values. No fixture data needed.

## Build config

### vite.config.ts (root)

Uses Vite's multi-page build approach via a custom plugin that runs the per-app builds sequentially. Output: `dist-site/`.

### per-app vite.config.ts

```typescript
export default defineConfig({
  base: '/kiroween/app-one/',   // or app-two
  build: { outDir: '../../dist-site/app-one', emptyOutDir: false },
})
```

## Smoke test pattern

```typescript
// @vitest-environment jsdom
import { mountAppOne } from './main.js';

it('mounts without throwing', () => {
  document.body.innerHTML = '<div id="app"></div>';
  const ui = mountAppOne(document.getElementById('app')!);
  expect(ui).toBeDefined();
});

it('shows Settled YES at SETTLED', () => {
  document.body.innerHTML = '<div id="app"></div>';
  const ui = mountAppOne(document.getElementById('app')!);
  ui.setPlayhead(200);
  expect(document.body.textContent).toContain('Settled YES');
});
```

## GitHub Actions

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
```
