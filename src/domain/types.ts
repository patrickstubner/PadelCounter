export const SCHEMA_VERSION = 2 as const;

export type TeamId = 'a' | 'b';

export type PlayerSlot = 1 | 2;

export type SetIndex = 0 | 1 | 2;

/** Who serves the game that has not been scored yet. `null` means unknown. */
export interface Server {
  readonly team: TeamId;
  readonly player: PlayerSlot;
}

export interface SetScore {
  readonly a: number;
  readonly b: number;
}

/**
 * Pure match snapshot. A later live view can store the same object and
 * append {@link MatchEvent}s (matchId, revision, timestamps) without
 * changing this shape. No network sync is implemented.
 */
export interface MatchState {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly matchId: string;
  readonly revision: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly teams: {
    readonly a: { readonly name: string };
    readonly b: { readonly name: string };
  };
  readonly sets: readonly [SetScore, SetScore, SetScore];
  readonly activeSet: SetIndex;
  readonly serve: Server | null;
  /** True after End match until resume, undo, or a new match. */
  readonly ended: boolean;
}

export type MatchEvent =
  | { readonly type: 'game/increment'; readonly team: TeamId; readonly at: number }
  | { readonly type: 'game/decrement'; readonly team: TeamId; readonly at: number }
  | { readonly type: 'set/select'; readonly index: SetIndex; readonly at: number }
  | { readonly type: 'team/rename'; readonly team: TeamId; readonly name: string; readonly at: number }
  | { readonly type: 'match/reset'; readonly matchId: string; readonly at: number }
  | {
      readonly type: 'serve/set';
      readonly team: TeamId | null;
      readonly player: PlayerSlot | null;
      readonly at: number;
    }
  | { readonly type: 'match/end'; readonly at: number }
  | { readonly type: 'match/resume'; readonly at: number };

export function isTeamId(value: unknown): value is TeamId {
  return value === 'a' || value === 'b';
}

export function isSetIndex(value: unknown): value is SetIndex {
  return value === 0 || value === 1 || value === 2;
}

export function isPlayerSlot(value: unknown): value is PlayerSlot {
  return value === 1 || value === 2;
}

export function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value < 10_000_000_000_000;
}
