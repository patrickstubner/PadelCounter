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
  const serve = serveLabel(state.serve);
  const live = state.ended
    ? `Match ended. Final score. ${scoreLine}.`
    : winner
      ? `Win for ${state.teams[winner].name}. ${serve}.`
      : `Set ${state.activeSet + 1}. ${scoreLine}. ${serve}.${tiebreak ? ` ${tiebreak}.` : ''}`;

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
          {state.ended ? (
            <p className="end-note" data-testid="final-score">
              Final score
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
