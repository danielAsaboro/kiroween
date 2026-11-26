import { interpolateZoom } from 'd3-interpolate';
import type { CameraView, LayoutRect } from './types.js';

/** Minimum and maximum animation duration in ms. */
const DUR_MIN = 300;
const DUR_MAX = 750;
/** Factor applied to d3's raw zoom duration. */
const DUR_FACTOR = 0.55;

/**
 * Compute the camera view that frames `rect` to fill the board.
 *
 * The view centre is the rect's midpoint; `width` is 1.02× the rect width
 * (small margin); `aspect` is the rect's height/width ratio.
 */
export function frameOf(rect: LayoutRect): CameraView {
  const w = rect.x1 - rect.x0;
  const h = rect.y1 - rect.y0;
  return {
    cx: (rect.x0 + rect.x1) / 2,
    cy: (rect.y0 + rect.y1) / 2,
    width: w * 1.02,
    aspect: h / w,
  };
}

/**
 * Encode a CameraView as the [cx, cy, width] triple that interpolateZoom
 * expects.
 */
function toTriple(v: CameraView): [number, number, number] {
  return [v.cx, v.cy, v.width];
}

/**
 * Given current view `a`, target view `b`, and eased t ∈ [0, 1],
 * return the interpolated view.
 *
 * Uses d3-interpolate's interpolateZoom, which implements the
 * Jarke van Wijk & Wim Nuij smooth zoom with rho=sqrt(2).
 */
export function interpolateCamera(a: CameraView, b: CameraView, t: number): CameraView {
  const interp = interpolateZoom(toTriple(a), toTriple(b));
  const [cx, cy, width] = interp(t);
  // Interpolate aspect log-linearly
  const aspect = Math.exp(Math.log(a.aspect) + (Math.log(b.aspect) - Math.log(a.aspect)) * t);
  return { cx, cy, width, aspect };
}

/**
 * Compute the animation duration in ms.
 *
 * Returns 0 when reducedMotion is true (jump immediately).
 * Otherwise clamps d3's raw duration × factor to [300, 750] ms.
 */
export function animDuration(zoomInterp: { duration: number }, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.max(DUR_MIN, Math.min(DUR_MAX, zoomInterp.duration * DUR_FACTOR));
}

/**
 * Build an interpolateZoom interpolator between two camera views, ready for
 * use in an animation loop.
 */
export function buildZoomInterp(
  a: CameraView,
  b: CameraView,
): ReturnType<typeof interpolateZoom> & { duration: number } {
  return interpolateZoom(toTriple(a), toTriple(b));
}
