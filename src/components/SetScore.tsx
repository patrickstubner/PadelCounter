import { SplitFlap } from './SplitFlap';

interface SetScoreProps {
  index: number;
  gamesLabel: string;
  active: boolean;
  won: boolean;
  upcoming: boolean;
  locked: boolean;
  onSelect: () => void;
}

export function SetScore({ index, gamesLabel, active, won, upcoming, locked, onSelect }: SetScoreProps) {
  const classes = [
    'set',
    active ? 'is-active' : '',
    won ? 'is-won' : '',
    upcoming ? 'is-upcoming' : '',
    !active && !upcoming ? 'is-played' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const status = active ? 'laufend' : won ? 'gewonnen' : upcoming ? 'offen' : 'gespielt';

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={active}
      disabled={locked}
      aria-label={`Satz ${index + 1}, ${gamesLabel === '–' ? 'noch kein Game' : `${gamesLabel} Games`}, ${status}. Zum Korrigieren auswählen.`}
      onClick={onSelect}
    >
      <span className="set-label" aria-hidden="true">
        {index + 1}
      </span>
      <SplitFlap value={gamesLabel} />
      <span className="marker" aria-hidden="true" />
    </button>
  );
}
