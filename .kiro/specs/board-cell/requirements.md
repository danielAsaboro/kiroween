# Board Cell — Requirements

## Overview

Every node in the topic tree (front page, section, question, source, node) is rendered by the
same cell component. The cell adapts its density to the screen space available via a tier system.
No framework is used; the cell renders DOM directly.

---

## REQ-1 Universal cell anatomy

Every cell, at every level, contains:

- **Headline** — the node's own name (displayed once; the breadcrumb carries the ancestor path).
- **Three slots** — labelled value triples:
  - At question/section/front-page level: `Tells | Market | Gap`
  - At source/node level: `Reading | Fire line | State`
- **Dot strip** — a canvas dot-matrix showing the recent signal history.
- **Record line** — one or two lines of provenance / status text.

The front page has no headline of its own. A section headlines its own name above its lead
question's slots.

---

## REQ-2 Tier system

A cell is rendered in exactly one of five tiers, chosen by the available screen rectangle
`(screenW × screenH)` and whether the content fits without truncation:

| Tier | Min screenW | Min screenH | Shows |
|------|------------|------------|-------|
| Full | 300 px | 185 px | Headline, three labelled slots, dot strip, record line |
| Card | 150 px | 70 px | Headline, one primary value + change, dot strip, gap/state |
| Chip | 64 px | 22 px | Name + state/gap (one or two lines) |
| Dot | 14 px | 14 px | Single dot indicator |
| Tile | — | — | No visible content (cell is a coloured rectangle only) |

A tier is only used when **all its text fits whole** (no truncation of numbers or labels).
If the content does not fit, the cell drops to the next smaller tier.

---

## REQ-3 Name uniqueness

Each name is shown exactly once. The breadcrumb carries the ancestor path, so a cell must
not repeat a name that already appears in an ancestor's headline.

Formally: for any cell `C` and its ancestor chain `A₁ … Aₙ`, the set
`{ headline(C) } ∪ { headline(Aᵢ) }` contains no duplicates.

---

## REQ-4 Weight-0 dimming

Sources and their child nodes whose weight is 0 are rendered with reduced opacity
(`dim` state). The exception is the currently focused ("framed") cell, which is always
rendered at full opacity regardless of weight.

---

## REQ-5 Slot delta (6 h change)

Each slot shows the change in its value over the last 6 hours:
- A `▲` / `▼` prefix followed by the magnitude.
- Shown as a `small` element so it does not break the primary value layout.

A cell **flashes once** (a brief background animation) when its underlying value undergoes
a significant move. Significant moves are:

- A whole-point change (≥ 1 percentage point in Tells or Market).
- A tell crossing its fire line (state change to Fired).
- A fresh-wallet step of ≥ 25% of the previous 72 h value.

Flashes must NOT trigger on camera zooms or layout changes — only on data moves.

---

## Acceptance criteria

1. `tierOf(w, h, fitsCallback)` returns `'full'` when `w ≥ 300`, `h ≥ 185`, and `fitsCallback('full')` is true.
2. `tierOf(w, h, fitsCallback)` drops to the next tier when `fitsCallback` returns false for the preferred tier.
3. `tierOf(14, 14, () => false)` returns `'dot'`.
4. `tierOf(1, 1, () => false)` returns `'tile'`.
5. `tierOf` is monotonic: for fixed `h` and `fitsCallback`, increasing `w` never produces a smaller tier.
6. A cell rendered for a question node does not contain the question's text in the headline of any ancestor cell rendered simultaneously.
7. `renderCell(node, tier, container)` appends exactly one `.cell` element to `container`.
8. Numbers read by `renderCell` come exclusively via `loadBoardData` from `skeleton/src/grader/load.ts`.
