/** Index of the last real hour in the replay (0-based). */
export const LASTH = 199;

/** Index of the settled terminal position (one past the last hour). */
export const SETTLED = LASTH + 1; // 200

/**
 * Base interval in ms per hour at 1× speed.
 * Chosen so the whole range (0–SETTLED) plays in about 24 s.
 *   24000 ms / 200 steps ≈ 120 ms per step
 */
export const STEP_MS = 24000 / SETTLED; // ≈ 120 ms

export type ReplaySpeed = 1 | 5 | 20;

/** setInterval period in ms for the given playback speed. */
export function tickInterval(speed: ReplaySpeed): number {
  return STEP_MS / speed;
}

/** Clamp a playhead value to the valid range [0, SETTLED]. */
export function clampP(p: number): number {
  return Math.max(0, Math.min(SETTLED, p));
}
