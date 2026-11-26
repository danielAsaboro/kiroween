// Public API for the board UI kit
export { layoutTree, nodeInterest, WORLD_W, WORLD_H } from './layout.js';
export { frameOf, interpolateCamera, animDuration, buildZoomInterp } from './camera.js';
export { indexRows, indexState } from './index-state.js';
export { islandState } from './island.js';
export { filterNotes } from './notes.js';
export { LASTH, SETTLED, STEP_MS, tickInterval, clampP } from './replay.js';
export { LOOK, COLORS } from './look.js';
export { easeCubicOut } from './ease.js';
export { BoardUI } from './board.js';
export type {
  BoardNode,
  LayoutRect,
  CameraView,
  NoteEntry,
  NoteKind,
  IndexRow,
  IslandMode,
  IslandState,
  NodeKind,
} from './types.js';
export type { ReplaySpeed } from './replay.js';
export type { BoardOptions } from './board.js';
