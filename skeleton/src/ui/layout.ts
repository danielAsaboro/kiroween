import * as d3h from 'd3-hierarchy';
import type { BoardNode, LayoutRect, NodeKind } from './types.js';

/** World canvas dimensions (fixed; never change). */
export const WORLD_W = 1600;
export const WORLD_H = 1000;

/** Squarify ratio matching the HTML reference. */
const SQUARIFY_RATIO = 1.25;

/** paddingTop factor by kind. */
function paddingTopFactor(kind: NodeKind): number {
  if (kind === 'question') return 0.44;
  if (kind === 'source') return 0.42;
  if (kind === 'node') return 0.36;
  return 0; // page gets no top strip
}

type D3Node = d3h.HierarchyRectangularNode<BoardNode>;

function toLayoutRect(node: D3Node): LayoutRect {
  const h = node.y1 - node.y0;
  const paddingTop = node.depth === 0 ? 0 : h * paddingTopFactor(node.data.kind);

  return {
    id: node.data.id,
    kind: node.data.kind,
    x0: node.x0,
    y0: node.y0,
    x1: node.x1,
    y1: node.y1,
    paddingTop,
    depth: node.depth,
    children: (node.children ?? []).map(toLayoutRect),
  };
}

/**
 * Lay out the topic tree as nested rectangles.
 *
 * Pure and deterministic: same input → same output every call.
 * No DOM reads; safe to call outside the browser.
 *
 * Interest values (`v`) must be pre-computed by the caller:
 *   v = (questionFactor × sourceFactor) / siblingCount
 *   where questionFactor = graded ? 1.25 : 0.9
 *         sourceFactor   = graded ? 1.2 : (aiConnection ? 0.9 : 0.7)
 */
export function layoutTree(root: BoardNode): LayoutRect {
  const hier = d3h.hierarchy<BoardNode>(root, (d) => d.children ?? []);

  // Sum leaf values and sort descending (matches reference behaviour).
  hier.sum((d) => d.v ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const layout = d3h
    .treemap<BoardNode>()
    .size([WORLD_W, WORLD_H])
    .tile(d3h.treemapSquarify.ratio(SQUARIFY_RATIO))
    .paddingInner((d) => {
      const dn = d as D3Node;
      return Math.min(dn.x1 - dn.x0, dn.y1 - dn.y0) * 0.025;
    })
    .paddingOuter((d) => {
      const dn = d as D3Node;
      return Math.min(dn.x1 - dn.x0, dn.y1 - dn.y0) * 0.025;
    })
    .paddingTop((d) => {
      const dn = d as D3Node;
      if (dn.depth === 0) return Math.min(dn.x1 - dn.x0, dn.y1 - dn.y0) * 0.025;
      return (dn.y1 - dn.y0) * paddingTopFactor(dn.data.kind);
    });

  const laid = layout(hier) as D3Node;
  return toLayoutRect(laid);
}

/**
 * Compute the interest value for a leaf node.
 * graded = tell has a real Brier score from >= 5 settled markets.
 */
export function nodeInterest(opts: {
  questionGraded: boolean;
  sourceGraded: boolean;
  sourceIsAiConnection: boolean;
  siblingCount: number;
}): number {
  const qf = opts.questionGraded ? 1.25 : 0.9;
  const sf = opts.sourceGraded ? 1.2 : opts.sourceIsAiConnection ? 0.9 : 0.7;
  return (qf * sf) / Math.max(1, opts.siblingCount);
}
