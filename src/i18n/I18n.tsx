import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { PAGE_BASE } from '../base';
import { HTML_LANG, LANG_STORAGE_KEY, readLang, type Lang } from './locale';
import { messages, type Messages } from './messages';

interface I18nValue {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // The choice stays for this visit when storage is blocked.
    }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    document.querySelector('meta[name="description"]')?.setAttribute('content', messages[lang].metaDescription);
    const link = document.querySelector('link[rel="manifest"]');
    if (link instanceof HTMLLinkElement) {
      const file = lang === 'de' ? 'manifest.webmanifest' : `manifest.${lang}.webmanifest`;
      link.href = `${PAGE_BASE}/${file}`;
    }
  }, [lang]);

  const value = useMemo<I18nValue>(() => ({ lang, t: messages[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? { lang: 'de', t: messages.de, setLang: () => undefined };
}
