import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { CourtHeader, type CourtAction } from './CourtHeader';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const actions: readonly CourtAction[] = [
  { id: 'undo', label: 'Undo', testId: 'undo', disabled: true, emphasized: true, onSelect: () => undefined },
  { id: 'history', label: 'History', testId: 'history-open', onSelect: () => undefined },
  { id: 'end', label: 'End match', testId: 'end-match', onSelect: () => undefined },
  { id: 'reset', label: 'New match', testId: 'new-match', onSelect: () => undefined },
];

describe('court header', () => {
  it('puts the set name in the header and keeps the menu closed', () => {
    const html = renderToStaticMarkup(<CourtHeader setLabel="Set 2" onBrand={() => undefined} actions={actions} layout="menu" />);
    expect(html).toContain('>Padel Counter<');
    expect(html).toContain('data-testid="active-set"');
    expect(html).toContain('>Set 2<');
    expect(html).toContain('aria-label="Menu"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="');
    expect(html).toContain('role="menu"');
    expect(html).toContain('role="menuitem"');
    expect(html).toContain('hidden=""');
    const toggle = html.match(/<button[^>]*data-testid="menu-toggle"[^>]*>/)?.[0] ?? '';
    const controls = toggle.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`id="${controls}"`);
    expect(html.indexOf('data-testid="active-set"')).toBeLessThan(html.indexOf('data-testid="menu-toggle"'));
  });

  it('uses one row of buttons when the landscape bar fits', () => {
    const html = renderToStaticMarkup(<CourtHeader setLabel="Set 1" onBrand={() => undefined} actions={actions} layout="bar" />);
    expect(html).not.toContain('data-testid="menu-toggle"');
    expect(html).toContain('data-testid="undo"');
    expect(html).toContain('data-testid="end-match"');
    expect(html).not.toContain('role="menu"');
  });

  it('gives menu rows at least 56px and tightens the title', () => {
    const css = readFileSync(join(root, 'src/app.css'), 'utf8');
    const item = css.slice(css.indexOf('.menu-item {'), css.indexOf('.menu-item.is-emphasis'));
    expect(item).toContain('min-height: 56px');
    const menu = css.slice(css.indexOf('.match-menu {'), css.indexOf('.match-menu[hidden]'));
    expect(menu).toContain('position: absolute');
    expect(menu).toContain('gap: 0.5rem');
    const brand = css.slice(css.indexOf('.brand {'), css.indexOf('.brand-btn'));
    expect(brand).toContain('letter-spacing: 0.08em');
    expect(brand).not.toContain('letter-spacing: 0.16em');
  });
});

describe('court header in the app', () => {
  it('moves Set 1 out from between the teams', () => {
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
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('data-testid="active-set">Set 1<');
    expect(html).not.toContain('chip-set');
    expect(html).toContain('data-testid="menu-toggle"');
    expect(html).toContain('aria-expanded="false"');
    const mid = html.slice(html.indexOf('class="mid"'), html.indexOf('class="team team-b"'));
    expect(mid).not.toContain('Set 1');
  });
});
