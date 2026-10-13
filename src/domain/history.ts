import { currentMatchEvents } from './archive';
import { describeEvent, type MatchLog } from './log';
import { createMatch, matchReducer } from './reducer';
import { setWinner } from './rules';
import type { MatchEvent, MatchState, SetScore } from './types';

export interface HistoryRow {
  readonly at: number;
  readonly label: string;
  /** Game score after the event, such as `1:0`. */
  readonly game: string | null;
  /** Set scores when the set or its winner changed, such as `6:4`. */
  readonly sets: string | null;
}

export function colonSetScore(sets: readonly [SetScore, SetScore, SetScore]): string {
  let last = -1;
  sets.forEach((set, index) => {
    if (set.a !== 0 || set.b !== 0) last = index;
  });
  if (last < 0) return '0:0';
  return sets
    .slice(0, last + 1)
    .map((set) => `${set.a}:${set.b}`)
    .join(', ');
}

function setPhase(state: MatchState): string {
  return state.sets
    .map((set) => setWinner(set.a, set.b) ?? '-')
    .join('')
    .concat(String(state.activeSet));
}

function rowLabel(event: MatchEvent, state: MatchState): string {
  if (event.type === 'game/increment') return `${state.teams[event.team].name} won the game`;
  if (event.type === 'game/decrement') return `${state.teams[event.team].name} game removed`;
  return describeEvent(event);
}

/** Oldest event first. Game rows carry the score after the point; a set change also carries the sets. */
export function historyRows(start: MatchState, events: readonly MatchEvent[]): HistoryRow[] {
  const rows: HistoryRow[] = [];
  let state = start;
  for (const event of events) {
    const before = state;
    const after = matchReducer(before, event);
    state = after;
    const isGame = event.type === 'game/increment' || event.type === 'game/decrement';
    const played = after.sets[before.activeSet];
    const setChanged = event.type === 'set/select' || setPhase(before) !== setPhase(after);
    rows.push({
      at: event.at,
      label: rowLabel(event, after),
      game: isGame ? `${played.a}:${played.b}` : null,
      sets: setChanged ? colonSetScore(after.sets) : null,
    });
  }
  return rows;
}

export function currentHistory(log: MatchLog): HistoryRow[] {
  const events = currentMatchEvents(log);
  const prefix = log.events.slice(0, log.events.length - events.length);
  const start = prefix.reduce(matchReducer, log.base);
  return historyRows(start, events);
}

export function archivedHistory(
  id: string,
  at: number,
  nameA: string,
  nameB: string,
  events: readonly MatchEvent[],
): HistoryRow[] {
  return historyRows(createMatch(at, id, { a: nameA, b: nameB }), events);
}
