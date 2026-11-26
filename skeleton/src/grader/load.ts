import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BoardData, MarketEntry, TellRecord, WalkForwardRow } from './types.js';

const DEFAULT_PATH = fileURLToPath(
  new URL('../../../fixtures/omens/board-data.json', import.meta.url),
);

function invalid(reason: string): never {
  throw new Error(`board-data invalid: ${reason}`);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateRow(r: unknown, i: number): WalkForwardRow {
  if (!isRecord(r)) invalid(`walkForward.rows[${i.toString()}] is not an object`);
  const row = r as Record<string, unknown>;
  if (typeof row['t'] !== 'string') invalid(`rows[${i.toString()}].t must be string`);
  if (typeof row['market'] !== 'string') invalid(`rows[${i.toString()}].market must be string`);
  if (typeof row['pMarket'] !== 'number') invalid(`rows[${i.toString()}].pMarket must be number`);
  if (typeof row['m1'] !== 'number') invalid(`rows[${i.toString()}].m1 must be number`);
  if (typeof row['m2w'] !== 'number') invalid(`rows[${i.toString()}].m2w must be number`);
  if (row['y'] !== 0 && row['y'] !== 1) invalid(`rows[${i.toString()}].y must be 0 or 1`);
  return row as unknown as WalkForwardRow;
}

function validateMarket(m: unknown, i: number): MarketEntry {
  if (!isRecord(m)) invalid(`walkForward.markets[${i.toString()}] is not an object`);
  const mkt = m as Record<string, unknown>;
  if (typeof mkt['id'] !== 'string') invalid(`markets[${i.toString()}].id must be string`);
  if (typeof mkt['question'] !== 'string')
    invalid(`markets[${i.toString()}].question must be string`);
  if (mkt['outcome'] !== 0 && mkt['outcome'] !== 1)
    invalid(`markets[${i.toString()}].outcome must be 0 or 1`);
  return mkt as unknown as MarketEntry;
}

function validateTell(name: string, t: unknown): TellRecord {
  if (!isRecord(t)) invalid(`tells.${name} is not an object`);
  const tell = t as Record<string, unknown>;
  const verdicts = ['killed', 'pending', 'collecting', 'graded'];
  if (!verdicts.includes(tell['verdict'] as string))
    invalid(`tells.${name}.verdict must be one of ${verdicts.join('|')}`);
  return tell as unknown as TellRecord;
}

/**
 * Load and validate fixtures/omens/board-data.json.
 * Pass an explicit file path to override the default (useful in tests).
 * Throws `Error('board-data invalid: ...')` on any structural problem.
 */
export function loadBoardData(path?: string): BoardData {
  const filePath = path ?? DEFAULT_PATH;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
  } catch (e) {
    invalid(`could not read file: ${String(e)}`);
  }

  if (!isRecord(raw)) invalid('root is not an object');
  const root = raw as Record<string, unknown>;

  // walkForward
  if (!isRecord(root['walkForward'])) invalid('missing walkForward');
  const wf = root['walkForward'] as Record<string, unknown>;
  if (!Array.isArray(wf['rows'])) invalid('walkForward.rows must be array');
  if (!Array.isArray(wf['markets'])) invalid('walkForward.markets must be array');
  const rows = (wf['rows'] as unknown[]).map(validateRow);
  const markets = (wf['markets'] as unknown[]).map(validateMarket);

  // scoreTable
  if (!isRecord(root['scoreTable'])) invalid('missing scoreTable');
  const st = root['scoreTable'] as Record<string, unknown>;
  if (!isRecord(st['scores'])) invalid('missing scoreTable.scores');
  const sc = st['scores'] as Record<string, unknown>;
  for (const key of ['M0', 'M1', 'M2W'] as const) {
    if (!isRecord(sc[key]) || typeof (sc[key] as Record<string, unknown>)['brier'] !== 'number')
      invalid(`scoreTable.scores.${key}.brier must be a number`);
  }

  // tells
  if (!isRecord(root['tells'])) invalid('missing tells');
  const rawTells = root['tells'] as Record<string, unknown>;
  const tells: Record<string, TellRecord> = {};
  for (const [name, val] of Object.entries(rawTells)) {
    tells[name] = validateTell(name, val);
  }

  return {
    walkForward: { rows, markets },
    scoreTable: {
      scores: {
        M0: { brier: (sc['M0'] as Record<string, unknown>)['brier'] as number },
        M1: { brier: (sc['M1'] as Record<string, unknown>)['brier'] as number },
        M2W: { brier: (sc['M2W'] as Record<string, unknown>)['brier'] as number },
      },
    },
    tells,
  };
}
