import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18n';
import { LANGS, LANG_CODE, type Lang } from '../i18n/locale';
import { languageName } from '../i18n/messages';

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className="lang" ref={root}>
      <button
        type="button"
        className="lang-btn"
        data-testid="lang-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.langMenu}
        onClick={() => setOpen((value) => !value)}
      >
        {LANG_CODE[lang]}
      </button>
      {open ? (
        <div className="lang-menu" role="menu" aria-label={t.langMenu}>
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={code === lang}
              data-testid={`lang-${code}`}
              className={code === lang ? 'lang-option is-current' : 'lang-option'}
              onClick={() => choose(code)}
            >
              {LANG_CODE[code]}
              <span className="sr-only">{languageName(t, code)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
