import type { IslandMode, IslandState } from './types.js';

export type { IslandMode, IslandState };

/**
 * Compute the Island status pill state.
 *
 * Rules (from the HTML reference):
 * - `playhead >= settled` → settled mode ("Settled YES")
 * - frame is in the lead branch OR lead is in frame's branch → lead mode
 * - otherwise → elsewhere mode
 *
 * @param frameId          Currently framed node id.
 * @param leadId           The lead question's id.
 * @param leadAncestorIds  Set of ancestor ids of the lead node (root-down).
 * @param frameAncestorIds Set of ancestor ids of the framed node (root-down).
 * @param playhead         Current replay hour index.
 * @param settled          The settled terminal index (LASTH + 1).
 * @param valOf            Returns slot values for a node id.
 */
export function islandState(
  frameId: string,
  leadId: string,
  leadAncestorIds: Set<string>,
  frameAncestorIds: Set<string>,
  playhead: number,
  settled: number,
  valOf: (id: string) => { gap: string; tells: string; market: string; lit: boolean },
): IslandState {
  if (playhead >= settled) {
    return { mode: 'settled' };
  }

  // "Related" means: the frame is the lead, the frame is in the lead's subtree,
  // or the lead is in the frame's subtree.
  const related =
    frameId === leadId || leadAncestorIds.has(frameId) || frameAncestorIds.has(leadId);

  const v = valOf(leadId);

  if (related) {
    return {
      mode: 'lead',
      gap: v.gap,
      tells: v.tells,
      market: v.market,
      walletLit: v.lit,
    };
  }

  return {
    mode: 'elsewhere',
    gap: v.gap,
  };
}
