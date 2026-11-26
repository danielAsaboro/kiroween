import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { loadBoardData } from './load.js';
import { computeBrier } from './brier.js';
import { fuse } from './fusion.js';
import { scoreCard } from './scorecard.js';
import type { Reading } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const data = loadBoardData();
const { rows } = data.walkForward;

// ---------------------------------------------------------------------------
// REQ-2  Brier scores match board-data.json to 4 decimal places
// ---------------------------------------------------------------------------

describe('computeBrier — example tests', () => {
  it('M0 (pMarket) ≈ 0.1975', () => {
    expect(computeBrier('pMarket', rows)).toBeCloseTo(0.1975, 4);
  });

  it('M1 (m1) ≈ 0.2196', () => {
    expect(computeBrier('m1', rows)).toBeCloseTo(0.2196, 4);
  });

  it('M2W (m2w) ≈ 0.2261', () => {
    expect(computeBrier('m2w', rows)).toBeCloseTo(0.2261, 4);
  });

  it('empty rows returns 0', () => {
    expect(computeBrier('pMarket', [])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// REQ-5  Score card — fresh-wallets must be killed with ΔBrier[0] = −0.007
// ---------------------------------------------------------------------------

describe('scoreCard — example tests', () => {
  it('fresh-wallets verdict is killed', () => {
    const card = scoreCard('fresh-wallets', data);
    expect(card.verdict).toBe('killed');
  });

  it('fresh-wallets deltaBrier[0] === −0.007', () => {
    const card = scoreCard('fresh-wallets', data);
    expect(card.deltaBrier[0]).toBe(-0.007);
  });

  it('fresh-wallets hits/misses/falseAlarms from board-data', () => {
    const card = scoreCard('fresh-wallets', data);
    expect(card.hits).toBe(16);
    expect(card.misses).toBe(82);
    expect(card.falseAlarms).toBe(18);
  });

  it('tankers verdict is pending', () => {
    expect(scoreCard('tankers', data).verdict).toBe('pending');
  });

  it('pizza verdict is collecting', () => {
    expect(scoreCard('pizza', data).verdict).toBe('collecting');
  });

  it('throws for unknown tell', () => {
    expect(() => scoreCard('nonexistent', data)).toThrow('tell not found: nonexistent');
  });
});

// ---------------------------------------------------------------------------
// Helpers for property tests
// ---------------------------------------------------------------------------

/**
 * Arbitrarily generate a valid Reading.
 * We omit `weight` entirely half the time (exactOptionalPropertyTypes
 * forbids setting it to undefined explicitly).
 */
const arbReading = (overrides?: Partial<Reading>): fc.Arbitrary<Reading> =>
  fc
    .record({
      tell: fc.constantFrom('a', 'b', 'c', 'd'),
      market: fc.constant('market-1'),
      createdAt: fc.constant('2026-01-01T00:00:00Z'),
      value: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
      baseline: fc.float({ min: Math.fround(0), max: Math.fround(0.5), noNaN: true }),
      line: fc.constant(0.5),
      fired: fc.boolean(),
      method: fc.constant('test'),
      src: fc.constantFrom('https://alpha.example.com', 'https://beta.example.com'),
    })
    .chain((base) =>
      fc
        .oneof(fc.constant({}), fc.record({ weight: fc.constantFrom(1, 2) }))
        .map((w) => ({ ...base, ...w, ...overrides }) as Reading),
    );

const arbReadingArray = fc.array(arbReading(), { minLength: 1, maxLength: 8 });

// ---------------------------------------------------------------------------
// REQ-4  Property: no double-count
// Duplicating a reading (same tell id) must not change the fused output.
// ---------------------------------------------------------------------------

describe('fuse — property: no double-count by tell id', () => {
  it('fuse(arr) === fuse(arr + duplicate)', () => {
    fc.assert(
      fc.property(arbReadingArray, (arr) => {
        const first = arr[0];
        if (first === undefined) return true;
        const withDup = [...arr, { ...first }]; // exact duplicate of first entry
        return fuse(arr) === fuse(withDup);
      }),
      {
        verbose: true,
        reporter(out) {
          if (out.failed) {
            console.error(
              'fast-check shrunk counter-example (no-double-count):',
              out.counterexample,
            );
          }
        },
      },
    );
  });

  it('fuse with same tell at lower value is dominated by the higher', () => {
    fc.assert(
      fc.property(
        arbReading(),
        fc.float({ min: Math.fround(0), max: Math.fround(0.3), noNaN: true }),
        (r, delta) => {
          const higher = { ...r, value: Math.min(r.value + delta, 1) };
          const lower = { ...r, value: Math.max(r.value - delta, 0) };
          const withBoth = [higher, lower];
          const justHigher = [higher];
          return fuse(withBoth) === fuse(justHigher);
        },
      ),
      {
        verbose: true,
        reporter(out) {
          if (out.failed) {
            console.error('fast-check shrunk counter-example (dominance):', out.counterexample);
          }
        },
      },
    );
  });
});

// ---------------------------------------------------------------------------
// REQ-4  Property: monotonic
// Raising any reading's value must never lower fuse()'s output.
// ---------------------------------------------------------------------------

describe('fuse — property: monotonic', () => {
  it('increasing any reading value never decreases fuse()', () => {
    fc.assert(
      fc.property(
        arbReadingArray,
        fc.integer({ min: 0, max: 7 }),
        fc.float({ min: Math.fround(0), max: Math.fround(0.5), noNaN: true }),
        (arr, idx, delta) => {
          const i = idx % arr.length;
          const before = fuse(arr);

          const raised = arr.map((r, j) => {
            if (j !== i) return r;
            return { ...r, value: Math.min(r.value + delta, 1) };
          });
          const after = fuse(raised);

          return after >= before - 1e-12; // allow floating-point epsilon
        },
      ),
      {
        numRuns: 1000,
        verbose: true,
        reporter(out) {
          if (out.failed) {
            console.error('fast-check shrunk counter-example (monotonic):', out.counterexample);
          }
        },
      },
    );
  });
});

// ---------------------------------------------------------------------------
// fuse — basic edge cases
// ---------------------------------------------------------------------------

describe('fuse — edge cases', () => {
  it('empty array returns 0', () => {
    expect(fuse([])).toBe(0);
  });

  it('single fired reading returns its value', () => {
    const r: Reading = {
      tell: 'x',
      market: 'm',
      createdAt: '',
      value: 0.7,
      baseline: 0.1,
      line: 0.5,
      fired: true,
      method: '',
      src: 'https://x.example.com',
    };
    expect(fuse([r])).toBe(0.7);
  });

  it('single unfired reading returns its baseline', () => {
    const r: Reading = {
      tell: 'x',
      market: 'm',
      createdAt: '',
      value: 0.3,
      baseline: 0.1,
      line: 0.5,
      fired: false,
      method: '',
      src: 'https://x.example.com',
    };
    expect(fuse([r])).toBe(0.1);
  });
});
