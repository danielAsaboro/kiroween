import type { WalkForwardRow } from './types.js';

/**
 * Compute mean Brier score for a model column over all rows.
 * Brier score = mean((p − y)²); lower is better.
 */
export function computeBrier(col: 'pMarket' | 'm1' | 'm2w', rows: WalkForwardRow[]): number {
  if (rows.length === 0) return 0;
  let sum = 0;
  for (const row of rows) {
    const p = row[col];
    const diff = p - row.y;
    sum += diff * diff;
  }
  return sum / rows.length;
}

export interface PerMarketResult {
  marketId: string;
  pMarket: number;
  m2w: number;
  /** true when m2w Brier < pMarket Brier (ours beat the market baseline) */
  oursBeatMarket: boolean;
}

/**
 * Compute per-market Brier scores for pMarket and m2w.
 * Returns null when the market has no rows in the walk-forward data.
 */
export function perMarketBrier(marketId: string, rows: WalkForwardRow[]): PerMarketResult | null {
  const marketRows = rows.filter((r) => r.market === marketId);
  if (marketRows.length === 0) return null;
  const pMarket = computeBrier('pMarket', marketRows);
  const m2w = computeBrier('m2w', marketRows);
  return { marketId, pMarket, m2w, oursBeatMarket: m2w < pMarket };
}
