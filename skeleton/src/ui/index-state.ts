import type { BoardNode, IndexRow } from './types.js';

/** Collect the ordered index rows (sections + questions) from the tree. */
export function indexRows(
  root: BoardNode,
): Array<{ id: string; kind: 'section' | 'question'; name: string }> {
  const rows: Array<{ id: string; kind: 'section' | 'question'; name: string }> = [];
  function walk(node: BoardNode): void {
    if (node.kind === 'section' || node.kind === 'question') {
      rows.push({ id: node.id, kind: node.kind, name: node.name });
    }
    for (const child of node.children ?? []) {
      walk(child);
    }
  }
  // The root (page) itself doesn't go in the index; walk its children
  for (const child of root.children ?? []) {
    walk(child);
  }
  return rows;
}

/**
 * Compute display state for each index row given the current framed node.
 *
 * @param rows        The ordered index rows.
 * @param frameId     The id of the currently framed node.
 * @param ancestorIds Set of ancestor ids of the framed node (not including root).
 * @param gapOf       Returns the gap/state string for a question id.
 * @param litOf       Returns true when a question is lit (gap ≥ threshold).
 */
export function indexState(
  rows: ReturnType<typeof indexRows>,
  frameId: string,
  ancestorIds: Set<string>,
  gapOf: (id: string) => string | null,
  litOf: (id: string) => boolean,
): IndexRow[] {
  return rows.map((row) => {
    const isCur = row.id === frameId;
    const isPath = !isCur && ancestorIds.has(row.id);
    // inFrame: the framed node is a descendant of this row
    // We detect this by checking if this row is an ancestor of the frame
    const isInFrame = !isCur && ancestorIds.has(row.id);

    return {
      id: row.id,
      kind: row.kind,
      name: row.name,
      gap: row.kind === 'question' ? gapOf(row.id) : null,
      lit: row.kind === 'question' ? litOf(row.id) : false,
      cur: isCur,
      path: isPath,
      inFrame: isInFrame,
    };
  });
}
