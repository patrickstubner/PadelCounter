import { useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TeamPanel } from './components/TeamPanel';
import { matchWinner, RULES_SUMMARY } from './domain/rules';
import { useMatch } from './hooks/useMatch';
import { useWakeLock } from './useWakeLock';

export function App() {
  const match = useMatch();
  useWakeLock();
  const [confirming, setConfirming] = useState(false);
  const { state } = match;
  const winner = matchWinner(state.sets);
  const active = state.sets[state.activeSet];
  const live = winner
    ? `Sieg für ${state.teams[winner].name}.`
    : `Satz ${state.activeSet + 1}. ${state.teams.a.name} ${active.a}, ${state.teams.b.name} ${active.b}.`;

  return (
    <div className="app">
      <header className="top">
        <h1 className="brand">Padel Counter</h1>
        <button type="button" className="text-btn" data-testid="new-match" onClick={() => setConfirming(true)}>
          Neues Spiel
        </button>
      </header>
      <main className="board">
        <TeamPanel
          team="a"
          state={state}
          onIncrement={match.increment}
          onDecrement={match.decrement}
          onRename={match.rename}
          onSelectSet={match.selectSet}
        />
        <div className="mid" aria-hidden="true">
          {winner ? (
            <span className={`chip chip-${winner}`}>Sieg · {state.teams[winner].name}</span>
          ) : (
            <span className="chip">Satz {state.activeSet + 1}</span>
          )}
        </div>
        <TeamPanel
          team="b"
          state={state}
          onIncrement={match.increment}
          onDecrement={match.decrement}
          onRename={match.rename}
          onSelectSet={match.selectSet}
        />
      </main>
      <footer className="foot">
        {match.saveFailed ? <p className="save-note">Speichern auf diesem Gerät ist fehlgeschlagen.</p> : null}
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
