import type { Tier } from './types.js';

/** Tiers ordered richest-first. */
export const TIERS: readonly Tier[] = ['full', 'card', 'chip', 'dot', 'tile'] as const;

/** Minimum screen rectangle required before a tier is attempted. */
export const TIER_MIN: Record<Tier, { w: number; h: number }> = {
  full: { w: 300, h: 185 },
  card: { w: 150, h: 70 },
  chip: { w: 64, h: 22 },
  dot: { w: 14, h: 14 },
  tile: { w: 0, h: 0 },
};

/**
 * Tiers that require a text-fit check.
 * 'dot' and 'tile' are purely dimension-driven — no text content to measure.
 */
const TEXT_TIERS = new Set<Tier>(['full', 'card', 'chip']);

/** Index of a tier in the richness order (0 = richest, 4 = tile). */
export function tierRank(tier: Tier): number {
  const idx = TIERS.indexOf(tier);
  return idx === -1 ? TIERS.length : idx;
}

/**
 * A pure predicate that returns true when a tier's text content fits whole
 * in the available rectangle. Called only for 'full', 'card', and 'chip'.
 * Must be side-effect-free and deterministic.
 */
export type FitsPredicate = (tier: Tier) => boolean;

/**
 * Choose the richest tier whose minimum dimensions are satisfied and,
 * for text tiers (full/card/chip), whose content fits as reported by `fits`.
 * Dot and tile are purely dimension-driven.
 *
 * Returns 'tile' as the ultimate fallback (dimensions 0×0 always pass).
 *
 * Monotonicity guarantee: for fixed `screenH` and `fits`, increasing
 * `screenW` can only satisfy more `w >= min.w` guards, never fewer.
 * Therefore the returned tier rank is non-increasing (richer or equal)
 * as `screenW` grows. The same holds symmetrically for `screenH`.
 */
export function tierOf(screenW: number, screenH: number, fits: FitsPredicate): Tier {
  for (const tier of TIERS) {
    const min = TIER_MIN[tier];
    if (screenW >= min.w && screenH >= min.h) {
      // For dot and tile, dimensions alone are sufficient.
      if (!TEXT_TIERS.has(tier)) return tier;
      // For text tiers, also require the content to fit.
      if (fits(tier)) return tier;
    }
  }
  return 'tile';
}
