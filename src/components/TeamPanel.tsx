import { canDecrement, canIncrement, displayGames, isUpcomingSet, serveChoice, setWinner, serverMark } from '../domain/rules';
import { useI18n } from '../i18n/I18n';
import { fill } from '../i18n/messages';
import type { MatchState, SetIndex, TeamId } from '../domain/types';
import { BallIcon, MinusIcon, PlusIcon } from './icons';
import { SetScore } from './SetScore';
import { SplitFlap } from './SplitFlap';
import { TeamName } from './TeamName';

interface TeamPanelProps {
  team: TeamId;
  state: MatchState;
  onIncrement: (team: TeamId) => void;
  onDecrement: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
  onSelectSet: (index: SetIndex) => void;
  onServe: (team: TeamId) => void;
}

const SETS: readonly SetIndex[] = [0, 1, 2];

export function TeamPanel({ team, state, onIncrement, onDecrement, onRename, onSelectSet, onServe }: TeamPanelProps) {
  const { t } = useI18n();
  const name = state.teams[team].name;
  const active = state.sets[state.activeSet];
  const locked = state.ended;
  const plusDisabled = locked || !canIncrement(active, team);
  const minusDisabled = locked || !canDecrement(active, team);
  const activeWinner = setWinner(active.a, active.b);
  const serving = state.serve?.team === team;
  const nextServe = serveChoice(state.serve, team);
  const serveLabel = nextServe
    ? fill(t.serveSet, { mark: serverMark(nextServe.team, nextServe.player), name })
    : fill(t.serveClear, { name });

  return (
    <section className={`team team-${team}`} aria-label={name}>
      <button
        type="button"
        className="step step-minus"
        data-testid={`decrement-${team}`}
        disabled={minusDisabled}
        aria-label={fill(t.decrement, { name })}
        onClick={() => onDecrement(team)}
      >
        <MinusIcon />
      </button>
      <div className="team-body">
        <div className="team-head">
          <TeamName name={name} locked={locked} label={t.teamName} onCommit={(next) => onRename(team, next)} />
          <button
            type="button"
            className={serving ? 'ball is-on' : 'ball'}
            data-testid={`serve-${team}`}
            aria-pressed={serving}
            aria-label={serveLabel}
            disabled={locked}
            onClick={() => onServe(team)}
          >
            <BallIcon />
          </button>
        </div>
        <div className={`current-set${activeWinner === team ? ' is-won' : ''}`} data-testid={`current-${team}`} aria-hidden="true">
          <SplitFlap value={displayGames(state, state.activeSet, team)} />
        </div>
        <div className="sets">
          {SETS.map((index) => {
            const score = state.sets[index];
            const winner = setWinner(score.a, score.b);
            return (
              <SetScore
                key={index}
                team={team}
                index={index}
                gamesLabel={displayGames(state, index, team)}
                active={state.activeSet === index}
                won={winner === team}
                upcoming={isUpcomingSet(state, index)}
                locked={locked}
                onSelect={() => onSelectSet(index)}
              />
            );
          })}
        </div>
      </div>
      <button
        type="button"
        className="step step-plus"
        data-testid={`increment-${team}`}
        disabled={plusDisabled}
        aria-label={fill(t.increment, { name })}
        onClick={() => onIncrement(team)}
      >
        <PlusIcon />
      </button>
    </section>
  );
}
