import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { layoutTree, nodeInterest, WORLD_W, WORLD_H } from './layout.js';
import { frameOf, animDuration, interpolateCamera, buildZoomInterp } from './camera.js';
import { indexRows, indexState } from './index-state.js';
import { islandState } from './island.js';
import { filterNotes } from './notes.js';
import { LASTH, SETTLED, STEP_MS, tickInterval, clampP } from './replay.js';
import { easeCubicOut } from './ease.js';
import type { BoardNode, CameraView, LayoutRect, NoteEntry } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTree(): BoardNode {
  return {
    id: 'all',
    kind: 'page',
    name: 'Front page',
    v: 0,
    children: [
      {
        id: 'geo',
        kind: 'section',
        name: 'Geopolitics',
        v: 0,
        children: [
          {
            id: 'iran',
            kind: 'question',
            name: 'US strikes Iran',
            v: 0,
            children: [
              {
                id: 'iran.wallets',
                kind: 'source',
                name: 'Fresh wallets',
                v: 0,
                children: [{ id: 'iran.wallets.poly', kind: 'node', name: 'Polymarket', v: 0.3 }],
              },
              {
                id: 'iran.tankers',
                kind: 'source',
                name: 'Tankers',
                v: 0,
                children: [{ id: 'iran.tankers.adsb', kind: 'node', name: 'adsb.lol', v: 0.2 }],
              },
            ],
          },
        ],
      },
      {
        id: 'lay',
        kind: 'section',
        name: 'Layoffs',
        v: 0,
        children: [
          {
            id: 'msft',
            kind: 'question',
            name: 'Microsoft',
            v: 0,
            children: [
              {
                id: 'msft.warn',
                kind: 'source',
                name: 'WARN',
                v: 0,
                children: [{ id: 'msft.warn.wa', kind: 'node', name: 'WA ESD', v: 0.15 }],
              },
            ],
          },
        ],
      },
    ],
  };
}

// Pre-compute interest values for all nodes before layoutTree
function withInterest(tree: BoardNode): BoardNode {
  function walk(node: BoardNode, parentChildren: BoardNode[]): BoardNode {
    const siblingCount = parentChildren.length;
    if (node.kind === 'node') {
      const v = nodeInterest({
        questionGraded: false,
        sourceGraded: false,
        sourceIsAiConnection: false,
        siblingCount: Math.max(1, siblingCount),
      });
      return { ...node, v };
    }
    const children = (node.children ?? []).map((c) => walk(c, node.children ?? []));
    return { ...node, children };
  }
  return walk(tree, [tree]);
}

// ---------------------------------------------------------------------------
// layout.ts — property: deterministic
// ---------------------------------------------------------------------------

describe('layoutTree — property: deterministic', () => {
  it('two calls with the same input produce identical rectangles', () => {
    const tree = withInterest(makeTree());
    const r1 = layoutTree(tree);
    const r2 = layoutTree(tree);
    expect(r1.x0).toBe(r2.x0);
    expect(r1.x1).toBe(r2.x1);
    expect(r1.y0).toBe(r2.y0);
    expect(r1.y1).toBe(r2.y1);
    expect(r1.children.length).toBe(r2.children.length);
    // Spot-check first child
    if (r1.children.length > 0) {
      const c1 = r1.children[0];
      const c2 = r2.children[0];
      if (c1 !== undefined && c2 !== undefined) {
        expect(c1.x0).toBeCloseTo(c2.x0, 10);
        expect(c1.y0).toBeCloseTo(c2.y0, 10);
      }
    }
  });

  it('fast-check: deterministic over randomly-sized interest values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(2), noNaN: true }), {
          minLength: 3,
          maxLength: 6,
        }),
        (vals) => {
          // Build a minimal 2-level tree with the given leaf values
          const tree: BoardNode = {
            id: 'root',
            kind: 'page',
            name: 'R',
            v: 0,
            children: vals.map((v, i) => ({
              id: `n${i.toString()}`,
              kind: 'node',
              name: `N${i.toString()}`,
              v,
            })),
          };
          const r1 = layoutTree(tree);
          const r2 = layoutTree(tree);
          return Math.abs(r1.x1 - r2.x1) < 1e-9 && r1.children.length === r2.children.length;
        },
      ),
      {
        numRuns: 200,
        reporter(out) {
          if (out.failed) console.error('layout determinism counter-example:', out.counterexample);
        },
      },
    );
  });
});

// ---------------------------------------------------------------------------
// layout.ts — property: children nest strictly inside parent body
// ---------------------------------------------------------------------------

describe('layoutTree — property: children nest inside parent body', () => {
  it('every child rect fits inside its parent body (below paddingTop)', () => {
    const tree = withInterest(makeTree());
    const root = layoutTree(tree);

    function check(node: LayoutRect): void {
      const bodyY0 = node.y0 + node.paddingTop;
      for (const child of node.children) {
        // Child must start at or after parent body start
        expect(child.y0).toBeGreaterThanOrEqual(bodyY0 - 1e-9);
        // Child must stay within parent bounds
        expect(child.x0).toBeGreaterThanOrEqual(node.x0 - 1e-9);
        expect(child.x1).toBeLessThanOrEqual(node.x1 + 1e-9);
        expect(child.y1).toBeLessThanOrEqual(node.y1 + 1e-9);
        check(child);
      }
    }
    check(root);
  });

  it('fast-check: nesting holds for random leaf values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(2), noNaN: true }), {
          minLength: 2,
          maxLength: 8,
        }),
        (vals) => {
          const tree: BoardNode = {
            id: 'root',
            kind: 'page',
            name: 'R',
            v: 0,
            children: vals.map((v, i) => ({
              id: `n${i.toString()}`,
              kind: 'node',
              name: `N${i.toString()}`,
              v,
            })),
          };
          const root = layoutTree(tree);
          for (const child of root.children) {
            if (child.x0 < root.x0 - 1e-9) return false;
            if (child.x1 > root.x1 + 1e-9) return false;
            if (child.y0 < root.y0 + root.paddingTop - 1e-9) return false;
            if (child.y1 > root.y1 + 1e-9) return false;
          }
          return true;
        },
      ),
      {
        numRuns: 500,
        reporter(out) {
          if (out.failed) console.error('nesting counter-example:', out.counterexample);
        },
      },
    );
  });

  it('root covers the full world canvas', () => {
    const tree = withInterest(makeTree());
    const root = layoutTree(tree);
    expect(root.x0).toBe(0);
    expect(root.y0).toBe(0);
    expect(root.x1).toBeCloseTo(WORLD_W, 5);
    expect(root.y1).toBeCloseTo(WORLD_H, 5);
  });
});

// ---------------------------------------------------------------------------
// nodeInterest
// ---------------------------------------------------------------------------

describe('nodeInterest', () => {
  it('graded question + graded source = 1.25 × 1.2 / siblings', () => {
    expect(
      nodeInterest({
        questionGraded: true,
        sourceGraded: true,
        sourceIsAiConnection: false,
        siblingCount: 1,
      }),
    ).toBeCloseTo(1.25 * 1.2, 10);
  });
  it('ungraded × ungraded × 2 siblings', () => {
    expect(
      nodeInterest({
        questionGraded: false,
        sourceGraded: false,
        sourceIsAiConnection: false,
        siblingCount: 2,
      }),
    ).toBeCloseTo((0.9 * 0.7) / 2, 10);
  });
  it('AI connection source = 0.9 factor', () => {
    expect(
      nodeInterest({
        questionGraded: false,
        sourceGraded: false,
        sourceIsAiConnection: true,
        siblingCount: 1,
      }),
    ).toBeCloseTo(0.9 * 0.9, 10);
  });
});

// ---------------------------------------------------------------------------
// camera.ts
// ---------------------------------------------------------------------------

describe('frameOf', () => {
  const rect: LayoutRect = {
    id: 'r',
    kind: 'question',
    x0: 100,
    y0: 200,
    x1: 500,
    y1: 600,
    paddingTop: 40,
    depth: 1,
    children: [],
  };

  it('centre matches rect midpoint', () => {
    const v = frameOf(rect);
    expect(v.cx).toBeCloseTo(300, 10);
    expect(v.cy).toBeCloseTo(400, 10);
  });

  it('width is 1.02× rect width', () => {
    const v = frameOf(rect);
    expect(v.width).toBeCloseTo(400 * 1.02, 10);
  });

  it('aspect is height/width', () => {
    const v = frameOf(rect);
    expect(v.aspect).toBeCloseTo(400 / 400, 10);
  });
});

describe('animDuration', () => {
  it('returns 0 for reduced-motion', () => {
    expect(animDuration({ duration: 500 }, true)).toBe(0);
  });

  it('clamps low values to 300', () => {
    expect(animDuration({ duration: 10 }, false)).toBe(300);
  });

  it('clamps high values to 750', () => {
    expect(animDuration({ duration: 100000 }, false)).toBe(750);
  });

  it('applies 0.55 factor within range', () => {
    // 800 × 0.55 = 440 → within 300–750
    expect(animDuration({ duration: 800 }, false)).toBeCloseTo(440, 1);
  });
});

describe('interpolateCamera', () => {
  it('t=0 returns a', () => {
    const a: CameraView = { cx: 0, cy: 0, width: 100, aspect: 1 };
    const b: CameraView = { cx: 200, cy: 200, width: 400, aspect: 2 };
    const r = interpolateCamera(a, b, 0);
    expect(r.cx).toBeCloseTo(a.cx, 5);
    expect(r.cy).toBeCloseTo(a.cy, 5);
  });

  it('t=1 returns b', () => {
    const a: CameraView = { cx: 0, cy: 0, width: 100, aspect: 1 };
    const b: CameraView = { cx: 200, cy: 200, width: 400, aspect: 2 };
    const r = interpolateCamera(a, b, 1);
    expect(r.cx).toBeCloseTo(b.cx, 5);
    expect(r.cy).toBeCloseTo(b.cy, 5);
  });
});

describe('buildZoomInterp', () => {
  it('has a numeric duration property', () => {
    const a: CameraView = { cx: 100, cy: 100, width: 200, aspect: 1 };
    const b: CameraView = { cx: 800, cy: 500, width: 1000, aspect: 0.5 };
    const interp = buildZoomInterp(a, b);
    expect(typeof interp.duration).toBe('number');
    expect(interp.duration).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// index-state.ts
// ---------------------------------------------------------------------------

describe('indexRows', () => {
  it('returns sections and questions in tree order', () => {
    const tree = makeTree();
    const rows = indexRows(tree);
    const kinds = rows.map((r) => r.kind);
    // Should have sections and questions, no pages or nodes
    expect(kinds.every((k) => k === 'section' || k === 'question')).toBe(true);
    // geo section comes before iran question
    const geoIdx = rows.findIndex((r) => r.id === 'geo');
    const iranIdx = rows.findIndex((r) => r.id === 'iran');
    expect(geoIdx).toBeLessThan(iranIdx);
  });
});

describe('indexState', () => {
  it('marks the framed row as cur', () => {
    const tree = makeTree();
    const rows = indexRows(tree);
    const ancestorIds = new Set(['geo', 'all']);
    const state = indexState(
      rows,
      'iran',
      ancestorIds,
      () => '+2',
      () => false,
    );
    const iranRow = state.find((r) => r.id === 'iran');
    expect(iranRow?.cur).toBe(true);
  });

  it('marks ancestor rows as path', () => {
    const tree = makeTree();
    const rows = indexRows(tree);
    const ancestorIds = new Set(['geo']);
    const state = indexState(
      rows,
      'iran',
      ancestorIds,
      () => null,
      () => false,
    );
    const geoRow = state.find((r) => r.id === 'geo');
    expect(geoRow?.path).toBe(true);
  });

  it('provides gap for question rows', () => {
    const tree = makeTree();
    const rows = indexRows(tree);
    const state = indexState(
      rows,
      'iran',
      new Set(),
      (id) => (id === 'iran' ? '+5' : null),
      () => false,
    );
    const iranRow = state.find((r) => r.id === 'iran');
    expect(iranRow?.gap).toBe('+5');
  });
});

// ---------------------------------------------------------------------------
// island.ts
// ---------------------------------------------------------------------------

const noVal = () => ({ gap: '+2', tells: '27%', market: '25¢', lit: false });

describe('islandState', () => {
  it('returns settled when playhead >= SETTLED', () => {
    const s = islandState('iran', 'iran', new Set(), new Set(), SETTLED, SETTLED, noVal);
    expect(s.mode).toBe('settled');
  });

  it('returns lead when frame is the lead', () => {
    const s = islandState('iran', 'iran', new Set(), new Set(), 50, SETTLED, noVal);
    expect(s.mode).toBe('lead');
    expect(s.gap).toBe('+2');
  });

  it('returns elsewhere when frame is outside lead branch', () => {
    const s = islandState(
      'msft',
      'iran',
      new Set(['geo', 'all']),
      new Set(['lay', 'all']),
      50,
      SETTLED,
      noVal,
    );
    expect(s.mode).toBe('elsewhere');
  });

  it('returns lead when frame is a descendant of lead (lead is ancestor of frame)', () => {
    // iran is ancestor of iran.wallets
    const leadAncestors = new Set<string>(); // lead=iran has no ancestors in question
    const frameAncestors = new Set(['iran', 'geo', 'all']); // frame=iran.wallets
    const s = islandState(
      'iran.wallets',
      'iran',
      leadAncestors,
      frameAncestors,
      50,
      SETTLED,
      noVal,
    );
    expect(s.mode).toBe('lead');
  });
});

// ---------------------------------------------------------------------------
// notes.ts
// ---------------------------------------------------------------------------

const NOTES: NoteEntry[] = [
  { p: 0, nodeId: 'msft', text: 'Note at start' },
  { p: 50, nodeId: 'iran.tankers', text: 'Press note', pressTime: 'Feb 20 20:45 UTC' },
  { p: 100, nodeId: 'iran', text: 'AI note' },
  { p: 150, nodeId: 'geo', text: 'Ancestor note' },
  { p: 180, nodeId: 'iran', text: 'Future note — should be excluded at p=160' },
];

describe('filterNotes', () => {
  it('excludes notes after playhead', () => {
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.wallets', 'iran.tankers']),
      160,
      'all',
    );
    expect(result.some((n) => n.p === 180)).toBe(false);
  });

  it('includes notes at or before playhead', () => {
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.wallets', 'iran.tankers']),
      160,
      'all',
    );
    expect(result.some((n) => n.p === 100)).toBe(true);
  });

  it('excludes out-of-scope notes', () => {
    // msft note is not in scope when framing iran
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.wallets', 'iran.tankers']),
      200,
      'all',
    );
    expect(result.some((n) => n.nodeId === 'msft')).toBe(false);
  });

  it('includes ancestor notes', () => {
    // geo is an ancestor of iran, so its notes are in scope
    const result = filterNotes(NOTES, 'iran', new Set(['geo', 'all']), new Set(), 200, 'all');
    expect(result.some((n) => n.nodeId === 'geo')).toBe(true);
  });

  it('filters by press kind', () => {
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.tankers']),
      200,
      'press',
    );
    expect(result.every((n) => n.pressTime !== undefined)).toBe(true);
  });

  it('filters by ai kind', () => {
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.tankers']),
      200,
      'ai',
    );
    expect(result.every((n) => n.pressTime === undefined)).toBe(true);
  });

  it('sorts newest first', () => {
    const result = filterNotes(
      NOTES,
      'iran',
      new Set(['geo', 'all']),
      new Set(['iran.tankers']),
      200,
      'all',
    );
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      if (prev !== undefined && curr !== undefined) {
        expect(prev.p).toBeGreaterThanOrEqual(curr.p);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// replay.ts
// ---------------------------------------------------------------------------

describe('replay constants and helpers', () => {
  it('LASTH is 199', () => {
    expect(LASTH).toBe(199);
  });
  it('SETTLED is LASTH + 1 = 200', () => {
    expect(SETTLED).toBe(200);
  });
  it('STEP_MS is 24000 / 200 = 120', () => {
    expect(STEP_MS).toBeCloseTo(120, 10);
  });
  it('tickInterval(1) ≈ 120 ms', () => {
    expect(tickInterval(1)).toBeCloseTo(120, 5);
  });
  it('tickInterval(5) ≈ 24 ms', () => {
    expect(tickInterval(5)).toBeCloseTo(24, 5);
  });
  it('tickInterval(20) ≈ 6 ms', () => {
    expect(tickInterval(20)).toBeCloseTo(6, 5);
  });
  it('clampP clamps to [0, SETTLED]', () => {
    expect(clampP(-1)).toBe(0);
    expect(clampP(201)).toBe(SETTLED);
    expect(clampP(100)).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// ease.ts
// ---------------------------------------------------------------------------

describe('easeCubicOut', () => {
  it('f(0) = 0', () => {
    expect(easeCubicOut(0)).toBeCloseTo(0, 10);
  });
  it('f(1) = 1', () => {
    expect(easeCubicOut(1)).toBeCloseTo(1, 10);
  });
  it('f(0.5) > 0.5 (ease-out accelerates early)', () => {
    expect(easeCubicOut(0.5)).toBeGreaterThan(0.5);
  });
});
