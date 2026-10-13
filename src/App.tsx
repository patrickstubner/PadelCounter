import { useEffect, useRef, useState } from 'react';
import { detailHistoryState, matchesHistoryState, screenFromHistory, type ArchiveScreen } from './archiveNav';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CourtHeader, type CourtAction } from './components/CourtHeader';
import { HistoryPage } from './components/HistoryPage';
import { TeamPanel } from './components/TeamPanel';
import { UpdateReady } from './components/UpdateReady';
import { Victory } from './components/Victory';
import { listMatches } from './domain/archive';
import { colonSetScore, currentHistory } from './domain/history';
import { RULES_SUMMARY, celebrationStamp, celebrationWinner, matchWinner, serveCourtLabel, servePickPrompt, tiebreakHint } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { watchControllerChange } from './registerServiceWorker';
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

function useUpdateReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    return watchControllerChange(navigator.serviceWorker, () => setReady(true));
  }, []);
  return ready;
}

export function App() {
  const match = useMatch();
  useWakeLock();
  const updateReady = useUpdateReady();
  const updateButton = updateReady ? <UpdateReady onReload={() => window.location.reload()} /> : null;
  const [confirming, setConfirming] = useState<'reset' | 'end' | null>(null);
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
  const pick = servePickPrompt(state);
  const scoreLine = `${state.teams.a.name} ${active.a}, ${state.teams.b.name} ${active.b}`;
  const serve = serveCourtLabel(state);
  const showFinal = state.ended || winner !== null;
  const finalSets = state.sets.map((set, index) => `Set ${index + 1} ${set.a}–${set.b}`).join(', ');
  const live = showVictory && celebrated
    ? `${state.teams[celebrated].name} wins!`
    : showFinal && celebrated
      ? `Final score. ${state.teams[celebrated].name} wins. ${finalSets}.`
      : showFinal
        ? `Match ended. Final score. ${finalSets}.`
        : `Set ${state.activeSet + 1}. ${scoreLine}. ${serve}.${pick ? ` ${pick}.` : ''}${tiebreak ? ` ${tiebreak}.` : ''}`;
  const historyRows = currentHistory(match.log);
  const played = matches.filter((item) => !item.live);

  if (screen.view !== 'court') {
    return (
      <div className="app">
        <HistoryPage
          mode={screen.view === 'detail' ? 'detail' : 'list'}
          live={{
            nameA: state.teams.a.name,
            nameB: state.teams.b.name,
            gameA: active.a,
            gameB: active.b,
            setsLabel: colonSetScore(state.sets),
            detail: showFinal ? 'Final' : `Set ${state.activeSet + 1}`,
          }}
          rows={historyRows}
          played={played}
          selected={selected}
          onOpen={openDetail}
          onBack={closeArchive}
        />
        <p className="app-version" data-testid="app-version">{`v${import.meta.env.APP_VERSION}`}</p>
        {updateButton}
      </div>
    );
  }

  const actions: readonly CourtAction[] = [
    { id: 'undo', label: 'Undo', testId: 'undo', disabled: !match.canUndo, emphasized: true, onSelect: match.undo },
    { id: 'history', label: 'History', testId: 'history-open', onSelect: openMatches },
    state.ended
      ? { id: 'resume', label: 'Resume', testId: 'resume-match', emphasized: true, onSelect: match.resumeMatch }
      : { id: 'end', label: 'End match', testId: 'end-match', onSelect: () => setConfirming('end') },
    { id: 'reset', label: 'New match', testId: 'new-match', onSelect: () => setConfirming('reset') },
  ];

  return (
    <div className="app">
      <CourtHeader setLabel={`Set ${state.activeSet + 1}`} onBrand={openMatches} actions={actions} />
      {showVictory && screen.view === 'court' && celebrated ? (
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
          ) : null}
          {showFinal ? (
            <p className="end-note" data-testid="final-score">
              Final score
            </p>
          ) : null}
          {tiebreak ? (
            <p className="tb" data-testid="tiebreak-hint">
              {tiebreak}
            </p>
          ) : null}
          {pick ? (
            <p className="serve-prompt" data-testid="serve-prompt">
              {pick}
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
        <p className="rules">{RULES_SUMMARY}</p>
        <p className="app-version" data-testid="app-version">{`v${import.meta.env.APP_VERSION}`}</p>
        {updateButton}
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
