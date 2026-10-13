import { useEffect, useRef } from 'react';
import { describeEvent, formatEventTime, formatMatchStamp } from '../domain/log';
import { winnerTeam, type ListedMatch } from '../domain/archive';

interface MatchArchiveProps {
  screen: 'matches' | 'detail';
  matches: readonly ListedMatch[];
  selected: ListedMatch | null;
  onOpen: (id: string) => void;
  onBack: () => void;
}

export function MatchArchive({ screen, matches, selected, onOpen, onBack }: MatchArchiveProps) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus();
  }, [screen, selected?.id]);

  const title = screen === 'detail' ? (selected ? `${selected.nameA} · ${selected.nameB}` : 'Match') : 'Matches';

  return (
    <section className="archive" data-testid="archive" aria-label={title}>
      <div className="archive-bar">
        <h2 className="archive-title">{title}</h2>
        <button type="button" className="archive-back" data-testid="archive-back" ref={backRef} onClick={onBack}>
          Back
        </button>
      </div>
      {screen === 'matches' ? (
        <ol className="archive-list" data-testid="match-list">
          {matches.map((match) => {
            const winner = winnerTeam(match.statusKind);
            return (
              <li key={match.id}>
                <button type="button" className="match-row" data-testid="match-row" onClick={() => onOpen(match.id)}>
                  <time dateTime={new Date(match.at).toISOString()}>{formatMatchStamp(match.at)}</time>
                  <span className="match-names">{`${match.nameA} · ${match.nameB}`}</span>
                  <span className="match-score">{match.score}</span>
                  <span className={winner ? `match-status match-status-${winner}` : 'match-status'}>{match.status}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : selected ? (
        <div className="archive-detail" data-testid="match-detail">
          <p className="match-score">{selected.score}</p>
          <p className="match-status">{selected.status}</p>
          {selected.events.length > 0 ? (
            <ol className="archive-events" data-testid="match-events">
              {selected.events.map((event, index) => (
                <li key={`${event.at}-${event.type}-${index}`}>
                  <time dateTime={new Date(event.at).toISOString()}>{formatEventTime(event.at)}</time>{' '}
                  {describeEvent(event)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="history-empty" data-testid="match-events">
              No changes yet.
            </p>
          )}
        </div>
      ) : (
        <p className="history-empty" data-testid="match-missing">
          Match not found.
        </p>
      )}
    </section>
  );
}
