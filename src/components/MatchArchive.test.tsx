import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { appendEvent, createLog, formatMatchStamp } from '../domain/log';
import { ARCHIVE_KEY, listMatches, saveArchive } from '../domain/archive';
import { STORAGE_KEY, serializeLog } from '../domain/persistence';
import { sessionReducer } from '../domain/session';
import { MatchArchive } from './MatchArchive';

const ID = '00000000-0000-4000-8000-0000000000aa';
const NEXT = '00000000-0000-4000-8000-0000000000bb';
const T0 = new Date(2026, 9, 12, 9, 1, 2).getTime();

function memoryStore() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  return store;
}

describe('match history screens', () => {
  beforeEach(() => {
    memoryStore();
  });

  it('opens from the title and lists the live match', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-testid="open-matches"');
    expect(html).toContain('Padel Counter');
    expect(html).not.toContain('data-testid="archive"');
    expect(html).toContain('>Padel Counter</button>');
  });

  it('shows newest matches first, then the events that built one match', () => {
    let log = createLog(T0, ID, { a: 'Lobos', b: 'Team B' });
    log = appendEvent(log, { type: 'game/increment', team: 'a', at: T0 + 1_000 });
    const archived = sessionReducer({ log, archive: [] }, {
      type: 'record',
      event: { type: 'match/reset', matchId: NEXT, at: T0 + 86_400_000 },
    });
    const store = memoryStore();
    store.set(STORAGE_KEY, serializeLog(archived.log));
    saveArchive(archived.archive, localStorage);
    expect(store.get(ARCHIVE_KEY)).toContain('Lobos');

    const matches = listMatches(archived.log, archived.archive);
    expect(matches[0]?.status).toBe('in progress');
    expect(matches[1]?.status).toBe('ended early');
    expect(matches[1]?.nameA).toBe('Lobos');
    expect(formatMatchStamp(matches[1]!.at)).toContain('10/12/2026');

    const list = renderToStaticMarkup(
      <MatchArchive screen="matches" matches={matches} selected={null} onOpen={() => undefined} onBack={() => undefined} />,
    );
    expect(list).toContain('data-testid="archive-back"');
    expect(list).toContain('>Back</button>');
    expect(list.indexOf('in progress')).toBeLessThan(list.indexOf('ended early'));
    expect(list).toContain('Lobos · Team B');
    expect(list).toContain('1–0');

    const past = matches[1];
    const detail = renderToStaticMarkup(
      <MatchArchive screen="detail" matches={matches} selected={past ?? null} onOpen={() => undefined} onBack={() => undefined} />,
    );
    expect(detail).toContain('data-testid="match-detail"');
    expect(detail).toContain('data-testid="archive-back"');
    expect(detail).toContain('Game for A');
    expect(detail).toContain('ended early');
    expect(detail.indexOf('data-testid="archive-back"')).toBeLessThan(detail.indexOf('Game for A'));
  });

  it('says when a saved match is missing', () => {
    const html = renderToStaticMarkup(
      <MatchArchive screen="detail" matches={[]} selected={null} onOpen={() => undefined} onBack={() => undefined} />,
    );
    expect(html).toContain('Match not found.');
    expect(html).toContain('data-testid="archive-back"');
  });
});
