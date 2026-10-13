import { canDecrement, canIncrement, displayGames, isUpcomingSet, setWinner } from '../domain/rules';
import type { MatchState, SetIndex, TeamId } from '../domain/types';
import { MinusIcon, PlusIcon } from './icons';
import { SetScore } from './SetScore';
import { TeamName } from './TeamName';

interface TeamPanelProps {
  team: TeamId;
  state: MatchState;
  onIncrement: (team: TeamId) => void;
  onDecrement: (team: TeamId) => void;
  onRename: (team: TeamId, name: string) => void;
  onSelectSet: (index: SetIndex) => void;
}

const SETS: readonly SetIndex[] = [0, 1, 2];

export function TeamPanel({ team, state, onIncrement, onDecrement, onRename, onSelectSet }: TeamPanelProps) {
  const name = state.teams[team].name;
  const active = state.sets[state.activeSet];
  const plusDisabled = !canIncrement(active, team);
  const minusDisabled = !canDecrement(active, team);

  return (
    <section className={`team team-${team}`} aria-label={name}>
      <button
        type="button"
        className="step step-minus"
        data-testid={`decrement-${team}`}
        disabled={minusDisabled}
        aria-label={`${name}: ein Game abziehen`}
        onClick={() => onDecrement(team)}
      >
        <MinusIcon />
      </button>
      <div className="team-body">
        <TeamName name={name} onCommit={(next) => onRename(team, next)} />
        <div className="sets">
          {SETS.map((index) => {
            const score = state.sets[index];
            const winner = setWinner(score.a, score.b);
            return (
              <SetScore
                key={index}
                index={index}
                gamesLabel={displayGames(state, index, team)}
                active={state.activeSet === index}
                won={winner === team}
                upcoming={isUpcomingSet(state, index)}
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
        aria-label={`${name}: ein Game hinzufügen`}
        onClick={() => onIncrement(team)}
      >
        <PlusIcon />
      </button>
    </section>
  );
}
