# Grader — Design

## Module layout

```
skeleton/src/grader/
  types.ts          TypeScript interfaces for board-data shapes
  load.ts           loadBoardData(): reads and validates board-data.json
  brier.ts          computeBrier(), perMarketBrier()
  fusion.ts         fuse()
  scorecard.ts      scoreCard()
  index.ts          re-exports public API
skeleton/src/grader/grader.test.ts   vitest tests (example + property)
```

## types.ts

```typescript
export interface WalkForwardRow {
  t: string;
  market: string;
  pMarket: number;
  m1: number;
  m2w: number;
  y: 0 | 1;
}

export interface MarketEntry {
  id: string;
  question: string;
  outcome: 0 | 1;
}

export interface TellRecord {
  rule?: string;
  verdict: 'killed' | 'pending' | 'collecting' | 'graded';
  hits?: number;
  misses?: number;
  falseAlarms?: number;
  pYesGivenFired?: number;
  baseRate?: number;
  shrunkWeight?: [number, number, number]; // [point, lo, hi]
  deltaBrier?: [number, number, number];   // [point, lo, hi]
  why?: string;
}

export interface BoardData {
  walkForward: {
    markets: MarketEntry[];
    rows: WalkForwardRow[];
  };
  scoreTable: {
    scores: {
      M0: { brier: number };
      M1: { brier: number };
      M2W: { brier: number };
    };
  };
  tells: Record<string, TellRecord>;
}
```

## load.ts

`loadBoardData(path?: string): BoardData`

- Reads the JSON file synchronously (Node) or via a passed-in string (for tests).
- Validates presence of `walkForward.rows`, `walkForward.markets`, `scoreTable.scores`, `tells`.
- Throws `Error('board-data invalid: <reason>')` on any missing required key.
- Default path: `new URL('../../../fixtures/omens/board-data.json', import.meta.url)`.

## brier.ts

```
computeBrier(col: 'pMarket' | 'm1' | 'm2w', rows: WalkForwardRow[]): number
  → mean of (row[col] − row.y)²

perMarketBrier(marketId: string, rows: WalkForwardRow[]
): { pMarket: number; m2w: number; oursBeatMarket: boolean }
```

Brier score = mean squared error; lower is better. `oursBeatMarket` is `m2w < pMarket`.

## fusion.ts

```
fuse(readings: Reading[]): number
```

Algorithm:
1. Deduplicate by `tell` id — keep the entry with the highest `value` per tell.
2. Deduplicate by operator (derived from `src` domain) — keep the highest `value` per operator per question.
3. For each surviving reading:
   - If `fired`, contribute `value`.
   - Else contribute `baseline` (the pre-signal reference).
4. Return weighted average using each reading's weight (default 1 if unset).
5. If no readings, return 0.

Monotonicity guarantee: steps 1–2 always keep the max, and step 3 is monotone in value → raising any input never lowers output.

## scorecard.ts

```
scoreCard(tellName: string, data: BoardData): ScoreCard
```

Reads `data.tells[tellName]` and returns a typed `ScoreCard`. Throws if tell not found.

```typescript
export interface ScoreCard {
  tell: string;
  hits: number;
  misses: number;
  falseAlarms: number;
  pYesGivenFired: number;
  baseRate: number;
  shrunkWeight: [number, number, number];
  deltaBrier: [number, number, number];
  verdict: 'killed' | 'pending' | 'collecting' | 'graded';
  n: number;         // hits + misses + falseAlarms (settled markets scored)
  lowN: boolean;     // n < 5
}
```

## Tests (grader.test.ts)

### Example tests

- `computeBrier('pMarket', rows)` rounds to `0.1975`
- `computeBrier('m1', rows)` rounds to `0.2196`
- `computeBrier('m2w', rows)` rounds to `0.2261`
- `scoreCard('fresh-wallets', data).verdict === 'killed'`
- `scoreCard('fresh-wallets', data).deltaBrier[0] === -0.007`

### Property tests (fast-check)

- **No double-count**: for any array of readings with duplicate tell ids, `fuse(arr)` equals `fuse(deduped)`.
- **Monotonic**: for any array of readings, incrementing any `value` does not decrease `fuse()`.
- On counter-example: fast-check shrinks and the test logs the minimal failing case to stdout.
