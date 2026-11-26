// Types for board-data.json and grader public API

export interface WalkForwardRow {
  t: string;
  market: string;
  pMarket: number;
  m1: number;
  m2w: number;
  y: 0 | 1;
}

export interface MarketEntry {
  id: string;
  question: string;
  outcome: 0 | 1;
}

export interface TellRecord {
  rule?: string;
  verdict: 'killed' | 'pending' | 'collecting' | 'graded';
  hits?: number;
  misses?: number;
  falseAlarms?: number;
  pYesGivenFired?: number;
  baseRate?: number;
  /** [point, lo90, hi90] */
  shrunkWeight?: [number, number, number];
  /** [point, lo90, hi90] */
  deltaBrier?: [number, number, number];
  why?: string;
  leadsPrice?: string;
}

export interface BoardData {
  walkForward: {
    markets: MarketEntry[];
    rows: WalkForwardRow[];
  };
  scoreTable: {
    scores: {
      M0: { brier: number };
      M1: { brier: number };
      M2W: { brier: number };
    };
  };
  tells: Record<string, TellRecord>;
}

export interface ScoreCard {
  tell: string;
  hits: number;
  misses: number;
  falseAlarms: number;
  pYesGivenFired: number;
  baseRate: number;
  /** [point, lo90, hi90] */
  shrunkWeight: [number, number, number];
  /** [point, lo90, hi90] */
  deltaBrier: [number, number, number];
  verdict: 'killed' | 'pending' | 'collecting' | 'graded';
  /** hits + misses + falseAlarms */
  n: number;
  /** true when n < 5 */
  lowN: boolean;
}

/** Minimal Reading shape used by the fusion engine. */
export interface Reading {
  /** Tell identifier, e.g. "fresh-wallet" */
  tell: string;
  /** Polymarket or Kalshi market slug */
  market: string;
  /** ISO-8601 UTC */
  createdAt: string;
  /** Normalised 0–1 current value */
  value: number;
  /** Pre-signal baseline (0–1) used when not fired */
  baseline: number;
  /** Fire-line threshold (0–1) */
  line: number;
  /** value >= line */
  fired: boolean;
  /** Short description of the measurement method */
  method: string;
  /** URL or identifier of raw data source; domain used as operator key */
  src: string;
  /** Optional weight; defaults to 1 */
  weight?: number;
}
