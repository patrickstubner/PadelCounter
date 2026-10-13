import { sanitizeTeamName } from './names';
import { createMatch, matchReducer } from './reducer';
import { serverMark } from './rules';
import { SCHEMA_VERSION, type MatchEvent, type MatchState } from './types';

export const MAX_EVENTS = 500;

export interface MatchLog {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly base: MatchState;
  readonly events: readonly MatchEvent[];
}

export function createLog(
  at: number,
  matchId?: string,
  names?: { readonly a?: string; readonly b?: string },
): MatchLog {
  return {
    schemaVersion: SCHEMA_VERSION,
    base: createMatch(at, matchId, names),
    events: [],
  };
}

export function replay(log: MatchLog): MatchState {
  return log.events.reduce(matchReducer, log.base);
}

export function appendEvent(log: MatchLog, event: MatchEvent): MatchLog {
  const current = replay(log);
  const next = matchReducer(current, event);
  if (next === current) return log;

  let base = log.base;
  const events = [...log.events, event];
  while (events.length > MAX_EVENTS) {
    const dropped = events.shift();
    if (dropped) base = matchReducer(base, dropped);
  }
  return { schemaVersion: SCHEMA_VERSION, base, events };
}

export function undoLog(log: MatchLog): MatchLog {
  if (log.events.length === 0) return log;
  return { schemaVersion: SCHEMA_VERSION, base: log.base, events: log.events.slice(0, -1) };
}

export type LogAction = { readonly type: 'undo' } | { readonly type: 'record'; readonly event: MatchEvent };

export function logReducer(log: MatchLog, action: LogAction): MatchLog {
  if (action.type === 'undo') return undoLog(log);
  return appendEvent(log, action.event);
}

export function describeEvent(event: MatchEvent): string {
  switch (event.type) {
    case 'game/increment':
      return event.team === 'a' ? 'Game für A' : 'Game für B';
    case 'game/decrement':
      return event.team === 'a' ? 'Game A zurück' : 'Game B zurück';
    case 'set/select':
      return `Satz ${event.index + 1}`;
    case 'team/rename':
      return `Name ${event.team.toUpperCase()} · ${sanitizeTeamName(event.name, event.team)}`;
    case 'match/reset':
      return 'Neues Spiel';
    case 'serve/set':
      if (event.team === null || event.player === null) return 'Aufschlag offen';
      return `Aufschlag ${serverMark(event.team, event.player)}`;
    default:
      return 'Änderung';
  }
}
