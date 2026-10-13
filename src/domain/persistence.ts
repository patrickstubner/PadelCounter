import { isUuid } from './id';
import { isValidStoredName } from './names';
import { isPlausibleSetScore } from './rules';
import {
  SCHEMA_VERSION,
  isSetIndex,
  isTimestamp,
  type MatchState,
  type SetScore,
} from './types';

export const STORAGE_KEY = 'padel-counter.v1';

const MAX_RAW_LENGTH = 8_000;
const MAX_REVISION = 10_000_000;

export interface MatchStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function plain(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(value)) {
    copy[key] = value[key];
  }
  return copy;
}

function parseScore(value: unknown): SetScore | null {
  const record = plain(value);
  if (!record) return null;
  const a = record.a;
  const b = record.b;
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  if (!isPlausibleSetScore(a, b)) return null;
  return { a, b };
}

function parseState(value: unknown): MatchState | null {
  const record = plain(value);
  if (!record) return null;
  if (record.schemaVersion !== SCHEMA_VERSION) return null;
  if (!isUuid(record.matchId)) return null;
  if (typeof record.revision !== 'number' || !Number.isInteger(record.revision)) return null;
  if (record.revision < 0 || record.revision > MAX_REVISION) return null;
  if (!isTimestamp(record.createdAt) || !isTimestamp(record.updatedAt)) return null;
  if (!isSetIndex(record.activeSet)) return null;
  if (!Array.isArray(record.sets) || record.sets.length !== 3) return null;

  const set0 = parseScore(record.sets[0]);
  const set1 = parseScore(record.sets[1]);
  const set2 = parseScore(record.sets[2]);
  if (!set0 || !set1 || !set2) return null;

  const teams = plain(record.teams);
  const teamA = teams ? plain(teams.a) : null;
  const teamB = teams ? plain(teams.b) : null;
  if (!teamA || !teamB) return null;
  if (!isValidStoredName(teamA.name) || !isValidStoredName(teamB.name)) return null;

  return {
    schemaVersion: SCHEMA_VERSION,
    matchId: record.matchId.toLowerCase(),
    revision: record.revision,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    activeSet: record.activeSet,
    teams: {
      a: { name: teamA.name },
      b: { name: teamB.name },
    },
    sets: [set0, set1, set2],
  };
}

export function parsePersisted(input: unknown): MatchState | null {
  try {
    const record = plain(input);
    if (!record || record.schemaVersion !== SCHEMA_VERSION) return null;
    return parseState(record.state);
  } catch {
    return null;
  }
}

export function serializeMatch(state: MatchState): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, state });
}

export function loadMatch(storage: Pick<MatchStorage, 'getItem'>): MatchState | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw.length === 0 || raw.length > MAX_RAW_LENGTH) return null;
    return parsePersisted(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveMatch(state: MatchState, storage: Pick<MatchStorage, 'setItem'>): boolean {
  try {
    storage.setItem(STORAGE_KEY, serializeMatch(state));
    return true;
  } catch {
    return false;
  }
}
