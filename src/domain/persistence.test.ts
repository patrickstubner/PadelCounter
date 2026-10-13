import { describe, expect, it } from 'vitest';
import { createMatch, matchReducer } from './reducer';
import { STORAGE_KEY, loadMatch, parsePersisted, saveMatch, serializeMatch, type MatchStorage } from './persistence';

const ID = '00000000-0000-4000-8000-00000000000a';
const T0 = 1_700_000_000_000;

function memory(): MatchStorage & { dump(): Map<string, string> } {
  const data = new Map<string, string>();
  return {
    dump: () => data,
    getItem: (key) => (data.has(key) ? (data.get(key) ?? null) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

function validState() {
  let state = createMatch(T0, ID, { a: 'A < B', b: 'Möwe' });
  state = matchReducer(state, { type: 'game/increment', team: 'a', at: T0 + 1 });
  return state;
}

describe('parsePersisted', () => {
  it('round-trips a valid match and lowercases the id', () => {
    const state = validState();
    const raw = serializeMatch(state).replace(ID, ID.toUpperCase());
    const loaded = parsePersisted(JSON.parse(raw) as unknown);
    expect(loaded?.matchId).toBe(ID);
    expect(loaded?.teams.a.name).toBe('A < B');
    expect(loaded?.teams.b.name).toBe('Möwe');
    expect(loaded?.sets[0]).toEqual({ a: 1, b: 0 });
    expect(loaded?.revision).toBe(1);
  });

  it('rejects a wrong schema, corrupt shapes, and impossible scores', () => {
    const state = validState();
    const envelope = JSON.parse(serializeMatch(state)) as { schemaVersion: number; state: Record<string, unknown> };
    expect(parsePersisted({ ...envelope, schemaVersion: 2 })).toBeNull();
    expect(parsePersisted({ schemaVersion: 1 })).toBeNull();
    expect(parsePersisted(null)).toBeNull();
    expect(parsePersisted([])).toBeNull();
    expect(parsePersisted('nope')).toBeNull();

    const badSets = structuredClone(envelope);
    badSets.state.sets = [{ a: 7, b: 4 }, { a: 0, b: 0 }, { a: 0, b: 0 }];
    expect(parsePersisted(badSets)).toBeNull();

    const tooLong = structuredClone(envelope);
    const teams = tooLong.state.teams as { a: { name: string } };
    teams.a.name = '123456789012345678901';
    expect(parsePersisted(tooLong)).toBeNull();

    const control = structuredClone(envelope);
    (control.state.teams as { a: { name: string } }).a.name = 'Bad\nName';
    expect(parsePersisted(control)).toBeNull();

    const active = structuredClone(envelope);
    active.state.activeSet = 3;
    expect(parsePersisted(active)).toBeNull();

    const fractional = structuredClone(envelope);
    (fractional.state.sets as Array<{ a: number; b: number }>)[0] = { a: 1.5, b: 0 };
    expect(parsePersisted(fractional)).toBeNull();
  });

  it('does not pollute Object.prototype and survives throwing getters', () => {
    const payload = JSON.parse(
      '{"schemaVersion":1,"__proto__":{"polluted":true},"state":{"schemaVersion":1}}',
    ) as unknown;
    expect(parsePersisted(payload)).toBeNull();
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();

    const evil: Record<string, unknown> = {};
    Object.defineProperty(evil, 'schemaVersion', {
      get() {
        throw new Error('boom');
      },
    });
    expect(parsePersisted(evil)).toBeNull();
  });
});

describe('loadMatch / saveMatch', () => {
  it('persists and reloads', () => {
    const storage = memory();
    const state = validState();
    expect(saveMatch(state, storage)).toBe(true);
    expect(storage.dump().get(STORAGE_KEY)).toContain('"schemaVersion":1');
    expect(loadMatch(storage)).toEqual(state);
  });

  it('returns null for missing, huge, and broken payloads', () => {
    const storage = memory();
    expect(loadMatch(storage)).toBeNull();
    storage.setItem(STORAGE_KEY, '{');
    expect(loadMatch(storage)).toBeNull();
    storage.setItem(STORAGE_KEY, 'x'.repeat(8_001));
    expect(loadMatch(storage)).toBeNull();
  });

  it('swallows storage failures', () => {
    const broken: MatchStorage = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('quota');
      },
    };
    expect(loadMatch(broken)).toBeNull();
    expect(saveMatch(validState(), broken)).toBe(false);
  });
});
