# Board — Design

## Module layout

```
skeleton/src/ui/
  types.ts       BoardNode, LayoutRect, CameraView, NoteEntry, IndexRow
  layout.ts      layoutTree() — d3-hierarchy treemap, pure, no DOM
  camera.ts      frameOf(), interpolateCamera() — pure geometry
  index.ts       indexRows(), indexState() — pure
  island.ts      islandState() — pure
  notes.ts       filterNotes() — pure
  replay.ts      STEP, tickInterval() — pure constants + helpers
  look.ts        CSS custom-property tokens (design system constants)
  board.ts       BoardUI class — DOM orchestration, wires everything together
  index.ts       re-exports public API
skeleton/src/ui/board.test.ts   vitest unit + fast-check property tests
```

## types.ts

```typescript
export interface BoardNode {
  id: string;
  kind: 'page' | 'section' | 'question' | 'source' | 'node';
  name: string;
  /** Interest value used for treemap sizing */
  v: number;
  children?: BoardNode[];
}

export interface LayoutRect {
  id: string;
  x0: number; y0: number; x1: number; y1: number;
  /** Header/title height in world units */
  paddingTop: number;
  depth: number;
  children?: LayoutRect[];
}

export interface CameraView {
  /** World-space centre X */
  cx: number;
  /** World-space centre Y */
  cy: number;
  /** World-space width of the viewport */
  width: number;
  /** Height/width ratio of the target rect */
  aspect: number;
}

export interface NoteEntry {
  /** Replay position (hour index) */
  p: number;
  /** Node id the note belongs to */
  nodeId: string;
  /** Text content */
  text: string;
  /** Set when it is a press note (has a press timestamp) */
  pressTime?: string;
}

export interface IndexRow {
  id: string;
  kind: 'section' | 'question';
  name: string;
  gap: string | null;
  lit: boolean;
  cur: boolean;
  path: boolean;
  inFrame: boolean;
}
```

## layout.ts

```typescript
export function layoutTree(root: BoardNode): LayoutRect
```

- Builds a `d3.hierarchy`, sums node `v` values, sorts descending.
- Runs `d3.treemap().size([1600, 1000]).tile(d3.treemapSquarify.ratio(1.25))`.
- `paddingInner` and `paddingOuter` = `min(w, h) * 0.025`.
- `paddingTop` by kind: question 44% of h, source 42%, node 36%.
- Returns a `LayoutRect` tree mirroring the input hierarchy.
- **Pure and deterministic** — no randomness, no DOM reads.

Interest values set by the caller before passing to `layoutTree`:
- `qf = graded ? 1.25 : 0.9` per question
- `sf = graded ? 1.2 : (ai ? 0.9 : 0.7)` per source
- `v = qf * sf / siblingCount` per node

## camera.ts

```typescript
/** Compute the camera view that frames a given rect to fill the board. */
export function frameOf(rect: LayoutRect): CameraView

/** Given start/end views and t∈[0,1], return the interpolated view.
    Uses d3.interpolateZoom geometry (rho=sqrt(2)). */
export function interpolateCamera(a: CameraView, b: CameraView, t: number): CameraView

/** Clamp animation duration ms (300–750), 0 for reduced-motion. */
export function animDuration(zoomInterp: { duration: number }, reducedMotion: boolean): number
```

## index.ts (pure)

```typescript
/** Build the ordered list of index rows (sections + questions) from the tree. */
export function indexRows(root: BoardNode): Array<{ id: string; kind: string; name: string }>

/** Given the framed node id and an ancestor set, compute display state for each row. */
export function indexState(
  rows: ReturnType<typeof indexRows>,
  frameId: string,
  ancestorIds: Set<string>,
  gapOf: (id: string) => string | null,
  litOf: (id: string) => boolean,
): IndexRow[]
```

## island.ts (pure)

```typescript
export type IslandMode = 'lead' | 'elsewhere' | 'settled';

export interface IslandState {
  mode: IslandMode;
  /** present when mode = lead or elsewhere */
  gap?: string;
  /** present when mode = lead */
  tells?: string;
  market?: string;
  walletLit?: boolean;
}

export function islandState(
  frameId: string,
  leadId: string,
  leadAncestorIds: Set<string>,
  playhead: number,
  settled: number,
  valOf: (id: string) => { gap: string; tells: string; market: string; lit: boolean },
): IslandState
```

Rules:
- `playhead >= settled` → `{ mode: 'settled' }`
- `frameId === leadId` or `leadAncestorIds` contains `frameId` or frame's ancestors contain `leadId` → `{ mode: 'lead', ... }`
- else → `{ mode: 'elsewhere', ... }`

## notes.ts (pure)

```typescript
export type NoteKind = 'all' | 'press' | 'ai';

export function filterNotes(
  notes: NoteEntry[],
  frameId: string,
  ancestorIds: Set<string>,
  playhead: number,
  kind: NoteKind,
): NoteEntry[]
```

Keeps notes where:
1. `note.p <= playhead`
2. `note.nodeId === frameId` OR `ancestorIds.has(note.nodeId)` OR frame's descendants include the note's node (passed via `ancestorIds` being pre-computed both ways)
3. `kind === 'all'` OR (`kind === 'press'` AND `note.pressTime !== undefined`) OR (`kind === 'ai'` AND `note.pressTime === undefined`)

Returns sorted newest-first (descending `p`).

## replay.ts

```typescript
export const SETTLED = 200; // LASTH + 1
export const LASTH = 199;
export const STEP_MS = 24000 / SETTLED; // ≈120 ms per hour at 1×

export function tickInterval(speed: 1 | 5 | 20): number  // STEP_MS / speed
```

## look.ts

CSS tokens as `const` strings, so they can be inlined into a `<style>` tag by the assembler without a bundler:

```typescript
export const LOOK = `
:root {
  --rail:#0b0b0c; --page:#111113; --card:#18181b; --raised:#212125; --hover:#2a2a2f;
  --fg:#f2f2f4; --fg2:#a8a8b0; --fg3:#7c7c85;
  --amber:#FFB23E; --amber2:#FF9A1F;
  --hair:rgba(255,255,255,.07); --hair2:rgba(255,255,255,.13);
  --sans:system-ui,-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  --ease:cubic-bezier(.22,1,.36,1);
  color-scheme:dark;
}
* { box-sizing: border-box }
body { background: var(--rail); color: var(--fg); font: 14px/1.5 var(--sans);
       font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased }
`;
```

## board.ts — BoardUI

Orchestrates DOM: creates all cell elements, wires events, runs the rAF render loop, owns the replay timer. Calls only pure functions from the other modules for state derivation.

## Tests (board.test.ts)

### Property tests (fast-check)
1. `layoutTree` is deterministic: two calls with the same tree return identical rectangles.
2. For every node in the layout, its body rectangle nests strictly inside its parent's body (below `y0 + paddingTop`).

### Unit tests
1. `frameOf(rect)` — centre matches rect midpoint.
2. `animDuration({ duration: 500 }, false)` → clamped to [300, 750].
3. `animDuration({ duration: 500 }, true)` → 0.
4. `indexState` marks the frame row `cur`, path rows `path`.
5. `islandState` returns `settled` when `playhead >= SETTLED`.
6. `islandState` returns `elsewhere` when frame is not in lead branch.
7. `filterNotes` respects `playhead` cutoff, kind filter, scope.
8. `tickInterval(1)` ≈ 120 ms; `tickInterval(20)` ≈ 6 ms.
