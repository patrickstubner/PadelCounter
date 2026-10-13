import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { describeEvent, formatEventTime } from '../domain/log';
import { HTML_LANG, LANGS, matchBrowserLang, readStoredLang, type Lang } from './locale';
import { defaultNamesForLanguageSwitch, defaultTeamNames, localizedTeamName, messages, type Messages } from './messages';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();
}

describe('translations', () => {
  it('gives every language the same keys and the same placeholders', () => {
    const keys = Object.keys(messages.de) as (keyof Messages)[];
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(messages[lang]).sort()).toEqual([...keys].sort());
      for (const key of keys) {
        const value = messages[lang][key];
        expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
        expect(placeholders(value), `${lang}.${key}`).toEqual(placeholders(messages.de[key]));
      }
    }
  });

  it('localizes the default team names', () => {
    expect(defaultTeamNames('de')).toEqual({ a: 'Team A', b: 'Team B' });
    expect(defaultTeamNames('en')).toEqual({ a: 'Team A', b: 'Team B' });
    expect(defaultTeamNames('es')).toEqual({ a: 'Equipo A', b: 'Equipo B' });
    expect(defaultTeamNames('pt')).toEqual({ a: 'Time A', b: 'Time B' });
  });

  it('uses a saved choice before the browser language, and German otherwise', () => {
    expect(readStoredLang({ getItem: () => 'pt' })).toBe('pt');
    expect(readStoredLang({ getItem: () => 'fr' })).toBeNull();
    expect(readStoredLang(null)).toBeNull();
    expect(localizedTeamName('es', 'a', '   ')).toBe('Equipo A');
    expect(localizedTeamName('pt', 'b', '\u0000')).toBe('Time B');
    expect(localizedTeamName('es', 'a', 'Team A')).toBe('Team A');
    expect(localizedTeamName('de', 'a', '')).toBe('Team A');
    expect(defaultNamesForLanguageSwitch('Team A', 'Team B', 'es')).toEqual({ a: 'Equipo A', b: 'Equipo B' });
    expect(defaultNamesForLanguageSwitch('Equipo A', 'Equipo B', 'pt')).toEqual({ a: 'Time A', b: 'Time B' });
    expect(defaultNamesForLanguageSwitch('Equipo A', 'Equipo B', 'es')).toBeNull();
    expect(defaultNamesForLanguageSwitch('Lobos', 'Team B', 'es')).toBeNull();
  });

  it('uses the browser language and falls back to German', () => {
    expect(matchBrowserLang(['pt-BR', 'en'])).toBe('pt');
    expect(matchBrowserLang(['es-MX'])).toBe('es');
    expect(matchBrowserLang(['en-GB'])).toBe('en');
    expect(matchBrowserLang(['de-AT'])).toBe('de');
    expect(matchBrowserLang(['fr', 'it'])).toBe('de');
    expect(matchBrowserLang([])).toBe('de');
  });

  it('translates history lines and localizes the date', () => {
    const event = { type: 'set/select', index: 2, at: 1 } as const;
    expect(describeEvent(event, 'de')).toBe('Satz 3');
    expect(describeEvent(event, 'en')).toBe('Set 3');
    expect(describeEvent(event, 'es')).toBe('Set 3');
    expect(describeEvent(event, 'pt')).toBe('Set 3');
    expect(describeEvent({ type: 'game/increment', team: 'a', at: 1 }, 'en')).toBe('Game for A');
    expect(describeEvent({ type: 'serve/set', team: null, player: null, at: 1 }, 'pt')).toBe('Saque aberto');

    const earlier = new Date(2026, 9, 12, 9, 1, 2).getTime();
    const now = new Date(2026, 9, 13, 18, 0, 0).getTime();
    const expected: Record<Lang, string> = {
      de: '12.10.2026 09:01:02',
      en: '10/12/2026 09:01:02',
      es: '12/10/2026 09:01:02',
      pt: '12/10/2026 09:01:02',
    };
    for (const lang of LANGS) {
      expect(formatEventTime(earlier, now, lang)).toBe(expected[lang]);
    }
  });

  it('matches each manifest description to its language', () => {
    const files: Record<Lang, string> = {
      de: 'manifest.webmanifest',
      en: 'manifest.en.webmanifest',
      es: 'manifest.es.webmanifest',
      pt: 'manifest.pt.webmanifest',
    };
    for (const lang of LANGS) {
      const manifest = JSON.parse(readFileSync(join(root, 'public', files[lang]), 'utf8')) as {
        description: string;
        lang: string;
      };
      expect(manifest.description).toBe(messages[lang].manifestDescription);
      expect(manifest.lang).toBe(HTML_LANG[lang]);
    }
  });
});
