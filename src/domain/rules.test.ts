import { describe, expect, it } from 'vitest';
import { createMatch } from './reducer';
import {
  RULES_SUMMARY,
  canDecrement,
  canIncrement,
  displayGames,
  isPlausibleSetScore,
  isTiebreak,
  matchWinner,
  rotateServe,
  serveChoice,
  serveLabel,
  setWinner,
  tiebreakHint,
} from './rules';
import type { TeamId } from './types';

describe('setWinner', () => {
  const cases: Array<[number, number, TeamId | null]> = [
    [0, 0, null],
    [5, 3, null],
    [5, 5, null],
    [6, 5, null],
    [5, 6, null],
    [6, 6, null],
    [6, 0, 'a'],
    [6, 4, 'a'],
    [4, 6, 'b'],
    [7, 5, 'a'],
    [5, 7, 'b'],
    [7, 6, 'a'],
    [6, 7, 'b'],
  ];

  it.each(cases)('%i:%i → %s', (a, b, winner) => {
    expect(setWinner(a, b)).toBe(winner);
  });

  it('rejects impossible scores', () => {
    expect(setWinner(7, 4)).toBeNull();
    expect(setWinner(8, 6)).toBeNull();
    expect(setWinner(6.5, 4)).toBeNull();
    expect(isPlausibleSetScore(7, 4)).toBe(false);
    expect(isPlausibleSetScore(7, 7)).toBe(false);
    expect(isPlausibleSetScore(6, 6)).toBe(true);
  });
});

describe('matchWinner', () => {
  it('is best of 3, first to two sets', () => {
    expect(
      matchWinner([
        { a: 6, b: 4 },
        { a: 6, b: 3 },
        { a: 0, b: 0 },
      ]),
    ).toBe('a');
    expect(
      matchWinner([
        { a: 6, b: 4 },
        { a: 3, b: 6 },
        { a: 7, b: 5 },
      ]),
    ).toBe('a');
    expect(
      matchWinner([
        { a: 7, b: 6 },
        { a: 6, b: 7 },
        { a: 0, b: 0 },
      ]),
    ).toBeNull();
    expect(
      matchWinner([
        { a: 6, b: 5 },
        { a: 0, b: 0 },
        { a: 0, b: 0 },
      ]),
    ).toBeNull();
  });
});

describe('manual corrections stay on plausible scores', () => {
  it('allows fixing 6:0 to 6:1 and blocks 7:0', () => {
    expect(canIncrement({ a: 6, b: 0 }, 'b')).toBe(true);
    expect(canIncrement({ a: 6, b: 0 }, 'a')).toBe(false);
    expect(canIncrement({ a: 6, b: 4 }, 'b')).toBe(true);
    expect(canIncrement({ a: 6, b: 5 }, 'a')).toBe(true);
    expect(canIncrement({ a: 6, b: 6 }, 'a')).toBe(true);
    expect(canIncrement({ a: 7, b: 6 }, 'a')).toBe(false);
    expect(canIncrement({ a: 7, b: 6 }, 'b')).toBe(false);
  });

  it('blocks a decrement that would invent 7:4', () => {
    expect(canDecrement({ a: 7, b: 5 }, 'b')).toBe(false);
    expect(canDecrement({ a: 7, b: 5 }, 'a')).toBe(true);
    expect(canDecrement({ a: 7, b: 6 }, 'a')).toBe(true);
    expect(canDecrement({ a: 0, b: 0 }, 'a')).toBe(false);
  });
});

describe('display', () => {
  it('shows a dash for sets that have not started', () => {
    const state = createMatch(1_700_000_000_000, '00000000-0000-4000-8000-000000000001');
    expect(displayGames(state, 0, 'a')).toBe('0');
    expect(displayGames(state, 1, 'b')).toBe('–');
    expect(displayGames(state, 2, 'a')).toBe('–');
  });

  it('mentions the padel rules', () => {
    expect(RULES_SUMMARY).toContain('6 games');
    expect(RULES_SUMMARY).toContain('lead of 2');
    expect(RULES_SUMMARY).toContain('7–5');
    expect(RULES_SUMMARY).toContain('6–6');
    expect(RULES_SUMMARY).toContain('7–6');
    expect(RULES_SUMMARY).toContain('best of 3');
    expect(RULES_SUMMARY).toContain('A1, B1, A2, B2');
  });
});

describe('serve rotation', () => {
  it('cycles teams and partners, and can be cleared from the same team', () => {
    expect(rotateServe({ team: 'a', player: 1 }, 1)).toEqual({ team: 'b', player: 1 });
    expect(rotateServe({ team: 'b', player: 1 }, 1)).toEqual({ team: 'a', player: 2 });
    expect(rotateServe({ team: 'a', player: 2 }, 1)).toEqual({ team: 'b', player: 2 });
    expect(rotateServe({ team: 'b', player: 2 }, 1)).toEqual({ team: 'a', player: 1 });
    expect(rotateServe({ team: 'a', player: 1 }, -1)).toEqual({ team: 'b', player: 2 });
    expect(rotateServe(null, 1)).toBeNull();
    expect(serveChoice(null, 'b')).toEqual({ team: 'b', player: 1 });
    expect(serveChoice({ team: 'a', player: 1 }, 'a')).toEqual({ team: 'a', player: 2 });
    expect(serveChoice({ team: 'a', player: 2 }, 'a')).toBeNull();
    expect(serveChoice({ team: 'a', player: 2 }, 'b')).toEqual({ team: 'b', player: 1 });
    expect(serveLabel(null)).toBe('«Serve open»');
    expect(serveLabel({ team: 'a', player: 1 })).toBe('«Serve A1»');
  });

  it('marks only a 6:6 active set as a tiebreak', () => {
    const state = createMatch(1_700_000_000_000, '00000000-0000-4000-8000-000000000001');
    expect(isTiebreak(state)).toBe(false);
    expect(tiebreakHint(state)).toBeNull();
    const tied = {
      ...state,
      sets: [
        { a: 6, b: 6 },
        { a: 0, b: 0 },
        { a: 0, b: 0 },
      ] as const,
      serve: { team: 'b' as const, player: 2 as const },
    };
    expect(isTiebreak(tied)).toBe(true);
    expect(tiebreakHint(tied)).toBe('Tiebreak · B2 starts, then two each');
    expect(tiebreakHint({ ...tied, serve: null })).toBe('Tiebreak');
  });
});
