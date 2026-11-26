# Board — Tasks

## Task 0 — Dependencies

Add `d3-hierarchy`, `d3-interpolate` and `@types/d3-hierarchy`, `@types/d3-interpolate` to `skeleton/package.json` (workspace dependencies of skeleton).

## Task 1 — types.ts

`BoardNode`, `LayoutRect`, `CameraView`, `NoteEntry`, `IndexRow`, `IslandMode`, `NoteKind`.

Acceptance: `tsc -b` clean.

## Task 2 — layout.ts

`layoutTree(root)` with d3-hierarchy treemap, squarify ratio 1.25, padding rules.
Acceptance:
- Deterministic: `layoutTree(t)` twice → identical.
- Property: children nest strictly inside parent's body.

## Task 3 — camera.ts

`frameOf`, `interpolateCamera` (using `d3-interpolate` `interpolateZoom`), `animDuration`.
Acceptance: unit tests for frame and duration clamps.

## Task 4 — index.ts (pure)

`indexRows`, `indexState`.
Acceptance: unit test — frame row is `cur`, ancestors are `path`, frame-descendant rows are `inFrame`.

## Task 5 — island.ts (pure)

`islandState` with lead/elsewhere/settled modes.
Acceptance: unit tests for the three modes.

## Task 6 — notes.ts (pure)

`filterNotes` with scope, playhead cutoff, kind filter.
Acceptance: unit tests.

## Task 7 — replay.ts

`LASTH`, `SETTLED`, `STEP_MS`, `tickInterval(speed)`.
Acceptance: `tickInterval(1)` ≈ 120 ms.

## Task 8 — look.ts

Design tokens (CSS custom properties) matching R8.

## Task 9 — board.ts (DOM orchestration)

`BoardUI` class wiring: cell click/Enter → fly, Esc → out, breadcrumb, Out button (hidden at front page), index click → fly, island click → fly to lead, replay controls (play/pause/step/speeds/keys), strip-window segmented control, notes margin with filters and note-open behaviour. rAF-batched playhead updates.

Acceptance: class compiles; constructor builds the DOM skeleton; no free pan/zoom handlers.

## Task 10 — index.ts

Re-export public API.

## Task 11 — Tests

`board.test.ts` — property tests (determinism, nesting) + unit tests for camera, index, island, notes, replay.

## Task 12 — Green CI

`pnpm test`, `pnpm lint`, `pnpm typecheck` all pass. Report counts.
