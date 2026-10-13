import { useEffect, useReducer, useState } from 'react';
import { createMatchId } from '../domain/id';
import { loadMatch, saveMatch } from '../domain/persistence';
import { createMatch, matchReducer } from '../domain/reducer';
import type { SetIndex, TeamId } from '../domain/types';

function initialMatch() {
  return loadMatch(localStorage) ?? createMatch(Date.now(), createMatchId());
}

export function useMatch() {
  const [state, dispatch] = useReducer(matchReducer, undefined, initialMatch);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveMatch(state, localStorage));
  }, [state]);

  const at = () => Date.now();

  return {
    state,
    saveFailed,
    increment: (team: TeamId) => dispatch({ type: 'game/increment', team, at: at() }),
    decrement: (team: TeamId) => dispatch({ type: 'game/decrement', team, at: at() }),
    rename: (team: TeamId, name: string) => dispatch({ type: 'team/rename', team, name, at: at() }),
    selectSet: (index: SetIndex) => dispatch({ type: 'set/select', index, at: at() }),
    newMatch: () => dispatch({ type: 'match/reset', matchId: createMatchId(), at: at() }),
  };
}
