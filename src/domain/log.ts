import { type Lang, INTL_LOCALE } from '../i18n/locale';
import { fill, messages } from '../i18n/messages';
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

/** Default names with no rename in the log stay in the base. Later renames are events, both at once. */
export function retitleTeams(
  log: MatchLog,
  names: { readonly a: string; readonly b: string },
  at: number,
): MatchLog {
  const a = sanitizeTeamName(names.a, 'a');
  const b = sanitizeTeamName(names.b, 'b');
  const state = replay(log);
  if (state.teams.a.name === a && state.teams.b.name === b) return log;
  if (!log.events.some((event) => event.type === 'team/rename')) {
    return {
      ...log,
      base: {
        ...log.base,
        teams: { a: { name: a }, b: { name: b } },
      },
    };
  }
  return (['a', 'b'] as const).reduce<MatchLog>(
    (current, team) => appendEvent(current, { type: 'team/rename', team, name: team === 'a' ? a : b, at }),
    log,
  );
}

export type LogAction =
  | { readonly type: 'undo' }
  | { readonly type: 'record'; readonly event: MatchEvent }
  | { readonly type: 'retitle'; readonly names: { readonly a: string; readonly b: string }; readonly at: number };

export function logReducer(log: MatchLog, action: LogAction): MatchLog {
  if (action.type === 'undo') return undoLog(log);
  if (action.type === 'retitle') return retitleTeams(log, action.names, action.at);
  return appendEvent(log, action.event);
}

export function describeEvent(event: MatchEvent, lang: Lang = 'de'): string {
  const text = messages[lang];
  switch (event.type) {
    case 'game/increment':
      return fill(text.gameFor, { team: event.team.toUpperCase() });
    case 'game/decrement':
      return fill(text.gameBack, { team: event.team.toUpperCase() });
    case 'set/select':
      return fill(text.eventSet, { n: event.index + 1 });
    case 'team/rename':
      return fill(text.eventName, {
        team: event.team.toUpperCase(),
        name: sanitizeTeamName(event.name, event.team),
      });
    case 'match/reset':
      return text.eventNew;
    case 'match/end':
      return text.eventEnd;
    case 'match/resume':
      return text.eventResume;
    case 'serve/set':
      if (event.team === null || event.player === null) return text.eventServeOpen;
      return fill(text.eventServe, { mark: serverMark(event.team, event.player) });
    default:
      return text.eventChange;
  }
}

/** Local clock. A different calendar day is prefixed in the locale's date order. */
export function formatEventTime(at: number, now = Date.now(), lang: Lang = 'de'): string {
  const date = new Date(at);
  const today = new Date(now);
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const tag = INTL_LOCALE[lang];
  const time = new Intl.DateTimeFormat(tag, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  if (sameDay) return time;
  const day = new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  return `${day} ${time}`;
}
