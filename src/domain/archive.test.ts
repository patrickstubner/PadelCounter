import { describe, expect, it } from 'vitest';
import { appendEvent, createLog } from './log';
import {
  ARCHIVE_KEY,
  MAX_ARCHIVED_MATCHES,
  fitArchive,
  listMatches,
  loadArchive,
  parseArchive,
  rememberMatch,
  saveArchive,
  setScoreLine,
  snapshotMatch,
  statusLabel,
  type ArchivedMatch,
} from './archive';
import { sessionReducer, type Session } from './session';
import type { MatchStorage } from './persistence';

const ID = '00000000-0000-4000-8000-0000000000aa';
const NEXT = '00000000-0000-4000-8000-0000000000bb';
const THIRD = '00000000-0000-4000-8000-0000000000cc';
const T0 = 1_700_000_000_000;

function played(id: string, games: number, at: number) {
  let log = createLog(at, id);
  for (let index = 0; index < games; index += 1) {
    log = appendEvent(log, { type: 'game/increment', team: 'a', at: at + index + 1 });
  }
  return log;
}

function session(log = createLog(T0, ID)): Session {
  return { log, archive: [] };
}

function archived(id: string, at: number): ArchivedMatch {
  return {
    id,
    at,
    teams: { a: 'Team A', b: 'Team B' },
    sets: [
      { a: 1, b: 0 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ],
    status: 'ended-early',
    events: [{ type: 'game/increment', team: 'a', at }],
  };
}

describe('match archive', () => {
  it('labels a win, an early ending, and a match still going', () => {
    const names = { a: 'Team A', b: 'Team B' };
    expect(statusLabel('winner-a', names)).toBe('Team A wins');
    expect(statusLabel('winner-b', names)).toBe('Team B wins');
    expect(statusLabel('ended-early', names)).toBe('ended early');
    expect(statusLabel('in-progress', names)).toBe('in progress');
    expect(setScoreLine([{ a: 6, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }])).toBe('6–0');
    expect(setScoreLine([{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }])).toBe('6–4, 3–6, 7–5');
    expect(setScoreLine([{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }])).toBe('0–0');
  });

  it('keeps a finished match when a new one starts, and drops it again on undo', () => {
    let current = session(played(ID, 6, T0));
    current = sessionReducer(current, { type: 'record', event: { type: 'match/end', at: T0 + 20 } });
    current = sessionReducer(current, { type: 'record', event: { type: 'match/reset', matchId: NEXT, at: T0 + 30 } });
    expect(current.archive).toHaveLength(1);
    expect(current.archive[0]?.status).toBe('winner-a');
    expect(current.archive[0]?.sets[0]).toEqual({ a: 6, b: 0 });
    expect(current.log.events.at(-1)?.type).toBe('match/reset');

    const listed = listMatches(current.log, current.archive);
    expect(listed.map((match) => match.status)).toEqual(['in progress', 'Team A wins']);
    expect(listed[0]?.score).toBe('0–0');
    expect(listed[1]?.score).toBe('6–0');
    expect(listed[1]?.events.map((event) => event.type)).toEqual(['game/increment', 'game/increment', 'game/increment', 'game/increment', 'game/increment', 'game/increment', 'match/end']);

    const undone = sessionReducer(current, { type: 'undo' });
    expect(undone.archive).toHaveLength(0);
    expect(listMatches(undone.log, undone.archive)).toHaveLength(1);
    expect(listMatches(undone.log, undone.archive)[0]?.status).toBe('Team A wins');
  });

  it('stores an abandoned match as ended early and skips a blank court', () => {
    const left = sessionReducer(session(played(ID, 2, T0)), {
      type: 'record',
      event: { type: 'match/reset', matchId: NEXT, at: T0 + 10 },
    });
    expect(left.archive[0]?.status).toBe('ended-early');
    expect(snapshotMatch(left.log)).toBeNull();
    const again = sessionReducer(left, { type: 'record', event: { type: 'match/reset', matchId: THIRD, at: T0 + 11 } });
    expect(again.archive).toHaveLength(1);
  });

  it('drops the oldest match past 100 and replaces the same id', () => {
    let archive: ArchivedMatch[] = [];
    for (let index = 0; index < MAX_ARCHIVED_MATCHES + 1; index += 1) {
      const id = `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
      archive = rememberMatch(archive, archived(id, T0 + index));
    }
    expect(archive).toHaveLength(MAX_ARCHIVED_MATCHES);
    expect(archive[0]?.at).toBe(T0 + 1);
    expect(archive.at(-1)?.at).toBe(T0 + MAX_ARCHIVED_MATCHES);
    const replaced = rememberMatch(archive, archived(archive[0]!.id, T0 + 500));
    expect(replaced.filter((match) => match.id === archive[0]?.id)).toHaveLength(1);
    expect(replaced.at(-1)?.at).toBe(T0 + 500);
  });

  it('shrinks the saved list when the payload is over the byte cap', () => {
    const matches = [archived(ID, T0), archived(NEXT, T0 + 1), archived(THIRD, T0 + 2)];
    const newest = JSON.stringify({ schemaVersion: 1, matches: [matches[2]] }).length;
    const two = JSON.stringify({ schemaVersion: 1, matches: [matches[1], matches[2]] }).length;
    const fitted = fitArchive(matches, two - 1);
    expect(fitted.map((match) => match.id)).toEqual([THIRD]);
    expect(newest).toBeLessThan(two);
  });

  it('rejects a broken archive and round-trips a valid one', () => {
    expect(parseArchive({ schemaVersion: 1, matches: [{ id: 'nope' }] })).toEqual([]);
    expect(parseArchive({ schemaVersion: 2, matches: [] })).toEqual([]);
    const storage: MatchStorage = {
      getItem: () => null,
      setItem: () => undefined,
    };
    const saved = new Map<string, string>();
    const memory: MatchStorage = {
      getItem: (key) => saved.get(key) ?? null,
      setItem: (key, value) => {
        saved.set(key, value);
      },
    };
    expect(saveArchive([archived(ID, T0)], memory)).toBe(true);
    expect(saved.get(ARCHIVE_KEY)).toContain('"schemaVersion":1');
    expect(loadArchive(memory)[0]?.id).toBe(ID);
    saved.set(ARCHIVE_KEY, '{');
    expect(loadArchive(memory)).toEqual([]);
    expect(loadArchive(storage)).toEqual([]);
  });
});
