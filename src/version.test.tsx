import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from './App';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };
  return pkg.version;
}

describe('app version', () => {
  beforeAll(() => {
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
        clear: () => {
          store.clear();
        },
      },
    });
  });

  it('shows the package.json version without taking space from the board', () => {
    const version = packageVersion();
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain(`class="app-version"`);
    expect(html).toContain(`>v${version}<`);
    const menu = html.slice(html.indexOf('class="match-menu"'), html.indexOf('class="board"'));
    expect(menu).toContain('data-testid="menu-version"');
    expect(menu).toContain(`>Version ${version}<`);
    expect(menu.indexOf('data-testid="new-match"')).toBeLessThan(menu.indexOf('data-testid="menu-version"'));
    expect(html).toContain('>Undo<');
    expect(html).toContain('Team A');
    expect(html).toContain('Team B');
    expect(html).toContain('aria-label="Set 1"');
    expect(html).not.toContain('lang-toggle');
    expect(html).not.toContain('Rückgängig');
    expect(import.meta.env.APP_VERSION).toBe(version);

    const rsbuild = readFileSync(join(root, 'rsbuild.config.ts'), 'utf8');
    expect(rsbuild).toContain('import.meta.env.APP_VERSION');
    expect(rsbuild).toContain("new URL('./package.json', import.meta.url)");

    const css = readFileSync(join(root, 'src/app.css'), 'utf8');
    const rule = css.slice(css.indexOf('.app-version {'));
    expect(rule.startsWith('.app-version {')).toBe(true);
    expect(rule.slice(0, rule.indexOf('}'))).toContain('position: absolute');
  });

  it('shows the build version at the bottom of the hamburger menu', () => {
    const version = packageVersion();
    const html = renderToStaticMarkup(<App />);
    const menu = html.slice(html.indexOf('class="match-menu"'), html.indexOf('class="board"'));
    expect(import.meta.env.APP_VERSION).toBe(version);
    expect(menu).toContain(`>Version ${version}<`);
    expect(menu.indexOf('data-testid="new-match"')).toBeLessThan(menu.indexOf('data-testid="menu-version"'));
    const css = readFileSync(join(root, 'src/app.css'), 'utf8');
    const rule = css.slice(css.indexOf('.menu-version {'), css.indexOf('.menu-item:disabled'));
    expect(rule).toContain('font-size: 0.62rem');
    expect(rule).toContain('color: #8b93a7');
    const board = css.slice(css.indexOf('.board {'), css.indexOf('.team {'));
    expect(board).not.toContain('menu-version');
  });
});
