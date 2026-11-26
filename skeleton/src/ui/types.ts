// Types shared across the board UI modules

export type NodeKind = 'page' | 'section' | 'question' | 'source' | 'node';

/** A node in the topic tree as passed to the layout engine. */
export interface BoardNode {
  id: string;
  kind: NodeKind;
  name: string;
  /** Interest value computed by the caller before layout. */
  v: number;
  children?: BoardNode[];
}

/** A laid-out rectangle in world coordinates (1600×1000 canvas). */
export interface LayoutRect {
  id: string;
  kind: NodeKind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Header strip height in world units (computed from paddingTop). */
  paddingTop: number;
  depth: number;
  children: LayoutRect[];
}

/** Camera state: what region of the 1600×1000 world is visible. */
export interface CameraView {
  /** World-space centre X */
  cx: number;
  /** World-space centre Y */
  cy: number;
  /** World-space width of the visible area */
  width: number;
  /** Height ÷ width ratio of the target rect (preserved during zoom) */
  aspect: number;
}

/** A margin note entry. */
export interface NoteEntry {
  /** Replay hour index (0–199, or SETTLED=200) */
  p: number;
  /** ID of the node this note is pinned to */
  nodeId: string;
  /** Note body text */
  text: string;
  /** Set when it is a press report (has a human-readable press timestamp) */
  pressTime?: string;
}

export type NoteKind = 'all' | 'press' | 'ai';

/** A single row in the left index panel. */
export interface IndexRow {
  id: string;
  kind: 'section' | 'question';
  name: string;
  /** Gap value or state string shown next to the question; null for sections. */
  gap: string | null;
  lit: boolean;
  /** This row IS the framed node. */
  cur: boolean;
  /** This row is an ancestor of the framed node. */
  path: boolean;
  /** The framed node is a descendant of this row. */
  inFrame: boolean;
}

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
