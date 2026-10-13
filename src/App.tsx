import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LanguageSwitch } from './components/LanguageSwitch';
import { TeamPanel } from './components/TeamPanel';
import { describeEvent, formatEventTime } from './domain/log';
import { isTiebreak, matchWinner, serverMark } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { I18nProvider, useI18n } from './i18n/I18n';
import { defaultNamesForLanguageSwitch, fill, localizedTeamName } from './i18n/messages';
import { useWakeLock } from './useWakeLock';

export function App() {
  return (
    <I18nProvider>
      <MatchApp />
    </I18nProvider>
  );
}

function MatchApp() {
  const { lang, t } = useI18n();
  const match = useMatch();
  useWakeLock();
  const [confirming, setConfirming] = useState<'reset' | 'end' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { state } = match;
  const winner = matchWinner(state.sets);
  const active = state.sets[state.activeSet];
  const recent = match.events.slice(-8).reverse();
  const nameA = state.teams.a.name;
  const nameB = state.teams.b.name;
  const retitleRef = useRef(match.retitleDefaults);
  retitleRef.current = match.retitleDefaults;
  useEffect(() => {
    const next = defaultNamesForLanguageSwitch(nameA, nameB, lang);
    if (!next) return;
    retitleRef.current(next);
  }, [lang, nameA, nameB]);
  const commitName = (team: 'a' | 'b', name: string) => {
    match.rename(team, localizedTeamName(lang, team, name));
  };

  const serve = state.serve
    ? fill(t.serveNamed, { mark: serverMark(state.serve.team, state.serve.player) })
    : t.serveOpen;
  const tiebreak = !isTiebreak(state)
    ? null
    : state.serve
      ? fill(t.tiebreakWho, { who: serverMark(state.serve.team, state.serve.player) })
      : t.tiebreak;
  const scoreLine = `${nameA} ${active.a}, ${nameB} ${active.b}`;
  const setLabel = fill(t.setLabel, { n: state.activeSet + 1 });
  const live = state.ended
    ? fill(t.liveEnded, { score: scoreLine })
    : winner
      ? fill(t.liveWin, { name: state.teams[winner].name, serve })
      : `${setLabel}. ${scoreLine}. ${serve}.${tiebreak ? ` ${tiebreak}.` : ''}`;

  return (
    <div className="app">
      <header className="top">
        <div className="brand-wrap">
          <h1 className="brand">Padel Counter</h1>
          <LanguageSwitch />
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="text-btn undo-btn"
            data-testid="undo"
            disabled={!match.canUndo}
            onClick={match.undo}
          >
            {t.undo}
          </button>
          <button
            type="button"
            className="text-btn"
            data-testid="history-toggle"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
          >
            {t.history}
          </button>
          {state.ended ? (
            <button type="button" className="text-btn undo-btn" data-testid="resume-match" onClick={match.resumeMatch}>
              {t.resume}
            </button>
          ) : (
            <button type="button" className="text-btn" data-testid="end-match" onClick={() => setConfirming('end')}>
              {t.endMatch}
            </button>
          )}
          <button type="button" className="text-btn" data-testid="new-match" onClick={() => setConfirming('reset')}>
            {t.newMatch}
          </button>
        </div>
      </header>
      <main className="board">
        <TeamPanel
          team="a"
          state={state}
          onIncrement={match.increment}
          onDecrement={match.decrement}
          onRename={commitName}
          onSelectSet={match.selectSet}
          onServe={match.chooseServe}
        />
        <div className="mid">
          {state.ended ? (
            <span className="chip chip-ended" data-testid="match-status">
              {t.ended}
            </span>
          ) : winner ? (
            <span className={`chip chip-${winner}`}>{fill(t.win, { name: state.teams[winner].name })}</span>
          ) : (
            <span className="chip chip-set" data-testid="active-set">
              {setLabel}
            </span>
          )}
          {state.ended ? (
            <p className="end-note" data-testid="final-score">
              {t.finalScore}
            </p>
          ) : null}
          <p className="serve-line" data-testid="serve-label">
            {serve}
          </p>
          {tiebreak ? (
            <p className="tb" data-testid="tiebreak-hint">
              {tiebreak}
            </p>
          ) : null}
        </div>
        <TeamPanel
          team="b"
          state={state}
          onIncrement={match.increment}
          onDecrement={match.decrement}
          onRename={commitName}
          onSelectSet={match.selectSet}
          onServe={match.chooseServe}
        />
      </main>
      <footer className="foot">
        {match.saveFailed ? <p className="save-note">{t.saveFailed}</p> : null}
        {historyOpen ? (
          recent.length > 0 ? (
            <ol className="history" data-testid="history-list">
              {recent.map((event, index) => (
                <li key={`${event.at}-${event.type}-${index}`}>
                  <time dateTime={new Date(event.at).toISOString()}>{formatEventTime(event.at, Date.now(), lang)}</time>{' '}
                  {describeEvent(event, lang)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="history-empty" data-testid="history-list">
              {t.historyEmpty}
            </p>
          )
        ) : null}
        <p className="rules">{t.rules}</p>
        <p className="app-version" data-testid="app-version">{`v${import.meta.env.APP_VERSION}`}</p>
      </footer>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      {confirming === 'reset' ? (
        <ConfirmDialog
          titleId="new-match-title"
          title={t.resetTitle}
          body={t.resetBody}
          confirmLabel={t.resetConfirm}
          cancelLabel={t.cancel}
          confirmTestId="confirm-reset"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            match.newMatch();
            setConfirming(null);
          }}
        />
      ) : null}
      {confirming === 'end' ? (
        <ConfirmDialog
          titleId="end-match-title"
          title={t.endTitle}
          body={t.endBody}
          confirmLabel={t.endConfirm}
          cancelLabel={t.cancel}
          confirmTestId="confirm-end"
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            match.endMatch();
            setConfirming(null);
          }}
        />
      ) : null}
    </div>
  );
}
