import { useEffect, useMemo, useReducer, useState } from 'react';
import { loadArchive, saveArchive } from '../domain/archive';
import { createMatchId } from '../domain/id';
import { createLog, replay } from '../domain/log';
import { loadLog, saveLog } from '../domain/persistence';
import { serveChoice } from '../domain/rules';
import { sessionReducer, type Session } from '../domain/session';
import type { MatchEvent, SetIndex, TeamId } from '../domain/types';

function initialSession(): Session {
  return {
    log: loadLog(localStorage) ?? createLog(Date.now(), createMatchId()),
    archive: loadArchive(localStorage),
  };
}

export function useMatch() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, initialSession);
  const [saveFailed, setSaveFailed] = useState(false);
  const { log } = session;
  const state = useMemo(() => replay(log), [log]);

  useEffect(() => {
    const logSaved = saveLog(log, localStorage);
    const archiveSaved = saveArchive(session.archive, localStorage);
    setSaveFailed(!logSaved || !archiveSaved);
  }, [log, session.archive]);

  const at = () => Date.now();
  const record = (event: MatchEvent) => dispatch({ type: 'record', event });

  return {
    state,
    log,
    archive: session.archive,
    events: log.events,
    saveFailed,
    canUndo: log.events.length > 0,
    increment: (team: TeamId) => record({ type: 'game/increment', team, at: at() }),
    decrement: (team: TeamId) => record({ type: 'game/decrement', team, at: at() }),
    rename: (team: TeamId, name: string) => record({ type: 'team/rename', team, name, at: at() }),
    selectSet: (index: SetIndex) => record({ type: 'set/select', index, at: at() }),
    newMatch: () => record({ type: 'match/new', matchId: createMatchId(), at: at() }),
    endMatch: () => record({ type: 'match/end', at: at() }),
    resumeMatch: () => record({ type: 'match/resume', at: at() }),
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
