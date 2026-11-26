# Board Cell — Tasks

## Task 1 — Types

Create `skeleton/src/board/types.ts` with:
- `Tier`, `NodeKind`, `CellNode`, `SlotValues`, `Delta`, `RenderOptions`

Acceptance: `tsc -b` with no errors.

## Task 2 — Tier logic

Create `skeleton/src/board/tier.ts` with `TIERS`, `TIER_MIN`, `tierOf`.

Acceptance:
- `tierOf(300, 185, () => true)` → `'full'`
- `tierOf(1, 1, () => false)` → `'tile'`
- Property: monotonic in width; monotonic in height.

## Task 3 — Flash predicate

Create `skeleton/src/board/flash.ts` with `shouldFlash`.

Acceptance:
- `shouldFlash('x', 'x')` → false
- `shouldFlash('x', 'y')` → true

## Task 4 — DOM renderer

Create `skeleton/src/board/render.ts` with `renderCell`.

Rules:
- No `innerHTML`. Build all elements with `document.createElement` + `textContent`.
- No React / Vue / Svelte.
- Numbers arrive via a pre-constructed `CellNode`; `renderCell` never calls `loadBoardData`.
- Returns the appended `HTMLElement`.

Acceptance:
- Appends exactly one `.cell` to `container`.
- At `'dot'` tier, the cell contains a `.cell-dot` span and no headline.
- At `'full'` tier, the cell contains `.cell-title`, `.cell-slots`, `.cell-strip`, `.cell-record`.
- `cell--dim` present when `node.weight === 0 && !node.focused`.
- `cell--focused` present when `node.focused`.

## Task 5 — Public index

Create `skeleton/src/board/index.ts` re-exporting all public symbols.

## Task 6 — Tests

Create `skeleton/src/board/board-cell.test.ts`:

- Property tests (fast-check):
  - `tierOf` monotonic in width (1 000 runs).
  - `tierOf` monotonic in height (1 000 runs).
- Example tests:
  - tierOf boundary values (full, card, chip, dot, tile).
  - Fallback when fits returns false.
  - `renderCell` appends exactly one `.cell`.
  - `cell--dim` / `cell--focused` modifier classes.
  - Name uniqueness: `node.name` not in `node.ancestorNames`.
  - `shouldFlash` true/false cases.

Report any shrunk counter-examples via `console.error`.

## Task 7 — Green CI

Run `pnpm test`, `pnpm lint`, `pnpm typecheck`.
Fix all failures. Report exact test counts.
