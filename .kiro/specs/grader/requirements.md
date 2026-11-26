# Grader — Requirements

## Overview

The grader scores tell adapters against settled prediction markets using walk-forward Brier scoring. It loads board data, computes per-model and per-market scores, fuses readings from multiple sources, and produces a score card for each tell.

## Requirements

### REQ-1 Typed board-data loading

The grader must load `fixtures/omens/board-data.json` and parse it into typed TypeScript interfaces. Any structural mismatch must throw at load time, not silently produce `undefined` values at runtime.

The interfaces must cover at minimum:
- `WalkForwardRow` — `{ t: string; market: string; pMarket: number; m1: number; m2w: number; y: 0 | 1 }`
- `MarketEntry` — `{ id: string; question: string; outcome: 0 | 1 }`
- `TellRecord` — verdict, hits/misses/falseAlarms, shrunkWeight, deltaBrier (all optional where absent in data)
- `BoardData` — the full top-level shape

### REQ-2 Brier score computation

Given `walkForward.rows`, the grader must compute the mean Brier score for each model column:

- `M0` (pMarket): `mean((p − y)²)` over all rows → must equal `0.1975` to 4 decimal places
- `M1` (m1): `mean((p − y)²)` over all rows → must equal `0.2196` to 4 decimal places
- `M2W` (m2w): `mean((p − y)²)` over all rows → must equal `0.2261` to 4 decimal places

The reference values come from `scoreTable.scores` in board-data.json.

### REQ-3 Per-market Brier scores

For each settled market in `walkForward.markets`, the grader must compute:
- Brier score of `pMarket` over that market's rows
- Brier score of `m2w` over that market's rows
- Boolean `oursBeatMarket`: whether m2w Brier < pMarket Brier

### REQ-4 Fusion

Given an array of `Reading` objects (from the tell contract) for one question, the grader must return a single fused probability in [0, 1]:

- **No double-count by source**: if the same tell identifier appears under multiple parents, it counts once.
- **Once-per-operator**: if the same operator (node runner identity) posts multiple readings for the same question, only one is used (highest confidence).
- **Monotonic**: raising any input reading's `value` must never decrease the fused output.

The fusion rule is a weighted average of the fired signals. Unfired signals contribute their baseline.

### REQ-5 Tell score card

For a given tell's data from board-data.json the grader must produce a `ScoreCard` containing:
- `hits`, `misses`, `falseAlarms`
- `pYesGivenFired` and `baseRate`
- `shrunkWeight` (point estimate and 90% CI)
- `deltaBrier` (point estimate and 90% CI)
- `verdict`: one of `'killed' | 'pending' | 'collecting' | 'graded'`

The fresh-wallets tell must produce verdict `'killed'` with `deltaBrier[0] === -0.007`, matching board-data.json exactly.

## Acceptance criteria

1. `computeBrier('pMarket', rows)` returns a value equal to `0.1975` when rounded to 4 dp.
2. `computeBrier('m1', rows)` returns a value equal to `0.2196` when rounded to 4 dp.
3. `computeBrier('m2w', rows)` returns a value equal to `0.2261` when rounded to 4 dp.
4. `scoreCard('fresh-wallets', data)` returns `verdict === 'killed'` and `deltaBrier[0] === -0.007`.
5. `fuse([])` returns 0.
6. Property: for any two valid reading arrays A and B where B[i].value >= A[i].value for all i, `fuse(B) >= fuse(A)`.
7. Property: doubling any reading in the input array does not change `fuse()`'s output.
8. Any shrunk fast-check counter-example is recorded in the test report output.
