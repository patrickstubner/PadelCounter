import { describe, expect, it } from 'vitest';
import { currentHistory } from './history';
import { appendEvent, createLog, replay, undoLog } from './log';

const ID = '00000000-0000-4000-8000-0000000000aa';
const T0 = new Date(2026, 9, 13, 14, 0, 0).getTime();

describe('match history rows', () => {
  it('lists games oldest first with the score after each point', () => {
    let log = createLog(T0, ID, { a: 'Team A', b: 'Team B' });
    log = appendEvent(log, { type: 'game/increment', team: 'a', at: T0 + 1_000 });
    log = appendEvent(log, { type: 'game/increment', team: 'b', at: T0 + 2_000 });
    const rows = currentHistory(log);
    expect(rows.map((row) => row.game)).toEqual(['1:0', '1:1']);
    expect(rows.map((row) => row.label)).toEqual(['Team A won the game', 'Team B won the game']);
    expect(rows[0]?.at).toBeLessThan(rows[1]?.at ?? 0);
    expect(rows.every((row) => row.sets === null)).toBe(true);
  });

  it('adds the set score when a set is won or the active set changes', () => {
    let log = createLog(T0, ID);
    for (let i = 0; i < 6; i += 1) {
      log = appendEvent(log, { type: 'game/increment', team: 'a', at: T0 + 1_000 + i });
    }
    log = appendEvent(log, { type: 'set/select', index: 0, at: T0 + 8_000 });
    const rows = currentHistory(log);
    expect(rows[0]?.game).toBe('1:0');
    expect(rows[0]?.sets).toBeNull();
    expect(rows[5]?.game).toBe('6:0');
    expect(rows[5]?.sets).toBe('6:0');
    expect(rows[6]?.label).toBe('Set 1');
    expect(rows[6]?.sets).toBe('6:0');
    expect(rows[6]?.game).toBeNull();
  });

  it('undoes a B-start rotation back through A1 to B1', () => {
    let log = createLog(T0, ID);
    log = appendEvent(log, { type: 'serve/set', team: 'b', player: 1, at: T0 + 1 });
    log = appendEvent(log, { type: 'game/increment', team: 'a', at: T0 + 2 });
    expect(replay(log).serve).toEqual({ team: 'a', player: 1 });
    log = appendEvent(log, { type: 'game/increment', team: 'b', at: T0 + 3 });
    expect(replay(log).serve).toEqual({ team: 'b', player: 2 });
    log = undoLog(log);
    expect(replay(log).serve).toEqual({ team: 'a', player: 1 });
    log = undoLog(log);
    expect(replay(log).serve).toEqual({ team: 'b', player: 1 });
    const rows = currentHistory(log);
    expect(rows.map((row) => row.label)).toEqual(['Serve B1']);
  });
});
