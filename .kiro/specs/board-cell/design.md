# Board Cell — Design

## Module layout

```
skeleton/src/board/
  types.ts        CellNode, Tier, SlotValues, RenderOptions interfaces
  tier.ts         tierOf(), fitsWhole() — pure functions, no DOM
  slots.ts        slotValues() — derives Tells/Market/Gap or Reading/Line/State
  render.ts       renderCell() — DOM builder, calls tierOf + slotValues
  flash.ts        shouldFlash() — pure predicate for significant-move detection
  index.ts        re-exports public API
skeleton/src/board/board-cell.test.ts
```

---

## types.ts

```typescript
export type Tier = 'full' | 'card' | 'chip' | 'dot' | 'tile';

export type NodeKind = 'page' | 'section' | 'question' | 'source' | 'node';

export interface CellNode {
  id: string;
  kind: NodeKind;
  name: string;
  /** Ancestor names from root down, excluding this node's own name */
  ancestorNames: string[];
  weight: number;         // 0 = ungraded/killed; used for dimming
  /** Slot values at the current replay position */
  slots: SlotValues;
  recordLine: string;
  /** True when this cell is the focused (framed) cell */
  focused: boolean;
}

export interface SlotValues {
  labelA: string;    // 'Tells' | 'Reading'
  valueA: string;
  deltaA?: Delta;
  labelB: string;    // 'Market' | 'Fire line'
  valueB: string;
  deltaB?: Delta;
  labelC: string;    // 'Gap' | 'State'
  valueC: string;
  lit: boolean;      // true when fired or gap ≥ 5 pts
  /** Coarse signature — changes only on a significant move */
  sig: string;
}

export interface Delta {
  direction: 1 | 0 | -1;
  display: string;   // e.g. '▲ 2 pts'
}

export interface RenderOptions {
  /** Screen rectangle available for this cell */
  screenW: number;
  screenH: number;
  /** Available header height (may be smaller than screenH for parent cells) */
  headerH: number;
}
```

---

## tier.ts

```typescript
/** Ordered tiers from largest to smallest. */
export const TIERS: Tier[] = ['full', 'card', 'chip', 'dot', 'tile'];

/** Minimum screen dimensions required before even attempting a tier. */
export const TIER_MIN: Record<Tier, { w: number; h: number }> = {
  full: { w: 300, h: 185 },
  card: { w: 150, h: 70  },
  chip: { w: 64,  h: 22  },
  dot:  { w: 14,  h: 14  },
  tile: { w: 0,   h: 0   },
};

/**
 * Choose the richest tier whose minimum dimensions are met AND whose
 * content fits (as reported by `fits`).
 *
 * `fits(tier)` must be a pure, side-effect-free predicate.
 * Returns 'tile' as the ultimate fallback.
 */
export function tierOf(
  screenW: number,
  screenH: number,
  fits: (tier: Tier) => boolean,
): Tier {
  for (const tier of TIERS) {
    const min = TIER_MIN[tier];
    if (screenW >= min.w && screenH >= min.h && fits(tier)) return tier;
  }
  return 'tile';
}
```

Monotonicity proof: for fixed `h` and `fits`, a wider `w` can only pass more
`w >= min.w` guards — it never fails one that a narrower width passed. So the
first matching tier can only stay the same or move to a richer one as `w` grows. ✓

---

## slots.ts

```typescript
/**
 * Derive slot values for a CellNode.
 * This is a pure function: it reads only from the node's pre-populated
 * `slots` field and formats them for display.
 * Numbers must arrive via loadBoardData (enforced at the call site).
 */
export function slotValues(node: CellNode): SlotValues {
  return node.slots;
}
```

The caller (the app layer) is responsible for constructing `CellNode.slots` from
`loadBoardData()`. `renderCell` never calls `loadBoardData` directly; it receives
a fully-constructed `CellNode`.

---

## flash.ts

```typescript
/**
 * Returns true when a data move is significant enough to trigger a flash.
 * Never returns true for a layout/camera change.
 *
 * Rules:
 * - Whole-point change: |sig_new - sig_old| implies ≥ 1 pp in Tells or Market.
 * - Fire-line crossing: fired state flipped.
 * - Wallet step: ≥ 25% change in the 72 h USD value.
 */
export function shouldFlash(prevSig: string, nextSig: string): boolean {
  return prevSig !== nextSig;
}
```

The `sig` field in `SlotValues` is a coarse fingerprint that changes only when the
data moves significantly (a whole point, a fire, a 25% wallet step). `shouldFlash`
delegates entirely to sig comparison — it never fires on camera moves because sig
is not updated during camera transitions.

---

## render.ts

```typescript
/**
 * Render a cell for `node` at the given `tier` into `container`.
 * Appends exactly one `.cell` div. Returns the element.
 *
 * DOM is built with `document.createElement` / `textContent` only —
 * no innerHTML, no framework.
 */
export function renderCell(
  node: CellNode,
  tier: Tier,
  container: Element,
  opts: RenderOptions,
): HTMLElement;
```

### DOM structure produced

```
div.cell[data-tier][data-kind][aria-label]
  div.cell-hd                      ← visible at Full/Card/Chip
    div.cell-title                 ← headline (omitted at Tile/Dot/front-page)
    div.cell-slots                 ← three slots (Full/Card only)
      span.cell-slot × 3
        span.cell-slot-label
        span.cell-slot-value
        span.cell-slot-delta?      ← only when delta present
    canvas.cell-strip              ← dot matrix (Full/Card)
    p.cell-record                  ← record line (Full only)
  span.cell-dot                    ← only at Dot tier
```

### Modifier classes

- `cell--lit` — when `slots.lit` is true
- `cell--dim` — when `node.weight === 0` and `!node.focused`
- `cell--focused` — when `node.focused`

---

## Tests (board-cell.test.ts)

### Property tests (fast-check)

1. **tierOf is monotonic** — for any fixed `h` and `fits`, `tierOf(w₁, h, fits) ≤ tierOf(w₂, h, fits)` in tier order when `w₁ ≤ w₂`.
2. **tierOf is monotonic in h** — symmetric property for height.

### Example tests

1. `tierOf(300, 185, () => true)` → `'full'`
2. `tierOf(300, 185, t => t !== 'full')` → `'card'`
3. `tierOf(14, 14, () => false)` → `'dot'`
4. `tierOf(1, 1, () => false)` → `'tile'`
5. `renderCell(node, 'full', container, opts)` appends exactly one `.cell` to container.
6. Name uniqueness: `node.name` does not appear in `node.ancestorNames`.
7. `shouldFlash('a', 'a')` → false; `shouldFlash('a', 'b')` → true.
