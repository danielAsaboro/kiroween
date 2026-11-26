# Omens

An open tells board. Nodes post one odd public signal each — fresh-wallet money on Polymarket, tanker counts, pizza busyness, WARN filings — as signed Nostr readings. Every signal earns its weight only from markets that later settled. The board shows the fused reading next to the market price and the gap between them. It never gives trading advice.

## Layout

```
skeleton/        tell contract, grader, fusion engine, board UI kit
apps/app-one/    Geopolitics: US strikes Iran
apps/app-two/    Layoffs: Microsoft, Meta
.kiro/           Kiro specs, steering and hooks
fixtures/omens/  static board data (grader output — read-only)
```

## Run

Needs Node 24 and pnpm.

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Hard requirements

- [ ] Public GitHub repo, licence shown in the About panel
- [ ] `/.kiro` at the root, not in `.gitignore`
- [ ] `/skeleton`, `/apps/app-one`, `/apps/app-two`
- [ ] Built in Kiro; new work since Oct 30 2026
- [ ] Working URL, free and live until Jan 29 2027
- [ ] Public YouTube video under 3:00
- [ ] Write-up of Kiro usage by feature
- [ ] Submitted before Dec 4 2026 22:00 UTC

## Licence

MIT
