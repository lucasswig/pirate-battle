export type MatchResultType = 'VICTORY' | 'DEFEAT';
export type MatchEndReason = 'TIME_EXPIRED' | 'PLAYER_DESTROYED' | 'MANUAL_EXIT';
export type TilesetTheme = 'assets_1' | 'assets_2';

export interface MatchGameConfig {
  sessionDurationSeconds: number;
  enemySpawnIntervalSeconds: number;
  tilesetTheme?: TilesetTheme;
}

export interface RankingEntry {
  id: string;
  matchId?: string;
  playerId?: string;
  rank: number;
  captainName: string;
  shipName: string;
  score: number;
  durationSeconds?: number;
  shipsDestroyed: number;
  accuracyPercent: number;
  date: string;
  recordedAt?: string;
  endReason?: MatchEndReason;
  config?: MatchGameConfig;
}

export interface MatchRecord {
  id: string;
  matchId?: string;
  playerId?: string;
  captainName?: string;
  date: string;
  result: MatchResultType;
  score: number;
  durationSeconds: number;
  shipsDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  accuracyPercent: number;
  endReason?: MatchEndReason;
  config?: MatchGameConfig;
  recordedAt: string;
  synced: boolean;
}

export interface SubmitScorePayload {
  matchId?: string;
  playerId?: string;
  captainName: string;
  shipName?: string;
  score: number;
  durationSeconds?: number;
  shipsDestroyed: number;
  accuracyPercent: number;
  endReason?: MatchEndReason;
  config?: MatchGameConfig;
}

export interface RecordMatchPayload {
  matchId?: string;
  playerId?: string;
  captainName?: string;
  result: MatchResultType;
  score: number;
  durationSeconds: number;
  shipsDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  accuracyPercent: number;
  endReason?: MatchEndReason;
  config?: MatchGameConfig;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type MswNetworkScenario =
  | 'DEFAULT'
  | 'EMPTY'
  | 'SLOW'
  | 'OUT_OF_ORDER'
  | 'TIMEOUT'
  | 'ERROR_500'
  | 'ERROR_RANKING'
  | 'ERROR_HISTORY'
  | 'TIMEOUT_AFTER_RECORD'
  | 'OFFLINE';

export interface GameSettings {
  sessionDurationSeconds: number;
  enemySpawnIntervalSeconds: number;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  tilesetTheme: TilesetTheme;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
