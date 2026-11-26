import type { CellNode, RenderOptions, Tier } from './types.js';

/**
 * Build a single board cell for `node` at `tier` and append it to `container`.
 *
 * Rules:
 * - All DOM built with createElement + textContent; no innerHTML.
 * - Numbers must arrive pre-populated in `node.slots`; this function
 *   never calls loadBoardData.
 * - Returns the appended HTMLElement.
 */
export function renderCell(
  node: CellNode,
  tier: Tier,
  container: Element,
  opts?: RenderOptions,
): HTMLElement {
  // opts is reserved for future use (animation flags, device-pixel-ratio, etc.)
  void opts;

  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset['tier'] = tier;
  cell.dataset['kind'] = node.kind;
  cell.setAttribute('aria-label', node.name);

  // Modifier classes — always set regardless of tier
  if (node.slots.lit) cell.classList.add('cell--lit');
  if (node.weight === 0 && !node.focused) cell.classList.add('cell--dim');
  if (node.focused) cell.classList.add('cell--focused');

  if (tier === 'tile') {
    container.appendChild(cell);
    return cell;
  }

  if (tier === 'dot') {
    const dot = document.createElement('span');
    dot.className = 'cell-dot';
    cell.appendChild(dot);
    container.appendChild(cell);
    return cell;
  }

  // tier is now narrowed to 'full' | 'card' | 'chip'
  const hd = document.createElement('div');
  hd.className = 'cell-hd';

  // Headline — omitted for page kind (front page has no header of its own)
  if (node.kind !== 'page') {
    const title = document.createElement('div');
    title.className = 'cell-title';
    title.textContent = node.name;
    hd.appendChild(title);
  }

  if (tier === 'chip') {
    // Chip: name + primary state value side-by-side
    const chipr = document.createElement('div');
    chipr.className = 'cell-chip-row';
    const nm = document.createElement('span');
    nm.className = 'cell-chip-name';
    nm.textContent = node.name;
    chipr.appendChild(nm);
    const cv = document.createElement('span');
    cv.className = 'cell-chip-value';
    cv.textContent = node.slots.valueC;
    chipr.appendChild(cv);
    hd.appendChild(chipr);
    cell.appendChild(hd);
    container.appendChild(cell);
    return cell;
  }

  // tier is now narrowed to 'full' | 'card'
  // Three slots
  const slotsEl = document.createElement('div');
  slotsEl.className = 'cell-slots';

  interface SlotDef {
    label: string;
    value: string;
    deltaDir: 1 | 0 | -1 | undefined;
    deltaText: string | undefined;
    lit: boolean;
  }

  const slotDefs: SlotDef[] = [
    {
      label: node.slots.labelA,
      value: node.slots.valueA,
      deltaDir: node.slots.deltaA?.direction,
      deltaText: node.slots.deltaA?.display,
      lit: false,
    },
    {
      label: node.slots.labelB,
      value: node.slots.valueB,
      deltaDir: node.slots.deltaB?.direction,
      deltaText: node.slots.deltaB?.display,
      lit: false,
    },
    {
      label: node.slots.labelC,
      value: node.slots.valueC,
      deltaDir: undefined,
      deltaText: undefined,
      lit: node.slots.lit,
    },
  ];

  for (const s of slotDefs) {
    const slot = document.createElement('span');
    slot.className = 'cell-slot';
    if (s.lit) slot.classList.add('cell-slot--lit');

    const lbl = document.createElement('span');
    lbl.className = 'cell-slot-label';
    lbl.textContent = s.label;
    slot.appendChild(lbl);

    const val = document.createElement('span');
    val.className = 'cell-slot-value';
    val.textContent = s.value;
    slot.appendChild(val);

    if (s.deltaDir !== undefined && s.deltaDir !== 0 && s.deltaText !== undefined) {
      const dl = document.createElement('span');
      dl.className = 'cell-slot-delta' + (s.deltaDir > 0 ? ' cell-slot-delta--up' : '');
      dl.textContent = s.deltaText;
      slot.appendChild(dl);
    }

    slotsEl.appendChild(slot);
  }
  hd.appendChild(slotsEl);

  // Dot strip — canvas placeholder; actual drawing done by the caller
  const strip = document.createElement('div');
  strip.className = 'cell-strip';
  const canvas = document.createElement('canvas');
  strip.appendChild(canvas);
  hd.appendChild(strip);

  // Record line — Full tier only
  if (tier === 'full') {
    const rec = document.createElement('p');
    rec.className = 'cell-record';
    rec.textContent = node.recordLine;
    hd.appendChild(rec);
  }

  cell.appendChild(hd);
  container.appendChild(cell);
  return cell;
}
