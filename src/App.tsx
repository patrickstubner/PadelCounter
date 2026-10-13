import { useEffect, useRef, useState } from 'react';
import { detailHistoryState, matchesHistoryState, screenFromHistory, type ArchiveScreen } from './archiveNav';
import { ConfirmDialog } from './components/ConfirmDialog';
import { MatchArchive } from './components/MatchArchive';
import { TeamPanel } from './components/TeamPanel';
import { Victory } from './components/Victory';
import { listMatches } from './domain/archive';
import { describeEvent, formatEventTime } from './domain/log';
import { RULES_SUMMARY, celebrationStamp, celebrationWinner, matchWinner, serveLabel, tiebreakHint } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { useWakeLock } from './useWakeLock';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function App() {
  const match = useMatch();
  useWakeLock();
  const [confirming, setConfirming] = useState<'reset' | 'end' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [screen, setScreen] = useState<ArchiveScreen>(() =>
    typeof history === 'undefined' ? { view: 'court' } : screenFromHistory(history.state),
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = (event: PopStateEvent) => setScreen(screenFromHistory(event.state));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const matches = listMatches(match.log, match.archive);
  const selected = screen.view === 'detail' ? (matches.find((item) => item.id === screen.id) ?? null) : null;
  const openMatches = () => {
    if (typeof history === 'undefined') {
      setScreen({ view: 'matches' });
      return;
    }
    history.pushState(matchesHistoryState(), '');
    setScreen({ view: 'matches' });
  };
  const openDetail = (id: string) => {
    if (typeof history === 'undefined') {
      setScreen({ view: 'detail', id });
      return;
    }
    history.pushState(detailHistoryState(id), '');
    setScreen({ view: 'detail', id });
  };
  const closeArchive = () => {
    if (typeof history === 'undefined') {
      setScreen((current) => (current.view === 'detail' ? { view: 'matches' } : { view: 'court' }));
      return;
    }
    history.back();
  };
  const { state } = match;
  const winner = matchWinner(state.sets);
  const celebrated = celebrationWinner(state);
  const stamp = celebrationStamp(state);
  const reducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [wave, setWave] = useState(0);
  const previousStamp = useRef<string | null>(null);
  useEffect(() => {
    if (previousStamp.current && !stamp) setWave((value) => value + 1);
    previousStamp.current = stamp;
  }, [stamp]);
  const victoryKey = stamp === null ? null : `${stamp}#${wave}`;
  const showVictory = victoryKey !== null && dismissed !== victoryKey;
  const active = state.sets[state.activeSet];
  const tiebreak = tiebreakHint(state);
  const recent = match.events.slice(-8).reverse();
  const scoreLine = `${state.teams.a.name} ${active.a}, ${state.teams.b.name} ${active.b}`;
  const serve = serveLabel(state.serve);
  const showFinal = state.ended || winner !== null;
  const finalSets = state.sets.map((set, index) => `Set ${index + 1} ${set.a}–${set.b}`).join(', ');
  const live = showVictory && celebrated
    ? `${state.teams[celebrated].name} wins!`
    : showFinal && celebrated
      ? `Final score. ${state.teams[celebrated].name} wins. ${finalSets}.`
      : showFinal
        ? `Match ended. Final score. ${finalSets}.`
        : `Set ${state.activeSet + 1}. ${scoreLine}. ${serve}.${tiebreak ? ` ${tiebreak}.` : ''}`;

  return (
    <div className="app">
      <header className="top">
        <h1 className="brand">
          <button type="button" className="brand-btn" data-testid="open-matches" onClick={openMatches}>
            Padel Counter
          </button>
        </h1>
        <div className="top-actions">
          <button
            type="button"
            className="text-btn undo-btn"
            data-testid="undo"
            disabled={!match.canUndo}
            onClick={match.undo}
          >
            Undo
          </button>
          <button
            type="button"
            className="text-btn"
            data-testid="history-toggle"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
          >
            History
          </button>
          {state.ended ? (
            <button type="button" className="text-btn undo-btn" data-testid="resume-match" onClick={match.resumeMatch}>
              Resume
            </button>
          ) : (
            <button type="button" className="text-btn" data-testid="end-match" onClick={() => setConfirming('end')}>
              End match
            </button>
          )}
          <button type="button" className="text-btn" data-testid="new-match" onClick={() => setConfirming('reset')}>
            New match
          </button>
        </div>
      </header>
      {screen.view !== 'court' ? (
        <MatchArchive
          screen={screen.view}
          matches={matches}
          selected={selected}
          onOpen={openDetail}
          onBack={closeArchive}
        />
      ) : null}
      {showVictory && celebrated ? (
        <Victory
          name={state.teams[celebrated].name}
          team={celebrated}
          reducedMotion={reducedMotion}
          onClose={() => setDismissed(victoryKey)}
        />
      ) : null}
      <main className="board">
        <TeamPanel
          team="a"
          state={state}
          onIncrement={match.increment}
          onDecrement={match.decrement}
          onRename={match.rename}
          onSelectSet={match.selectSet}
          onServe={match.chooseServe}
        />
        <div className="mid">
          {state.ended ? (
            <span className="chip chip-ended" data-testid="match-status">
              Ended
            </span>
          ) : winner ? (
            <span className={`chip chip-${winner}`}>Win · {state.teams[winner].name}</span>
          ) : (
            <span className="chip chip-set" data-testid="active-set">{`Set ${state.activeSet + 1}`}</span>
          )}
          {showFinal ? (
            <p className="end-note" data-testid="final-score">
              Final score
            </p>
          ) : (
            <p className="serve-line" data-testid="serve-label">
              {serve}
            </p>
          )}
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
          onRename={match.rename}
          onSelectSet={match.selectSet}
          onServe={match.chooseServe}
        />
      </main>
      <footer className="foot">
        {match.saveFailed ? <p className="save-note">Saving on this device failed.</p> : null}
        {historyOpen ? (
          recent.length > 0 ? (
            <ol className="history" data-testid="history-list">
              {recent.map((event, index) => (
                <li key={`${event.at}-${event.type}-${index}`}>
                  <time dateTime={new Date(event.at).toISOString()}>{formatEventTime(event.at)}</time>{' '}
                  {describeEvent(event)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="history-empty" data-testid="history-list">
              No changes yet.
            </p>
          )
        ) : null}
        <p className="rules">{RULES_SUMMARY}</p>
        <p className="app-version" data-testid="app-version">{`v${import.meta.env.APP_VERSION}`}</p>
      </footer>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      {confirming === 'reset' ? (
        <ConfirmDialog
          titleId="new-match-title"
          title="New match?"
          body="The score is reset. The team names stay."
          confirmLabel="Reset"
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
          title="End match?"
          body="The final score stays. Plus, minus, sets, serve and names stay locked until the match resumes."
          confirmLabel="End"
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
