import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TeamPanel } from './components/TeamPanel';
import { describeEvent } from './domain/log';
import { RULES_SUMMARY, matchWinner, serveLabel, tiebreakHint } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { useWakeLock } from './useWakeLock';

export function App() {
  const match = useMatch();
  useWakeLock();
  const [confirming, setConfirming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { state } = match;
  const winner = matchWinner(state.sets);
  const active = state.sets[state.activeSet];
  const tiebreak = tiebreakHint(state);
  const recent = match.events.slice(-8).reverse();
  const live = winner
    ? `Sieg für ${state.teams[winner].name}. ${serveLabel(state.serve)}.`
    : `Satz ${state.activeSet + 1}. ${state.teams.a.name} ${active.a}, ${state.teams.b.name} ${active.b}. ${serveLabel(state.serve)}.${tiebreak ? ` ${tiebreak}.` : ''}`;

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
          <button type="button" className="text-btn" data-testid="new-match" onClick={() => setConfirming(true)}>
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
          {winner ? (
            <span className={`chip chip-${winner}`}>Sieg · {state.teams[winner].name}</span>
          ) : (
            <span className="chip">Satz {state.activeSet + 1}</span>
          )}
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
                <li key={`${event.at}-${event.type}-${index}`}>{describeEvent(event)}</li>
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
      {confirming ? (
        <ConfirmDialog
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            match.newMatch();
            setConfirming(false);
          }}
        />
      ) : null}
    </div>
  );
}
