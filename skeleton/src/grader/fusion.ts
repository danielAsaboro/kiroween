import type { Reading } from './types.js';

/**
 * Extract a stable operator key from a reading's src field.
 * We use the hostname of a URL, or the whole src string if not a URL.
 */
function operatorKey(src: string): string {
  try {
    return new URL(src).hostname;
  } catch {
    return src;
  }
}

/**
 * Fuse an array of readings for one question into a single probability [0, 1].
 *
 * Rules (all applied before averaging, ensuring monotonicity):
 * 1. Deduplicate by tell id — keep the entry with the highest value per tell.
 * 2. Deduplicate by operator (src hostname) — keep the highest value per operator.
 * 3. Each surviving reading contributes:
 *    - `value`    if fired
 *    - `baseline` if not fired
 *    weighted by `reading.weight` (default 1).
 * 4. Return weighted average. Empty input → 0.
 *
 * Monotonicity: steps 1–2 always retain the maximum value for each key,
 * and step 3 is non-decreasing in value, so raising any input value never
 * lowers the output.
 */
export function fuse(readings: Reading[]): number {
  if (readings.length === 0) return 0;

  // Step 1: dedupe by tell id — keep highest value per tell
  const byTell = new Map<string, Reading>();
  for (const r of readings) {
    const existing = byTell.get(r.tell);
    if (existing === undefined || r.value > existing.value) {
      byTell.set(r.tell, r);
    }
  }

  // Step 2: dedupe by operator — keep highest value per operator
  const byOperator = new Map<string, Reading>();
  for (const r of byTell.values()) {
    const key = operatorKey(r.src);
    const existing = byOperator.get(key);
    if (existing === undefined || r.value > existing.value) {
      byOperator.set(key, r);
    }
  }

  // Step 3 & 4: weighted average
  let weightedSum = 0;
  let totalWeight = 0;
  for (const r of byOperator.values()) {
    const w = r.weight ?? 1;
    const contribution = r.fired ? r.value : r.baseline;
    weightedSum += contribution * w;
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}
