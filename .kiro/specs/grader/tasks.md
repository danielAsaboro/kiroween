# Grader — Tasks

## Task 1 — Types

Create `skeleton/src/grader/types.ts` with:
- `WalkForwardRow`, `MarketEntry`, `TellRecord`, `BoardData` interfaces
- `ScoreCard` interface
- `Reading` re-export from tell contract (or inline for grader use)

Acceptance: `tsc -b` passes with no errors.

## Task 2 — Board-data loader

Create `skeleton/src/grader/load.ts` with `loadBoardData(path?)`.

Acceptance:
- Calling it with the real fixture path returns a `BoardData` without throwing.
- Calling it with malformed JSON throws `Error('board-data invalid: ...')`.

## Task 3 — Brier computation

Create `skeleton/src/grader/brier.ts` with `computeBrier` and `perMarketBrier`.

Acceptance:
- `computeBrier('pMarket', rows)` rounds to `0.1975` (4 dp).
- `computeBrier('m1', rows)` rounds to `0.2196` (4 dp).
- `computeBrier('m2w', rows)` rounds to `0.2261` (4 dp).

## Task 4 — Fusion engine

Create `skeleton/src/grader/fusion.ts` with `fuse(readings)`.

Acceptance:
- `fuse([])` returns `0`.
- Deduplication: same tell appearing twice → counted once.
- Monotonicity: raising any value never lowers output.

## Task 5 — Score card

Create `skeleton/src/grader/scorecard.ts` with `scoreCard(tellName, data)`.

Acceptance:
- `scoreCard('fresh-wallets', data).verdict === 'killed'`
- `scoreCard('fresh-wallets', data).deltaBrier[0] === -0.007`
- `scoreCard('tankers', data).verdict === 'pending'`
- `scoreCard('pizza', data).verdict === 'collecting'`

## Task 6 — Public index

Create `skeleton/src/grader/index.ts` re-exporting: `loadBoardData`, `computeBrier`, `perMarketBrier`, `fuse`, `scoreCard`, and all types.

## Task 7 — Tests

Create `skeleton/src/grader/grader.test.ts`:
- Example tests for REQ-2 (Brier values) and REQ-5 (fresh-wallets card).
- Property test: no double-count (fast-check).
- Property test: monotonicity (fast-check).
- If fast-check shrinks a counter-example, `console.error` the minimal case.

## Task 8 — Hooks

Create `.kiro/hooks` (JSON) with a hook that runs `pnpm test` on save of:
- `skeleton/src/grader/**`
- `.kiro/specs/tell-*/**`

## Task 9 — Green CI

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`.
Fix any failures. Report exact test counts.
