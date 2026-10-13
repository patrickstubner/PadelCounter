import { rememberMatch, snapshotMatch, type ArchivedMatch } from './archive';
import { appendEvent, replay, undoLog, type LogAction, type MatchLog } from './log';

export interface Session {
  readonly log: MatchLog;
  readonly archive: readonly ArchivedMatch[];
}

export function sessionReducer(session: Session, action: LogAction): Session {
  if (action.type === 'undo') {
    const last = session.log.events[session.log.events.length - 1];
    const log = undoLog(session.log);
    if (last?.type !== 'match/reset') return { log, archive: session.archive };
    const restored = replay(log).matchId;
    return { log, archive: session.archive.filter((match) => match.id !== restored) };
  }

  if (action.event.type === 'match/reset') {
    const snap = snapshotMatch(session.log);
    const log = appendEvent(session.log, action.event);
    if (log === session.log) return session;
    return { log, archive: snap ? rememberMatch(session.archive, snap) : session.archive };
  }

  const log = appendEvent(session.log, action.event);
  if (log === session.log) return session;
  return { log, archive: session.archive };
}
