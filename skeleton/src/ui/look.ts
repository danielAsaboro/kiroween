/**
 * Design-system CSS tokens for the Omens board.
 *
 * These are exported as a string so they can be injected into a <style> tag
 * by the app assembler without a CSS bundler.
 *
 * Rules:
 * - system-ui (Apple system face), tabular figures
 * - Graphite surfaces: rail, page, card, raised
 * - One amber accent #FFB23E
 * - Off-white market line #ededed
 * - Spacing scale 4 / 8 / 12 / 16 / 24 / 32
 * - Easing cubic-bezier(.22, 1, .36, 1)
 * - No glows
 */
export const LOOK = `
:root {
  --rail: #0b0b0c;
  --page: #111113;
  --card: #18181b;
  --raised: #212125;
  --hover: #2a2a2f;
  --fg: #f2f2f4;
  --fg2: #a8a8b0;
  --fg3: #7c7c85;
  --amber: #FFB23E;
  --amber2: #FF9A1F;
  --amber-dim: rgba(255, 178, 62, 0.24);
  --amber-wash: rgba(255, 178, 62, 0.08);
  --hair: rgba(255, 255, 255, 0.07);
  --hair2: rgba(255, 255, 255, 0.13);
  --market-line: #ededed;
  --sheen: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,0) 96px);
  --sans: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
          "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --ease: cubic-bezier(.22, 1, .36, 1);
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-6: 24px;
  --sp-8: 32px;
  color-scheme: dark;
}
*, *::before, *::after { box-sizing: border-box }
html, body { height: 100%; margin: 0 }
body {
  background: var(--rail);
  color: var(--fg);
  font: 14px/1.5 var(--sans);
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -.005em;
}
:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px }
button { font: inherit; color: inherit }
`.trim();

/** Colour tokens as a plain object for use in JS (canvas drawing, etc.). */
export const COLORS = {
  amber: '#FFB23E',
  amber2: '#FF9A1F',
  amberDim: 'rgba(255,178,62,.14)',
  amberFill: 'rgba(255,178,62,.22)',
  empty: 'rgba(255,255,255,.055)',
  neutral: '#6e6e74',
  marketLine: '#ededed',
  fg: '#f2f2f4',
  fg2: '#a8a8b0',
  fg3: '#7c7c85',
  page: '#111113',
  card: '#18181b',
  raised: '#212125',
  hair: 'rgba(255,255,255,.07)',
} as const;
