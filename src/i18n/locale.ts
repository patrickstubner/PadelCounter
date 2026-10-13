export const LANGS = ['de', 'en', 'es', 'pt'] as const;

export type Lang = (typeof LANGS)[number];

export const HTML_LANG: Readonly<Record<Lang, string>> = {
  de: 'de',
  en: 'en',
  es: 'es',
  pt: 'pt-BR',
};

export const INTL_LOCALE: Readonly<Record<Lang, string>> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

export const LANG_CODE: Readonly<Record<Lang, string>> = {
  de: 'DE',
  en: 'EN',
  es: 'ES',
  pt: 'PT',
};

export const LANG_STORAGE_KEY = 'padel-counter.lang';

export function isLang(value: unknown): value is Lang {
  return value === 'de' || value === 'en' || value === 'es' || value === 'pt';
}

/** First matching browser tag. Anything else, including an empty list, is German. */
export function matchBrowserLang(languages: readonly string[]): Lang {
  for (const raw of languages) {
    const tag = raw.toLowerCase();
    if (tag.startsWith('de')) return 'de';
    if (tag.startsWith('en')) return 'en';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('pt')) return 'pt';
  }
  return 'de';
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  if (navigator.languages && navigator.languages.length > 0) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

export function readStoredLang(storage: { getItem(key: string): string | null } | null): Lang | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(LANG_STORAGE_KEY);
    return isLang(value) ? value : null;
  } catch {
    return null;
  }
}

export function readLang(): Lang {
  const storage = typeof localStorage === 'undefined' ? null : localStorage;
  return readStoredLang(storage) ?? matchBrowserLang(browserLanguages());
}
