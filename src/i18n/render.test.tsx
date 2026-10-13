import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from '../App';
import { LANG_STORAGE_KEY } from './locale';

describe('translated app', () => {
  beforeAll(() => {
    const store = new Map<string, string>([[LANG_STORAGE_KEY, 'es']]);
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

  it('renders Spanish copy, labels, and default team names', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('>ES<');
    expect(html).toContain('Deshacer');
    expect(html).toContain('Partido nuevo');
    expect(html).toContain('Equipo A');
    expect(html).toContain('Equipo B');
    expect(html).toContain('aria-label="Set 1"');
    expect(html).toContain('aria-label="Idioma"');
    expect(html).toContain('Saque libre');
    expect(html).not.toContain('Neues Spiel');
    expect(html).not.toContain('Aufschlag');
  });
});
