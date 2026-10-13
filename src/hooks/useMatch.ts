import { useEffect, useMemo, useReducer, useState } from 'react';
import { createMatchId } from '../domain/id';
import { createLog, logReducer, replay } from '../domain/log';
import { loadLog, saveLog } from '../domain/persistence';
import { serveChoice } from '../domain/rules';
import type { MatchEvent, SetIndex, TeamId } from '../domain/types';

function initialLog() {
  return loadLog(localStorage) ?? createLog(Date.now(), createMatchId());
}

export function useMatch() {
  const [log, dispatch] = useReducer(logReducer, undefined, initialLog);
  const [saveFailed, setSaveFailed] = useState(false);
  const state = useMemo(() => replay(log), [log]);

  useEffect(() => {
    setSaveFailed(!saveLog(log, localStorage));
  }, [log]);

  const at = () => Date.now();
  const record = (event: MatchEvent) => dispatch({ type: 'record', event });

  return {
    state,
    events: log.events,
    saveFailed,
    canUndo: log.events.length > 0,
    increment: (team: TeamId) => record({ type: 'game/increment', team, at: at() }),
    decrement: (team: TeamId) => record({ type: 'game/decrement', team, at: at() }),
    rename: (team: TeamId, name: string) => record({ type: 'team/rename', team, name, at: at() }),
    selectSet: (index: SetIndex) => record({ type: 'set/select', index, at: at() }),
    newMatch: () => record({ type: 'match/reset', matchId: createMatchId(), at: at() }),
    chooseServe: (team: TeamId) => {
      const next = serveChoice(state.serve, team);
      record({
        type: 'serve/set',
        team: next?.team ?? null,
        player: next?.player ?? null,
        at: at(),
      });
    },
    undo: () => dispatch({ type: 'undo' }),
  };
}
