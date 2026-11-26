/**
 * Returns true when the change from prevSig to nextSig represents a
 * significant data move that should trigger a cell flash.
 *
 * The `sig` field in SlotValues is a coarse fingerprint computed from the
 * underlying data. It changes only on:
 *   - A whole-point change (≥ 1 pp in Tells or Market)
 *   - A tell crossing its fire line (state changes to Fired / Quiet)
 *   - A fresh-wallet step of ≥ 25% of the previous 72 h value
 *
 * It does NOT change on camera zooms or layout reflows, so this predicate
 * never triggers a flash for those events.
 */
export function shouldFlash(prevSig: string, nextSig: string): boolean {
  return prevSig !== nextSig;
}
