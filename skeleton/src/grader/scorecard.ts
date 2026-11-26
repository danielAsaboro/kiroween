import type { BoardData, ScoreCard } from './types.js';

/**
 * Build a ScoreCard for a named tell from loaded board data.
 * Throws if the tell is not found in data.tells.
 */
export function scoreCard(tellName: string, data: BoardData): ScoreCard {
  const record = data.tells[tellName];
  if (record === undefined) {
    throw new Error(`tell not found: ${tellName}`);
  }

  const hits = record.hits ?? 0;
  const misses = record.misses ?? 0;
  const falseAlarms = record.falseAlarms ?? 0;
  const n = hits + misses + falseAlarms;

  return {
    tell: tellName,
    hits,
    misses,
    falseAlarms,
    pYesGivenFired: record.pYesGivenFired ?? 0,
    baseRate: record.baseRate ?? 0,
    shrunkWeight: record.shrunkWeight ?? [0, 0, 0],
    deltaBrier: record.deltaBrier ?? [0, 0, 0],
    verdict: record.verdict,
    n,
    lowN: n < 5,
  };
}
