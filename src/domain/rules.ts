import type { MatchState, SetIndex, SetScore, TeamId } from './types';

export const RULES_SUMMARY =
  'Satz gewonnen bei 6 Games mit 2 Vorsprung, 7:5, Tiebreak bei 6:6 → 7:6. Match: Best of 3. Satz antippen zum Korrigieren.';

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
