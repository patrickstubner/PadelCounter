import { createMatchId, isUuid } from './id';
import { sanitizeTeamName } from './names';
import { gamesPlayed, isPlausibleSetScore, matchWinner, rotateServe, setWinner } from './rules';
import { SCHEMA_VERSION, isPlayerSlot, isSetIndex, isTeamId, isTimestamp, type MatchEvent, type MatchState, type Server, type SetIndex, type SetScore, type TeamId } from './types';

export function createMatch(
  at: number,
  matchId: string = createMatchId(),
  names?: { readonly a?: string; readonly b?: string },
): MatchState {
  return {
    schemaVersion: SCHEMA_VERSION,
    matchId,
    revision: 0,
    createdAt: at,
    updatedAt: at,
    teams: {
      a: { name: sanitizeTeamName(names?.a ?? '', 'a') },
      b: { name: sanitizeTeamName(names?.b ?? '', 'b') },
    },
    sets: [
      { a: 0, b: 0 },
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ],
    activeSet: 0,
    serve: null,
    servePrompt: false,
    ended: false,
  };
}

function stamp(
  state: MatchState,
  at: number,
  patch: Pick<MatchState, 'sets' | 'activeSet' | 'teams'> & {
    readonly serve?: Server | null;
    readonly servePrompt?: boolean;
    readonly ended?: boolean;
  },
): MatchState {
  return {
    ...state,
    ...patch,
    serve: patch.serve === undefined ? state.serve : patch.serve,
    servePrompt: patch.servePrompt === undefined ? state.servePrompt : patch.servePrompt,
    ended: patch.ended === undefined ? state.ended : patch.ended,
    revision: state.revision + 1,
    updatedAt: Math.max(state.updatedAt, at),
  };
}

function replaceSet(state: MatchState, index: SetIndex, score: SetScore): MatchState['sets'] {
  const sets: [SetScore, SetScore, SetScore] = [
    state.sets[0],
    state.sets[1],
    state.sets[2],
  ];
  sets[index] = score;
  return sets;
}

function nextSetIndex(index: SetIndex): SetIndex {
  if (index === 0) return 1;
  return 2;
}

function applyGame(state: MatchState, team: TeamId, at: number, delta: 1 | -1): MatchState {
  const index = state.activeSet;
  const current = state.sets[index];
  const nextScore: SetScore = {
    a: team === 'a' ? current.a + delta : current.a,
    b: team === 'b' ? current.b + delta : current.b,
  };
  if (!isPlausibleSetScore(nextScore.a, nextScore.b)) return state;

  const wasWon = setWinner(current.a, current.b) !== null;
  const sets = replaceSet(state, index, nextScore);
  let activeSet = index;
  const nowWon = setWinner(nextScore.a, nextScore.b) !== null;
  if (!wasWon && nowWon && index < 2 && matchWinner(sets) === null) {
    const later = index === 0 ? [sets[1], sets[2]] : [sets[2]];
    const restEmpty = later.every((set) => set.a === 0 && set.b === 0);
    if (restEmpty) activeSet = nextSetIndex(index);
  }

  const tiebreakGame = delta === 1 && current.a === 6 && current.b === 6 && state.serve !== null;
  return stamp(state, at, {
    sets,
    activeSet,
    teams: state.teams,
    serve: tiebreakGame ? null : rotateServe(state.serve, gamesPlayed(state.sets), delta),
    servePrompt: tiebreakGame ? true : state.servePrompt,
  });
}

export function matchReducer(state: MatchState, event: MatchEvent): MatchState {
  if (!isTimestamp(event.at)) return state;
  if (state.ended && event.type !== 'match/resume' && event.type !== 'match/reset') return state;

  switch (event.type) {
    case 'game/increment':
      if (!isTeamId(event.team)) return state;
      return applyGame(state, event.team, event.at, 1);
    case 'game/decrement':
      if (!isTeamId(event.team)) return state;
      return applyGame(state, event.team, event.at, -1);
    case 'set/select':
      if (!isSetIndex(event.index) || event.index === state.activeSet) return state;
      return stamp(state, event.at, {
        sets: state.sets,
        activeSet: event.index,
        teams: state.teams,
        serve: null,
        servePrompt: state.serve === null ? state.servePrompt : true,
      });
    case 'team/rename': {
      if (!isTeamId(event.team) || typeof event.name !== 'string') return state;
      const name = sanitizeTeamName(event.name, event.team);
      if (name === state.teams[event.team].name) return state;
      const teams =
        event.team === 'a'
          ? { a: { name }, b: state.teams.b }
          : { a: state.teams.a, b: { name } };
      return stamp(state, event.at, { sets: state.sets, activeSet: state.activeSet, teams });
    }
    case 'match/reset': {
      if (!isUuid(event.matchId)) return state;
      return createMatch(event.at, event.matchId.toLowerCase(), {
        a: state.teams.a.name,
        b: state.teams.b.name,
      });
    }
    case 'match/end':
      return stamp(state, event.at, {
        sets: state.sets,
        activeSet: state.activeSet,
        teams: state.teams,
        ended: true,
      });
    case 'match/resume':
      if (!state.ended) return state;
      return stamp(state, event.at, {
        sets: state.sets,
        activeSet: state.activeSet,
        teams: state.teams,
        ended: false,
      });
    case 'serve/set': {
      if (event.team === null || event.player === null) {
        if (event.team !== null || event.player !== null) return state;
        if (state.serve === null && !state.servePrompt) return state;
        return stamp(state, event.at, {
          sets: state.sets,
          activeSet: state.activeSet,
          teams: state.teams,
          serve: null,
          servePrompt: false,
        });
      }
      if (!isTeamId(event.team) || !isPlayerSlot(event.player)) return state;
      if (state.serve?.team === event.team && state.serve.player === event.player && !state.servePrompt) return state;
      return stamp(state, event.at, {
        sets: state.sets,
        activeSet: state.activeSet,
        teams: state.teams,
        serve: { team: event.team, player: event.player },
        servePrompt: false,
      });
    }
    default:
      return state;
  }
}
