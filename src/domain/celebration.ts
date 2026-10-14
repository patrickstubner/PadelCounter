import { isUuid } from './id';
import type { MatchLog } from './log';
import type { MatchStorage } from './persistence';
import { matchReducer } from './reducer';
import { celebrationWinner } from './rules';

/** Separate from the match log so a remembered celebration cannot fail log parsing. */
export const CELEBRATED_KEY = 'padel-counter.celebrated';

const MAX_EPISODE = 10_000;
const MAX_RAW_LENGTH = 200;

/** One not-won to won transition inside a single match. */
export interface WinEpisode {
  readonly matchId: string;
  readonly episode: number;
}

interface Trail {
  readonly current: WinEpisode | null;
  readonly beganOnLast: boolean;
}

/**
 * Walk the log once. `episode` counts not-won to won edges for the current
 * match only. Removing the win keeps the count, so the next edge is a new episode.
 */
function trail(log: MatchLog): Trail {
  let state = log.base;
  let episode = celebrationWinner(state) ? 1 : 0;
  let beganOnLast = episode > 0;

  for (const event of log.events) {
    const next = matchReducer(state, event);
    const wasWon = celebrationWinner(state) !== null;
    const nowWon = celebrationWinner(next) !== null;
    if (next.matchId !== state.matchId) {
      episode = nowWon ? 1 : 0;
      beganOnLast = nowWon;
    } else if (!wasWon && nowWon) {
      episode += 1;
      beganOnLast = true;
    } else {
      beganOnLast = false;
    }
    state = next;
  }

  const won = celebrationWinner(state) !== null;
  return {
    current: won ? { matchId: state.matchId, episode } : null,
    beganOnLast: won && beganOnLast,
  };
}

/** The win on the court now, or null when the match is not won. */
export function currentWin(log: MatchLog): WinEpisode | null {
  return trail(log).current;
}

/**
 * True when the latest step is what made this match won.
 * A later game, rename, or End match on an already decided score is not that step.
 * A won base with no events counts, so a compacted save can still celebrate once.
 */
export function winBeganOnLastEvent(log: MatchLog): boolean {
  return trail(log).beganOnLast;
}

/**
 * Show the celebration only on the not-won to won edge, and only if this
 * episode was not already celebrated (including after a reload).
 */
export function shouldCelebrate(log: MatchLog, saved: WinEpisode | null): boolean {
  const win = currentWin(log);
  if (!win) return false;
  if (saved && saved.matchId === win.matchId && saved.episode === win.episode) return false;
  return winBeganOnLastEvent(log);
}

function parseCelebrated(value: unknown): WinEpisode | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(source)) copy[key] = source[key];
  const matchId = copy.matchId;
  const episode = copy.episode;
  if (!isUuid(matchId)) return null;
  if (typeof episode !== 'number' || !Number.isInteger(episode) || episode < 1 || episode > MAX_EPISODE) {
    return null;
  }
  return { matchId: matchId.toLowerCase(), episode };
}

export function loadCelebrated(storage: Pick<MatchStorage, 'getItem'>): WinEpisode | null {
  try {
    const raw = storage.getItem(CELEBRATED_KEY);
    if (raw === null || raw.length === 0 || raw.length > MAX_RAW_LENGTH) return null;
    return parseCelebrated(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveCelebrated(win: WinEpisode, storage: Pick<MatchStorage, 'setItem'>): boolean {
  try {
    const raw = JSON.stringify({ matchId: win.matchId, episode: win.episode });
    if (raw.length > MAX_RAW_LENGTH) return false;
    storage.setItem(CELEBRATED_KEY, raw);
    return true;
  } catch {
    return false;
  }
}
