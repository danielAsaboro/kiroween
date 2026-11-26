# Board — Requirements

## Overview

The full Omens board: a zoomable treemap of the topic tree, a left index, the Island status pill, a replay scrubber, a strip-window control, and a notes margin. Built as framework-free TypeScript rendering DOM. All numbers come through `skeleton/src/grader`. The cell renderer comes from `skeleton/src/board`.

## R1 Layout

- The topic tree (Front page → sections → questions → sources → nodes) is laid out **once** as nested rectangles via `d3-hierarchy` `treemap` with `treemapSquarify` at ratio 1.25, on a fixed 1600×1000 world.
- Node sizes are by **interest**:
  - Question factor: graded question 1.25, else 0.9.
  - Source factor: graded source 1.2, AI-connection source 0.9, else 0.7.
  - Node value = (question factor × source factor) / sibling count.
- Padding top by kind: question 44% of height, source 42%, node 36%; padding inner/outer 2.5% of min dimension.
- The layout **never reflows** while scrubbing. Only the camera and cell contents change.

## R2 Camera

- Click or Enter on a cell flies to frame it so it fills the board, using `d3-interpolate` `interpolateZoom`, eased with `easeCubicOut`, duration clamped 300–750 ms. `prefers-reduced-motion` jumps instantly.
- Esc, the Out button (hidden at the Front page) or a breadcrumb click steps out to the parent.
- No free pan or zoom.

## R3 Left index

- Rows: sections (bold) and questions (indented), each question showing its gap (or state when ungraded).
- The framed row carries an amber rule; rows in the framed path are highlighted.
- Clicking a row flies there.

## R4 Island

- Shows the lead question's Tells, Market and Gap.
- When framed outside the lead's branch: shows "Elsewhere" plus the lead's gap; clicking flies to the lead.
- After the last hour: shows "Settled YES" (settle time Feb 28 06:15 UTC).

## R5 Replay

- Scrubber over the 199 hours plus a Settled terminal (position 200 = LASTH+1).
- Play/pause, single-step, speeds 1× / 5× / 20×. At 1× the whole range plays in about 24 s (interval = 24000 / SETTLED ms per hour).
- Keys: Space (play/pause), S or → (step forward), ← (step back), Esc (out).
- Every cell, the index, the Island and the notes update together at each playhead move (one rAF-batched update).

## R6 Strip window

- Control with 12 h / 33 h / 3 d / Week (201 h) options, changing the dot-strip window for all cells.

## R7 Notes margin

- Scoped to the framed node: a note is in scope when its node is the framed node or an ancestor of it, or the framed node is an ancestor of the note's node.
- Newest first, only notes at or before the playhead (`p <= P`).
- Filter: All / Press / Your AI.
- Opening a note moves the playhead to its time and flies to its node.

## R8 Look

- system-ui (Apple system face), tabular figures.
- Surfaces: rail `#0b0b0c`, page `#111113`, card `#18181b`, raised `#212125`.
- One amber accent `#FFB23E`; market line off-white `#ededed`.
- Spacing scale 4 / 8 / 12 / 16 / 24 / 32.
- Easing `cubic-bezier(.22,1,.36,1)`.
- No glows.

## Acceptance

- `layoutTree(tree)` is deterministic: two calls produce identical rectangles.
- Property: for every child, its rectangle nests strictly inside its parent's body (below the parent's top padding).
- `frameOf(rect)` returns the camera view for a cell.
- Island state function returns `{mode: 'lead' | 'elsewhere' | 'settled'}` correctly for the three cases.
- Index state marks the framed row `cur`, path rows `path`, in-frame rows `inframe`.
- Notes scoping filter matches the ancestor rule.
- Replay step at 1× covers the range in about 24 s.
