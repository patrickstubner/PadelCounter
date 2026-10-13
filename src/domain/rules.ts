import type { MatchState, PlayerSlot, Server, SetIndex, SetScore, TeamId } from './types';

export const RULES_SUMMARY =
  'Satz gewonnen bei 6 Games mit 2 Vorsprung, 7:5, Tiebreak bei 6:6 → 7:6. Match: Best of 3. Aufschlag optional (A1, B1, A2, B2). Satz antippen zum Korrigieren.';

/** Teams alternate every game; partners alternate within a team. */
export const SERVE_ORDER: readonly Server[] = [
  { team: 'a', player: 1 },
  { team: 'b', player: 1 },
  { team: 'a', player: 2 },
  { team: 'b', player: 2 },
];

export function isPlausibleSetScore(a: number, b: number): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0 || a > 7 || b > 7) return false;
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  if (high <= 6) return true;
  return low === 5 || low === 6;
}

/** Set is won at 6 with a two-game lead (includes 7:5) or 7:6 after a tiebreak. */
export function setWinner(a: number, b: number): TeamId | null {
  if (!isPlausibleSetScore(a, b)) return null;
  if (a >= 6 && a - b >= 2) return 'a';
  if (b >= 6 && b - a >= 2) return 'b';
  if (a === 7 && b === 6) return 'a';
  if (b === 7 && a === 6) return 'b';
  return null;
}

export function matchWinner(sets: readonly [SetScore, SetScore, SetScore]): TeamId | null {
  let a = 0;
  let b = 0;
  for (const set of sets) {
    const winner = setWinner(set.a, set.b);
    if (winner === 'a') a += 1;
    if (winner === 'b') b += 1;
    if (a >= 2) return 'a';
    if (b >= 2) return 'b';
  }
  return null;
}

export function canIncrement(score: SetScore, team: TeamId): boolean {
  const next: SetScore = { a: score.a, b: score.b, [team]: score[team] + 1 };
  return isPlausibleSetScore(next.a, next.b);
}

export function canDecrement(score: SetScore, team: TeamId): boolean {
  if (score[team] <= 0) return false;
  const next: SetScore = { a: score.a, b: score.b, [team]: score[team] - 1 };
  return isPlausibleSetScore(next.a, next.b);
}

export function isUpcomingSet(state: MatchState, index: SetIndex): boolean {
  if (index <= state.activeSet) return false;
  const set = state.sets[index];
  return set.a === 0 && set.b === 0;
}

export function displayGames(state: MatchState, index: SetIndex, team: TeamId): string {
  if (isUpcomingSet(state, index)) return '–';
  return String(state.sets[index][team]);
}

export function rotateServe(serve: Server | null, direction: 1 | -1): Server | null {
  if (!serve) return null;
  const index = SERVE_ORDER.findIndex((item) => item.team === serve.team && item.player === serve.player);
  if (index < 0) return null;
  const next = (index + direction + SERVE_ORDER.length) % SERVE_ORDER.length;
  return SERVE_ORDER[next] ?? null;
}

/**
 * Tap on a team's ball. Another team jumps to player 1.
 * The same team goes player 1 → player 2 → unknown.
 */
export function serveChoice(current: Server | null, team: TeamId): Server | null {
  if (current?.team !== team) return { team, player: 1 };
  if (current.player === 1) return { team, player: 2 };
  return null;
}

export function serveLabel(serve: Server | null): string {
  if (!serve) return '«Aufschlag offen»';
  return `«Aufschlag ${serve.team.toUpperCase()}${serve.player}»`;
}

/** The unscored game of the active set is a tiebreak when the set is 6:6. */
export function isTiebreak(state: MatchState): boolean {
  const set = state.sets[state.activeSet];
  return set.a === 6 && set.b === 6;
}

export function tiebreakHint(state: MatchState): string | null {
  if (!isTiebreak(state)) return null;
  if (!state.serve) return 'Tiebreak';
  const who = `${state.serve.team.toUpperCase()}${state.serve.player}`;
  return `Tiebreak · ${who} beginnt, danach je 2`;
}

export function serverMark(team: TeamId, player: PlayerSlot): string {
  return `${team.toUpperCase()}${player}`;
}
