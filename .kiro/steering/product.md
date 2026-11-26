---
inclusion: always
---

# Product — Omens

## What it is

Omens is an open tells board. Independent nodes each post one odd public signal — fresh-wallet money on Polymarket, tanker counts, pizza-shop busyness, WARN filings — as signed Nostr readings. A signal earns its weight only from prediction markets that later settled against it. The board shows the fused reading next to the current market price and the gap between them. It never gives trading advice.

## Users

- Prediction-market traders who want to know what the aggregate odd signal says versus the market.
- OSINT watchers who want a live, cryptographically attributable record of public signals.

## Repo layout

```
skeleton/              tell contract, grader, fusion engine, board UI kit
  src/
    tells/             one adapter per tell (<name>.ts)
    grader/            walk-forward scorer
    fusion/            weighted combiner
    nostr/             relay publisher
    ui/                shared board components
apps/app-one/          Geopolitics board — US strikes Iran
apps/app-two/          Layoffs board — Microsoft, Meta
fixtures/omens/        static data consumed by the board (read-only at runtime)
.kiro/                 Kiro specs, steering and hooks
tools/oracles/         dev-only checkers
```

## Technical constraints

- TypeScript throughout.
- Runs fully in the browser — no server, no accounts.
- Static hosting only.
- Readings are published to Nostr; the board fetches them from public relays.
- Numbers displayed on the board come exclusively from `fixtures/omens/board-data.json`.
