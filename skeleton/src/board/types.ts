// Types for the board-cell component

export type Tier = 'full' | 'card' | 'chip' | 'dot' | 'tile';

export type NodeKind = 'page' | 'section' | 'question' | 'source' | 'node';

export interface Delta {
  /** +1, 0 or -1 */
  direction: 1 | 0 | -1;
  /** e.g. '▲ 2 pts' */
  display: string;
}

/** The three slot values shown in a cell. */
export interface SlotValues {
  /** 'Tells' or 'Reading' */
  labelA: string;
  valueA: string;
  deltaA?: Delta;
  /** 'Market' or 'Fire line' */
  labelB: string;
  valueB: string;
  deltaB?: Delta;
  /** 'Gap' or 'State' */
  labelC: string;
  valueC: string;
  /** true when fired or gap >= 5 points */
  lit: boolean;
  /**
   * Coarse signature: changes only on a significant data move
   * (a whole point, a fire, a 25% wallet step) — never on camera moves.
   */
  sig: string;
}

/** A topic-tree node in renderable form. */
export interface CellNode {
  id: string;
  kind: NodeKind;
  name: string;
  /** Names of all ancestors, root first, excluding this node's own name */
  ancestorNames: string[];
  /** 0 = ungraded/killed; used for dimming */
  weight: number;
  slots: SlotValues;
  recordLine: string;
  /** True when this cell is the focused (framed) cell */
  focused: boolean;
}

/** Screen rectangle available for a cell. */
export interface RenderOptions {
  screenW: number;
  screenH: number;
  /** Header height available (smaller than screenH under parent header strips) */
  headerH: number;
}
