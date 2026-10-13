import type { TeamId } from './types';

export const MAX_TEAM_NAME_LENGTH = 20;

export const DEFAULT_TEAM_NAMES: Readonly<Record<TeamId, string>> = {
  a: 'Team A',
  b: 'Team B',
};

// These code points are matched on purpose so they never reach the screen.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]');
const BIDI_AND_INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;
const UNPAIRED_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

function limitCodePoints(value: string, max: number): string {
  return Array.from(value).slice(0, max).join('');
}

function stripUnsafe(value: string): string {
  return value.replace(new RegExp(CONTROL_CHARS.source, 'g'), '').replace(new RegExp(BIDI_AND_INVISIBLE.source, 'g'), '');
}

export function sanitizeTeamName(input: string, team: TeamId): string {
  const cleaned = limitCodePoints(stripUnsafe(input.normalize('NFC').replace(/\u00A0/g, ' ')).trim(), MAX_TEAM_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : DEFAULT_TEAM_NAMES[team];
}

/** Fail closed for values already stored: do not trim or slice tampered data. */
export function isValidStoredName(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || Array.from(value).length > MAX_TEAM_NAME_LENGTH) return false;
  if (value !== value.normalize('NFC') || value !== value.trim()) return false;
  if (CONTROL_CHARS.test(value) || BIDI_AND_INVISIBLE.test(value) || UNPAIRED_SURROGATE.test(value)) {
    return false;
  }
  return true;
}
