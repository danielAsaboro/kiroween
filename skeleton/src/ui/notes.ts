import type { NoteEntry, NoteKind } from './types.js';

export type { NoteKind };

/**
 * Filter and sort notes for display in the notes margin.
 *
 * Rules:
 * 1. Only notes at or before the playhead (note.p <= playhead).
 * 2. Scope: note.nodeId is the framed node, an ancestor of it, or a
 *    descendant of it. Ancestry is passed in as two sets:
 *      - frameAncestorIds: ancestors of the framed node
 *      - frameDescendantIds: descendants of the framed node
 * 3. Kind filter: 'press' = has pressTime; 'ai' = no pressTime; 'all' = both.
 * 4. Sort newest-first (descending p).
 */
export function filterNotes(
  notes: NoteEntry[],
  frameId: string,
  frameAncestorIds: Set<string>,
  frameDescendantIds: Set<string>,
  playhead: number,
  kind: NoteKind,
): NoteEntry[] {
  return notes
    .filter((n) => {
      // Playhead cutoff
      if (n.p > playhead) return false;

      // Scope
      const inScope =
        n.nodeId === frameId || frameAncestorIds.has(n.nodeId) || frameDescendantIds.has(n.nodeId);
      if (!inScope) return false;

      // Kind filter
      if (kind === 'press') return n.pressTime !== undefined;
      if (kind === 'ai') return n.pressTime === undefined;
      return true;
    })
    .sort((a, b) => b.p - a.p);
}
