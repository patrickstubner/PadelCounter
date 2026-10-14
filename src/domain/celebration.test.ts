import { describe, expect, it } from 'vitest';
import {
  CELEBRATED_KEY,
  currentWin,
  loadCelebrated,
  saveCelebrated,
  shouldCelebrate,
  winBeganOnLastEvent,
} from './celebration';
import { appendEvent, createLog, type MatchLog } from './log';
import type { MatchStorage } from './persistence';
import { createMatch, matchReducer } from './reducer';
import type { TeamId } from './types';

const ID = '00000000-0000-4000-8000-00000000000c';
const NEXT = '00000000-0000-4000-8000-00000000000d';
const T0 = 1_700_000_000_000;

function games(log: MatchLog, team: TeamId, count: number, at: number): MatchLog {
  let next = log;
  for (let i = 0; i < count; i += 1) {
    next = appendEvent(next, { type: 'game/increment', team, at: at + i });
  }
  return next;
}

function memory(): MatchStorage & { readonly dump: () => Map<string, string> } {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    dump: () => store,
  };
}

function wonLog(): MatchLog {
  return games(games(createLog(T0, ID), 'a', 6, T0 + 1), 'a', 6, T0 + 20);
}

describe('celebration episodes', () => {
  it('celebrates the winning point once, not a later game while the match stays won', () => {
    const won = wonLog();
    expect(currentWin(won)).toEqual({ matchId: ID, episode: 1 });
    expect(winBeganOnLastEvent(won)).toBe(true);
    expect(shouldCelebrate(won, null)).toBe(true);

    const third = appendEvent(
      appendEvent(won, { type: 'set/select', index: 2, at: T0 + 40 }),
      { type: 'game/increment', team: 'a', at: T0 + 41 },
    );
    expect(currentWin(third)).toEqual({ matchId: ID, episode: 1 });
    expect(winBeganOnLastEvent(third)).toBe(false);
    expect(shouldCelebrate(third, null)).toBe(false);
    expect(shouldCelebrate(appendEvent(third, { type: 'game/increment', team: 'b', at: T0 + 42 }), null)).toBe(false);
  });

  it('celebrates again after minus or undo removes the win', () => {
    const won = wonLog();
    const removed = appendEvent(won, { type: 'game/decrement', team: 'a', at: T0 + 40 });
    expect(currentWin(removed)).toBeNull();
    expect(shouldCelebrate(removed, { matchId: ID, episode: 1 })).toBe(false);

    const again = appendEvent(removed, { type: 'game/increment', team: 'a', at: T0 + 41 });
    expect(currentWin(again)).toEqual({ matchId: ID, episode: 2 });
    expect(shouldCelebrate(again, { matchId: ID, episode: 1 })).toBe(true);
    expect(shouldCelebrate(again, { matchId: ID, episode: 2 })).toBe(false);
  });

  it('does not treat End match on an already decided score as a new win', () => {
    const ended = appendEvent(wonLog(), { type: 'match/end', at: T0 + 40 });
    expect(currentWin(ended)).toEqual({ matchId: ID, episode: 1 });
    expect(shouldCelebrate(ended, null)).toBe(false);
  });

  it('celebrates End match on a one-set lead, and again if resume clears it', () => {
    const lead = appendEvent(games(createLog(T0, ID), 'b', 6, T0 + 1), { type: 'match/end', at: T0 + 20 });
    expect(currentWin(lead)).toEqual({ matchId: ID, episode: 1 });
    expect(shouldCelebrate(lead, null)).toBe(true);

    const resumed = appendEvent(lead, { type: 'match/resume', at: T0 + 21 });
    expect(currentWin(resumed)).toBeNull();
    const endedAgain = appendEvent(resumed, { type: 'match/end', at: T0 + 22 });
    expect(currentWin(endedAgain)).toEqual({ matchId: ID, episode: 2 });
    expect(shouldCelebrate(endedAgain, { matchId: ID, episode: 1 })).toBe(true);
  });

  it('starts a fresh episode on a new match', () => {
    const fresh = appendEvent(wonLog(), { type: 'match/new', matchId: NEXT, at: T0 + 40 });
    expect(currentWin(fresh)).toBeNull();
    const wonAgain = games(games(fresh, 'a', 6, T0 + 50), 'a', 6, T0 + 70);
    expect(currentWin(wonAgain)).toEqual({ matchId: NEXT, episode: 1 });
    expect(shouldCelebrate(wonAgain, { matchId: ID, episode: 1 })).toBe(true);
  });

  it('does not celebrate a compacted log whose win is already in the base', () => {
    let state = createMatch(T0, ID);
    for (let i = 0; i < 12; i += 1) {
      state = matchReducer(state, { type: 'game/increment', team: 'a', at: T0 + 1 + i });
    }
    const log: MatchLog = {
      schemaVersion: state.schemaVersion,
      base: state,
      events: [{ type: 'set/select', index: 2, at: T0 + 30 }],
    };
    expect(currentWin(log)).toEqual({ matchId: ID, episode: 1 });
    expect(winBeganOnLastEvent(log)).toBe(false);
    expect(shouldCelebrate(log, null)).toBe(false);
  });

  it('remembers a celebration and ignores a broken value', () => {
    const storage = memory();
    expect(loadCelebrated(storage)).toBeNull();
    expect(saveCelebrated({ matchId: ID, episode: 1 }, storage)).toBe(true);
    expect(loadCelebrated(storage)).toEqual({ matchId: ID, episode: 1 });
    expect(storage.dump().get(CELEBRATED_KEY)).toBe(`{"matchId":"${ID}","episode":1}`);

    storage.setItem(CELEBRATED_KEY, '{');
    expect(loadCelebrated(storage)).toBeNull();
    storage.setItem(CELEBRATED_KEY, JSON.stringify({ matchId: 'nope', episode: 1 }));
    expect(loadCelebrated(storage)).toBeNull();
    storage.setItem(CELEBRATED_KEY, JSON.stringify({ matchId: ID, episode: 0 }));
    expect(loadCelebrated(storage)).toBeNull();
    storage.setItem(CELEBRATED_KEY, 'x'.repeat(201));
    expect(loadCelebrated(storage)).toBeNull();
  });
});
