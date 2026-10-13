import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { appendEvent, createLog } from '../domain/log';
import { STORAGE_KEY, serializeLog } from '../domain/persistence';
import type { MatchLog } from '../domain/log';
import type { TeamId } from '../domain/types';
import { Victory } from './Victory';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ID = '00000000-0000-4000-8000-00000000000c';
const T0 = 1_700_000_000_000;

function games(log: MatchLog, team: TeamId, count: number, at: number): MatchLog {
  let next = log;
  for (let i = 0; i < count; i += 1) {
    next = appendEvent(next, { type: 'game/increment', team, at: at + i });
  }
  return next;
}

function save(log: MatchLog): void {
  localStorage.setItem(STORAGE_KEY, serializeLog(log));
}

describe('victory celebration', () => {
  beforeEach(() => {
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
  });

  it('shows a calm card without a confetti canvas when motion is reduced', () => {
    const html = renderToStaticMarkup(<Victory name="Team A" team="a" reducedMotion onClose={() => undefined} />);
    expect(html).toContain('Team A wins!');
    expect(html).toContain('is-calm');
    expect(html).toContain('Tap to close');
    expect(html).not.toContain('<canvas');
  });

  it('opens for two sets or a lead after End match, and keeps Undo available', () => {
    save(games(games(createLog(T0, ID), 'a', 6, T0 + 1), 'a', 6, T0 + 20));
    const won = renderToStaticMarkup(<App />);
    expect(won).toContain('data-testid="victory"');
    expect(won).toContain('Team A wins!');
    expect(won).toContain('<canvas');
    expect(won).toContain('data-testid="victory-lottie"');
    expect(won).toContain('data-testid="final-score"');
    expect(won).toContain('Final score');
    expect(won).toContain('>6<');
    const undo = won.match(/<button[^>]*data-testid="undo"[^>]*>/)?.[0] ?? '';
    expect(undo).not.toContain('disabled');
    expect(won.indexOf('data-testid="undo"')).toBeLessThan(won.indexOf('data-testid="victory"'));

    save(games(createLog(T0, ID), 'a', 6, T0 + 1));
    expect(renderToStaticMarkup(<App />)).not.toContain('data-testid="victory"');

    save(appendEvent(createLog(T0, ID), { type: 'match/end', at: T0 + 1 }));
    expect(renderToStaticMarkup(<App />)).not.toContain('data-testid="victory"');

    const split = appendEvent(games(games(createLog(T0, ID), 'a', 6, T0 + 1), 'b', 6, T0 + 20), {
      type: 'match/end',
      at: T0 + 40,
    });
    save(split);
    expect(renderToStaticMarkup(<App />)).not.toContain('data-testid="victory"');

    save(appendEvent(games(createLog(T0, ID), 'b', 6, T0 + 1), { type: 'match/end', at: T0 + 20 }));
    const endedWin = renderToStaticMarkup(<App />);
    expect(endedWin).toContain('Team B wins!');
    expect(endedWin).toContain('data-testid="final-score"');
    const endedUndo = endedWin.match(/<button[^>]*data-testid="undo"[^>]*>/)?.[0] ?? '';
    expect(endedUndo).not.toContain('disabled');

    const css = readFileSync(join(root, 'src/app.css'), 'utf8');
    const top = css.slice(css.indexOf('.top {'), css.indexOf('.top {') + 180);
    expect(top).toContain('z-index: 4');
    expect(css).toContain('.victory {');
    expect(css).toContain('z-index: 3');
    expect(css).toContain('.victory-canvas { display: none; }');
  });
});