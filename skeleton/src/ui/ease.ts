/**
 * easeCubicOut — t → 1 − (1 − t)³
 *
 * Matches d3.easeCubicOut. Kept local to avoid pulling in the whole
 * d3-ease package for a single one-line curve.
 */
export function easeCubicOut(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}
