import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TeamPanel } from './components/TeamPanel';
import { describeEvent, formatEventTime } from './domain/log';
import { RULES_SUMMARY, matchWinner, serveLabel, tiebreakHint } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { useWakeLock } from './useWakeLock';

export function App() {
  const match = useMatch();
  useWakeLock();
  const [confirming, setConfirming] = useState<'reset' | 'end' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { state } = match;
  const winner = matchWinner(state.sets);
  const active = state.sets[state.activeSet];
  const tiebreak = tiebreakHint(state);
  const recent = match.events.slice(-8).reverse();
  const scoreLine = `${state.teams.a.name} ${active.a}, ${state.teams.b.name} ${active.b}`;
  const live = state.ended
    ? `Spiel beendet. Endstand. ${scoreLine}.`
    : winner
      ? `Sieg für ${state.teams[winner].name}. ${serveLabel(state.serve)}.`
      : `Satz ${state.activeSet + 1}. ${scoreLine}. ${serveLabel(state.serve)}.${tiebreak ? ` ${tiebreak}.` : ''}`;

  return (
    <div className="app">
      <header className="top">
        <h1 className="brand">Padel Counter</h1>
        <div className="top-actions">
          <button
            type="button"
            className="text-btn undo-btn"
            data-testid="undo"
            disabled={!match.canUndo}
            onClick={match.undo}
          >
            Rückgängig
          </button>
          <button
            type="button"
            className="text-btn"
            data-testid="history-toggle"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
          >
            Verlauf
          </button>
          {state.ended ? (
            <button type="button" className="text-btn undo-btn" data-testid="resume-match" onClick={match.resumeMatch}>
              Fortsetzen
            </button>
          ) : (
            <button type="button" className="text-btn" data-testid="end-match" onClick={() => setConfirming('end')}>
              Spiel beenden
            </button>
          )}
          <button type="button" className="text-btn" data-testid="new-match" onClick={() => setConfirming('reset')}>
            Neues Spiel
          </button>
        </div>
      </header>
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
              Beendet
            </span>
          ) : winner ? (
            <span className={`chip chip-${winner}`}>Sieg · {state.teams[winner].name}</span>
          ) : (
            <span className="chip">Satz {state.activeSet + 1}</span>
          )}
          {state.ended ? (
            <p className="end-note" data-testid="final-score">
              Endstand
            </p>
          ) : null}
          <p className="serve-line" data-testid="serve-label">
            {serveLabel(state.serve)}
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
          onRename={match.rename}
          onSelectSet={match.selectSet}
          onServe={match.chooseServe}
        />
      </main>
      <footer className="foot">
        {match.saveFailed ? <p className="save-note">Speichern auf diesem Gerät ist fehlgeschlagen.</p> : null}
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
              Noch keine Änderungen.
            </p>
          )
        ) : null}
        <p className="rules">{RULES_SUMMARY}</p>
      </footer>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      {confirming === 'reset' ? (
        <ConfirmDialog
          titleId="new-match-title"
          title="Neues Spiel?"
          body="Der Spielstand wird zurückgesetzt. Die Teamnamen bleiben erhalten."
          confirmLabel="Zurücksetzen"
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
          title="Spiel beenden?"
          body="Der Endstand bleibt stehen. Plus, Minus, Aufschlag und Namen sind gesperrt, bis das Spiel fortgesetzt wird."
          confirmLabel="Beenden"
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
