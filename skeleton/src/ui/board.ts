/**
 * BoardUI — DOM orchestration for the Omens board.
 *
 * Wires together: layout, camera, index, island, notes, replay.
 * Uses skeleton/src/board for cell rendering.
 * All numbers come from the caller (via BoardOptions) rather than
 * calling loadBoardData directly — the assembler is responsible for
 * hydrating those.
 */
import { easeCubicOut } from './ease.js';
import { buildZoomInterp, animDuration, frameOf, interpolateCamera } from './camera.js';
import { indexRows, indexState } from './index-state.js';
import { islandState } from './island.js';
import { filterNotes } from './notes.js';
import { SETTLED, LASTH, tickInterval } from './replay.js';
import type {
  BoardNode,
  CameraView,
  IslandState,
  LayoutRect,
  NoteEntry,
  NoteKind,
} from './types.js';
import type { ReplaySpeed } from './replay.js';

export interface BoardOptions {
  /** The root of the topic tree with pre-computed `v` values. */
  tree: BoardNode;
  /** Pre-computed world-space layout (from layoutTree). */
  layout: LayoutRect;
  /** All notes. */
  notes: NoteEntry[];
  /** The id of the lead question (Island pill). */
  leadId: string;
  /**
   * Returns slot display values for a node id at a given playhead position.
   * The board calls this during render; the caller wires up board data.
   */
  valOf: (
    id: string,
    playhead: number,
  ) => { gap: string; tells: string; market: string; lit: boolean };
  /** Viewport element (the .board div). */
  viewport: HTMLElement;
  /** Left index element. */
  indexEl: HTMLElement;
  /** Breadcrumb nav element. */
  crumbsEl: HTMLElement;
  /** Island pill element. */
  islandEl: HTMLElement;
  /** Notes list element. */
  notesEl: HTMLElement;
  /** Out button (hidden at root). */
  outBtn: HTMLElement;
}

/** Build the ancestor id set for a given layout rect (root-down, excluding self). */
function ancestorsOf(rect: LayoutRect, root: LayoutRect): Set<string> {
  const result = new Set<string>();
  function walk(node: LayoutRect, path: LayoutRect[]): boolean {
    if (node.id === rect.id) {
      for (const p of path) result.add(p.id);
      return true;
    }
    for (const child of node.children) {
      if (walk(child, [...path, node])) return true;
    }
    return false;
  }
  walk(root, []);
  return result;
}

/** Build the descendant id set for a given layout rect. */
function descendantsOf(rect: LayoutRect): Set<string> {
  const result = new Set<string>();
  function walk(node: LayoutRect): void {
    for (const child of node.children) {
      result.add(child.id);
      walk(child);
    }
  }
  walk(rect);
  return result;
}

/** Find a LayoutRect by id in the tree. */
function findRect(root: LayoutRect, id: string): LayoutRect | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findRect(child, id);
    if (found !== undefined) return found;
  }
  return undefined;
}

export class BoardUI {
  private opts: BoardOptions;
  private playhead = 0;
  private frameId: string;
  private currentView: CameraView;
  private rafId = 0;
  private timer = 0;
  private speed: ReplaySpeed = 1;
  private stripWindow = 33;
  private noteKind: NoteKind = 'all';
  private reducedMotion: boolean;
  private rows: ReturnType<typeof indexRows>;

  constructor(opts: BoardOptions) {
    this.opts = opts;
    this.frameId = opts.layout.id; // start at root
    this.currentView = frameOf(opts.layout);
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rows = indexRows(opts.tree);
    this._bindKeys();
    this._buildIndex();
    this._bindOut();
    this._bindIsland();
    this._bindNotes();
    this._update();
  }

  // ── Playhead ──────────────────────────────────────────────────────────────

  setPlayhead(p: number): void {
    this.playhead = Math.max(0, Math.min(SETTLED, p));
    this._scheduleUpdate();
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  flyTo(id: string): void {
    const rect = findRect(this.opts.layout, id);
    if (rect === undefined) return;
    const prev = this.currentView;
    const next = frameOf(rect);
    this.frameId = id;

    const interp = buildZoomInterp(prev, next);
    const dur = animDuration(interp, this.reducedMotion);

    cancelAnimationFrame(this.rafId);

    if (dur === 0) {
      this.currentView = next;
      this._update();
      return;
    }

    const t0 = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - t0) / dur);
      const e = easeCubicOut(t);
      this.currentView = interpolateCamera(prev, next, e);
      this._render();
      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.currentView = next;
        this._update();
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  stepOut(): void {
    const rect = findRect(this.opts.layout, this.frameId);
    if (rect === undefined || rect.depth === 0) return;
    // find parent by walking
    const parentId = this._parentId(this.frameId);
    if (parentId !== undefined) this.flyTo(parentId);
  }

  // ── Replay ────────────────────────────────────────────────────────────────

  play(): void {
    if (this.timer !== 0) {
      this._stopReplay();
      return;
    }
    if (this.playhead >= SETTLED) this.setPlayhead(0);
    this.timer = window.setInterval(() => {
      if (this.playhead >= SETTLED) {
        this._stopReplay();
        return;
      }
      this.setPlayhead(this.playhead + 1);
    }, tickInterval(this.speed));
  }

  step(dir: 1 | -1): void {
    this._stopReplay();
    this.setPlayhead(this.playhead + dir);
  }

  setSpeed(s: ReplaySpeed): void {
    this.speed = s;
    if (this.timer !== 0) {
      this._stopReplay();
      this.play();
    }
  }

  setStripWindow(h: number): void {
    this.stripWindow = h;
    this._scheduleUpdate();
  }

  setNoteKind(k: NoteKind): void {
    this.noteKind = k;
    this._scheduleUpdate();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _stopReplay(): void {
    clearInterval(this.timer);
    this.timer = 0;
  }

  private _scheduleUpdate(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this._update();
    });
  }

  private _update(): void {
    this._render();
    this._paintIndex();
    this._paintIsland();
    this._paintNotes();
    this._paintCrumbs();
  }

  private _render(): void {
    const { viewport, layout } = this.opts;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const { cx, cy, width, aspect } = this.currentView;
    const kx = vw / width;
    const ky = vh / (width * aspect * 1.02);

    function place(node: LayoutRect): void {
      const sx = (node.x0 - cx) * kx + vw / 2;
      const sy = (node.y0 - cy) * ky + vh / 2;
      const sw = (node.x1 - node.x0) * kx;
      const sh = (node.y1 - node.y0) * ky;
      const el = viewport.querySelector<HTMLElement>(`[data-id="${CSS.escape(node.id)}"]`);
      if (el !== null) {
        const hidden = sw < 2.5 || sh < 2.5 || sx > vw || sy > vh || sx + sw < 0 || sy + sh < 0;
        el.hidden = hidden;
        if (!hidden) {
          el.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
          el.style.width = `${sw.toFixed(1)}px`;
          el.style.height = `${sh.toFixed(1)}px`;
        }
      }
      for (const child of node.children) place(child);
    }
    place(layout);
  }

  private _parentId(id: string): string | undefined {
    function findParent(node: LayoutRect, target: string): string | undefined {
      for (const child of node.children) {
        if (child.id === target) return node.id;
        const found = findParent(child, target);
        if (found !== undefined) return found;
      }
      return undefined;
    }
    return findParent(this.opts.layout, id);
  }

  private _paintIndex(): void {
    const { indexEl, layout } = this.opts;
    const frameRect = findRect(layout, this.frameId);
    const ancestorIds =
      frameRect !== undefined ? ancestorsOf(frameRect, layout) : new Set<string>();
    const rows = indexState(
      this.rows,
      this.frameId,
      ancestorIds,
      (id) => this.opts.valOf(id, this.playhead).gap,
      (id) => this.opts.valOf(id, this.playhead).lit,
    );
    const buttons = indexEl.querySelectorAll<HTMLElement>('[data-row-id]');
    for (const btn of buttons) {
      const id = btn.dataset['rowId'];
      const row = rows.find((r) => r.id === id);
      if (row === undefined) continue;
      btn.classList.toggle('cur', row.cur);
      btn.classList.toggle('path', row.path);
      btn.classList.toggle('inframe', row.inFrame);
      if (row.cur) btn.setAttribute('aria-current', 'location');
      else btn.removeAttribute('aria-current');
      const g = btn.querySelector('.g');
      if (g !== null) {
        g.textContent = row.gap ?? '';
        g.classList.toggle('lit', row.lit);
      }
    }
  }

  private _paintIsland(): void {
    const { islandEl, layout, leadId } = this.opts;
    const frameRect = findRect(layout, this.frameId);
    const leadRect = findRect(layout, leadId);
    const frameAncestors =
      frameRect !== undefined ? ancestorsOf(frameRect, layout) : new Set<string>();
    const leadAncestors =
      leadRect !== undefined ? ancestorsOf(leadRect, layout) : new Set<string>();
    const state: IslandState = islandState(
      this.frameId,
      leadId,
      leadAncestors,
      frameAncestors,
      this.playhead,
      SETTLED,
      (id) => this.opts.valOf(id, this.playhead),
    );

    islandEl.classList.toggle('away', state.mode === 'elsewhere');

    const inner = islandEl.querySelector('.island-in') ?? islandEl;
    // Clear and rebuild text nodes (no innerHTML — use textContent only)
    while (inner.firstChild) inner.removeChild(inner.firstChild);

    if (state.mode === 'settled') {
      const b = document.createElement('b');
      b.textContent = 'Settled YES';
      inner.appendChild(b);
      const q = document.createElement('span');
      q.className = 'q';
      q.textContent = 'Feb 28 06:15';
      inner.appendChild(q);
    } else if (state.mode === 'lead') {
      const info = document.createElement('span');
      info.textContent = `Tells ${state.tells ?? '—'} · Market ${state.market ?? '—'}`;
      inner.appendChild(info);
      const g = document.createElement('span');
      g.className = 'g';
      g.textContent = state.gap ?? '—';
      inner.appendChild(g);
    } else {
      const ew = document.createElement('span');
      ew.textContent = 'Elsewhere';
      inner.appendChild(ew);
      const g = document.createElement('span');
      g.className = 'g';
      g.textContent = state.gap ?? '—';
      inner.appendChild(g);
    }
  }

  private _paintNotes(): void {
    const { notesEl, notes, layout } = this.opts;
    const frameRect = findRect(layout, this.frameId);
    const frameAncestors =
      frameRect !== undefined ? ancestorsOf(frameRect, layout) : new Set<string>();
    const frameDescendants = frameRect !== undefined ? descendantsOf(frameRect) : new Set<string>();
    const visible = filterNotes(
      notes,
      this.frameId,
      frameAncestors,
      frameDescendants,
      this.playhead,
      this.noteKind,
    );

    while (notesEl.firstChild) notesEl.removeChild(notesEl.firstChild);

    if (visible.length === 0) {
      const p = document.createElement('p');
      p.className = 'quiet';
      p.textContent = 'Nothing noted here yet.';
      notesEl.appendChild(p);
      return;
    }

    for (const [i, note] of visible.entries()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'note' + (note.pressTime !== undefined ? ' press' : ' ai') + (i === 0 ? ' new' : '');
      btn.dataset['noteP'] = String(note.p);
      btn.dataset['noteNode'] = note.nodeId;

      const ts = document.createElement('span');
      ts.className = 'ts';
      const k = document.createElement('span');
      k.className = 'k';
      ts.appendChild(k);
      const when = document.createElement('span');
      when.textContent = note.pressTime ?? `Hour ${note.p}`;
      ts.appendChild(when);
      btn.appendChild(ts);

      const p = document.createElement('p');
      p.textContent = note.text;
      btn.appendChild(p);

      notesEl.appendChild(btn);
    }
  }

  private _paintCrumbs(): void {
    const { crumbsEl, layout, outBtn } = this.opts;
    while (crumbsEl.firstChild) crumbsEl.removeChild(crumbsEl.firstChild);

    // Build path from root to frame
    const path: LayoutRect[] = [];
    function buildPath(node: LayoutRect, target: string): boolean {
      path.push(node);
      if (node.id === target) return true;
      for (const child of node.children) {
        if (buildPath(child, target)) return true;
      }
      path.pop();
      return false;
    }
    buildPath(layout, this.frameId);

    for (const [i, rect] of path.entries()) {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '›';
        crumbsEl.appendChild(sep);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = rect.kind === 'page' ? 'Front page' : rect.id;
      // Try to get a human name from the tree
      const treeNode = this._findTreeNode(rect.id);
      if (treeNode !== undefined) btn.textContent = treeNode.name;
      if (rect.id === this.frameId) {
        btn.setAttribute('aria-current', 'location');
      } else {
        btn.addEventListener('click', () => {
          this.flyTo(rect.id);
        });
      }
      crumbsEl.appendChild(btn);
    }

    // Hide Out button at root
    (outBtn as HTMLButtonElement).hidden = path.length <= 1;
  }

  private _findTreeNode(id: string): BoardNode | undefined {
    function walk(node: BoardNode): BoardNode | undefined {
      if (node.id === id) return node;
      for (const child of node.children ?? []) {
        const found = walk(child);
        if (found !== undefined) return found;
      }
      return undefined;
    }
    return walk(this.opts.tree);
  }

  private _buildIndex(): void {
    const { indexEl, tree } = this.opts;
    this.rows = indexRows(tree);
    for (const row of this.rows) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset['rowId'] = row.id;
      if (row.kind === 'section') btn.className = 'sect';
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = row.name;
      btn.appendChild(lbl);
      const g = document.createElement('span');
      g.className = 'g';
      btn.appendChild(g);
      btn.addEventListener('click', () => {
        this.flyTo(row.id);
      });
      indexEl.appendChild(btn);
    }
  }

  private _bindOut(): void {
    this.opts.outBtn.addEventListener('click', () => {
      this.stepOut();
    });
  }

  private _bindIsland(): void {
    this.opts.islandEl.addEventListener('click', () => {
      if (this.opts.islandEl.classList.contains('away')) {
        this.flyTo(this.opts.leadId);
      }
    });
  }

  private _bindNotes(): void {
    this.opts.notesEl.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLElement>('.note');
      if (btn === null) return;
      const p = Number(btn.dataset['noteP']);
      const nodeId = btn.dataset['noteNode'];
      this._stopReplay();
      this.setPlayhead(p);
      if (nodeId !== undefined && nodeId !== this.frameId) {
        this.flyTo(nodeId);
      }
    });
  }

  private _bindKeys(): void {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const inInput = (e.target as Element).closest('input, textarea') !== null;
      if (inInput) return;

      if (e.key === ' ' && (e.target as Element).closest('button, [role=button]') === null) {
        e.preventDefault();
        this.play();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.step(-1);
      } else if (e.key === 'Escape') {
        this.stepOut();
      }
    });
  }
}

// Re-export LASTH and SETTLED for callers that build scrubbers
export { LASTH, SETTLED };
