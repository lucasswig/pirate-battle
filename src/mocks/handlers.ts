import { http, HttpResponse, delay } from 'msw';
import {
  ApiResponse,
  GameSettings,
  MatchRecord,
  PaginatedResponse,
  RankingEntry,
  RecordMatchPayload,
  SubmitScorePayload,
} from '../api/types';
import { loadGameSettings, saveGameSettings } from '../services/settingsStorage';
import { getStoredScenario, resetStoredScenario } from './scenarioState';

const RANKING_STORAGE_KEY = 'pirate_battle_ranking';
const MATCHES_STORAGE_KEY = 'pirate_battle_matches';
const OFFLINE_QUEUE_KEY = 'pirate_offline_matches';

const DEFAULT_CONFIG_120 = {
  sessionDurationSeconds: 120,
  enemySpawnIntervalSeconds: 3,
  tilesetTheme: 'assets_1' as const,
};

export const SEED_RANKING: RankingEntry[] = [
  { id: 'rank_1', matchId: 'seed_m1', playerId: 'bot_flint', rank: 1, captainName: 'Captain Flint', shipName: 'Walrus', score: 38, durationSeconds: 120, shipsDestroyed: 12, accuracyPercent: 92, date: '08 SEP · 21:42', recordedAt: '2026-09-08T21:42:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_2', matchId: 'seed_m2', playerId: 'bot_sparrow', rank: 2, captainName: 'Red Sparrow', shipName: 'Crimson Tide', score: 32, durationSeconds: 118, shipsDestroyed: 10, accuracyPercent: 88, date: '08 SEP · 20:18', recordedAt: '2026-09-08T20:18:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_3', matchId: 'seed_m3', playerId: 'bot_jack', rank: 3, captainName: 'Captain Jack', shipName: 'The Black Pearl', score: 24, durationSeconds: 120, shipsDestroyed: 8, accuracyPercent: 81, date: '08 SEP · 19:36', recordedAt: '2026-09-08T19:36:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_4', matchId: 'seed_m4', playerId: 'bot_storm', rank: 4, captainName: 'Storm Rider', shipName: 'Tempest', score: 21, durationSeconds: 115, shipsDestroyed: 7, accuracyPercent: 78, date: '08 SEP · 18:50', recordedAt: '2026-09-08T18:50:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_5', matchId: 'seed_m5', playerId: 'bot_wolf', rank: 5, captainName: 'Sea Wolf', shipName: 'Ocean Marauder', score: 19, durationSeconds: 110, shipsDestroyed: 6, accuracyPercent: 74, date: '08 SEP · 18:24', recordedAt: '2026-09-08T18:24:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_6', matchId: 'seed_m6', playerId: 'bot_teach', rank: 6, captainName: 'Edward Teach (Blackbeard)', shipName: "Queen Anne's Revenge", score: 18, durationSeconds: 120, shipsDestroyed: 6, accuracyPercent: 72, date: '07 SEP · 22:15', recordedAt: '2026-09-07T22:15:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_7', matchId: 'seed_m7', playerId: 'bot_bonny', rank: 7, captainName: 'Anne Bonny', shipName: 'William', score: 15, durationSeconds: 104, shipsDestroyed: 5, accuracyPercent: 70, date: '07 SEP · 19:40', recordedAt: '2026-09-07T19:40:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_8', matchId: 'seed_m8', playerId: 'bot_roberts', rank: 8, captainName: 'Bartholomew Roberts (Black Bart)', shipName: 'Royal Rover', score: 14, durationSeconds: 98, shipsDestroyed: 5, accuracyPercent: 68, date: '07 SEP · 17:30', recordedAt: '2026-09-07T17:30:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_9', matchId: 'seed_m9', playerId: 'bot_calico', rank: 9, captainName: 'Calico Jack Rackham', shipName: 'Kingston', score: 12, durationSeconds: 95, shipsDestroyed: 4, accuracyPercent: 65, date: '06 SEP · 15:10', recordedAt: '2026-09-06T15:10:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_10', matchId: 'seed_m10', playerId: 'bot_read', rank: 10, captainName: 'Mary Read', shipName: 'Fortune', score: 10, durationSeconds: 88, shipsDestroyed: 3, accuracyPercent: 63, date: '06 SEP · 12:05', recordedAt: '2026-09-06T12:05:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_11', matchId: 'seed_m11', playerId: 'bot_morgan', rank: 11, captainName: 'Henry Morgan', shipName: 'Satisfaction', score: 8, durationSeconds: 80, shipsDestroyed: 3, accuracyPercent: 60, date: '05 SEP · 18:20', recordedAt: '2026-09-05T18:20:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_12', matchId: 'seed_m12', playerId: 'bot_bellamy', rank: 12, captainName: 'Samuel Bellamy', shipName: 'Whydah', score: 7, durationSeconds: 72, shipsDestroyed: 2, accuracyPercent: 58, date: '05 SEP · 14:45', recordedAt: '2026-09-05T14:45:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_13', matchId: 'seed_m13', playerId: 'bot_kidd', rank: 13, captainName: 'William Kidd', shipName: 'Adventure Galley', score: 6, durationSeconds: 65, shipsDestroyed: 2, accuracyPercent: 55, date: '04 SEP · 11:30', recordedAt: '2026-09-04T11:30:00Z', endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_14', matchId: 'seed_m14', playerId: 'bot_omalley', rank: 14, captainName: "Grace O'Malley", shipName: 'Granuaile', score: 5, durationSeconds: 50, shipsDestroyed: 2, accuracyPercent: 52, date: '04 SEP · 09:15', recordedAt: '2026-09-04T09:15:00Z', endReason: 'PLAYER_DESTROYED', config: DEFAULT_CONFIG_120 },
  { id: 'rank_15', matchId: 'seed_m15', playerId: 'bot_drake', rank: 15, captainName: 'Francis Drake', shipName: 'Golden Hind', score: 4, durationSeconds: 45, shipsDestroyed: 1, accuracyPercent: 50, date: '03 SEP · 16:50', recordedAt: '2026-09-03T16:50:00Z', endReason: 'PLAYER_DESTROYED', config: DEFAULT_CONFIG_120 },
];

export const SEED_MATCHES: MatchRecord[] = [
  { id: 'm1', matchId: 'seed_m1', playerId: 'player_local', captainName: 'Captain Jack', date: '08 SEP · 19:36', result: 'VICTORY', score: 24, durationSeconds: 120, shipsDestroyed: 8, shotsFired: 42, shotsHit: 34, accuracyPercent: 81, endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-08T19:36:00Z', synced: true },
  { id: 'm2', matchId: 'seed_m2', playerId: 'player_local', captainName: 'Captain Jack', date: '08 SEP · 16:15', result: 'VICTORY', score: 18, durationSeconds: 115, shipsDestroyed: 6, shotsFired: 38, shotsHit: 28, accuracyPercent: 74, endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-08T16:15:00Z', synced: true },
  { id: 'm3', matchId: 'seed_m3', playerId: 'player_local', captainName: 'Captain Jack', date: '07 SEP · 21:00', result: 'DEFEAT', score: 12, durationSeconds: 78, shipsDestroyed: 4, shotsFired: 25, shotsHit: 16, accuracyPercent: 64, endReason: 'PLAYER_DESTROYED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-07T21:00:00Z', synced: true },
  { id: 'm4', matchId: 'seed_m4', playerId: 'player_local', captainName: 'Captain Jack', date: '07 SEP · 18:40', result: 'VICTORY', score: 22, durationSeconds: 120, shipsDestroyed: 7, shotsFired: 40, shotsHit: 31, accuracyPercent: 78, endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-07T18:40:00Z', synced: true },
  { id: 'm5', matchId: 'seed_m5', playerId: 'player_local', captainName: 'Captain Jack', date: '06 SEP · 20:25', result: 'VICTORY', score: 16, durationSeconds: 105, shipsDestroyed: 5, shotsFired: 32, shotsHit: 23, accuracyPercent: 72, endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-06T20:25:00Z', synced: true },
  { id: 'm6', matchId: 'seed_m6', playerId: 'player_local', captainName: 'Captain Jack', date: '06 SEP · 14:10', result: 'DEFEAT', score: 8, durationSeconds: 62, shipsDestroyed: 2, shotsFired: 18, shotsHit: 10, accuracyPercent: 56, endReason: 'PLAYER_DESTROYED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-06T14:10:00Z', synced: true },
  { id: 'm7', matchId: 'seed_m7', playerId: 'player_local', captainName: 'Captain Jack', date: '05 SEP · 19:50', result: 'VICTORY', score: 20, durationSeconds: 120, shipsDestroyed: 6, shotsFired: 35, shotsHit: 27, accuracyPercent: 77, endReason: 'TIME_EXPIRED', config: DEFAULT_CONFIG_120, recordedAt: '2026-09-05T19:50:00Z', synced: true },
];

export const getStoredRanking = (): RankingEntry[] => {
  try {
    const raw = localStorage.getItem(RANKING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...SEED_RANKING];
  } catch {
    return [...SEED_RANKING];
  }
};

export const saveStoredRanking = (entries: RankingEntry[]): void => {
  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
};

export const getStoredMatches = (): MatchRecord[] => {
  try {
    const raw = localStorage.getItem(MATCHES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...SEED_MATCHES];
  } catch {
    return [...SEED_MATCHES];
  }
};

export const saveStoredMatches = (entries: MatchRecord[]): void => {
  try {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
};

export const resetAllMockData = (): void => {
  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(SEED_RANKING));
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(SEED_MATCHES));
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    resetStoredScenario();
  } catch {}
};

if (typeof window !== 'undefined') {
  (window as any).__resetMswData = resetAllMockData;
}

async function simulateScenario(endpoint: 'ranking' | 'matches' | 'record'): Promise<Response | null> {
  const scenario = getStoredScenario();

  if (scenario === 'OFFLINE') {
    return HttpResponse.error();
  }

  if (scenario === 'ERROR_500') {
    return HttpResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Simulated 500 Internal Server Error' },
      { status: 500 }
    );
  }

  if (scenario === 'TIMEOUT') {
    await delay(3500);
    return HttpResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Simulated Gateway Timeout' },
      { status: 504 }
    );
  }

  if (scenario === 'ERROR_RANKING' && endpoint === 'ranking') {
    return HttpResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Simulated Ranking Service Unavailable' },
      { status: 500 }
    );
  }

  if (scenario === 'ERROR_HISTORY' && endpoint === 'matches') {
    return HttpResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Simulated Match History Service Unavailable' },
      { status: 500 }
    );
  }

  if (scenario === 'SLOW') {
    await delay(2000);
  } else if (scenario === 'OUT_OF_ORDER') {
    await delay(Math.floor(Math.random() * 600) + 150);
  }

  return null;
}

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const errorResponse = await simulateScenario('ranking');
    if (errorResponse) return errorResponse;

    const scenario = getStoredScenario();
    if (scenario === 'EMPTY') {
      return HttpResponse.json<ApiResponse<PaginatedResponse<RankingEntry>>>({
        success: true,
        data: {
          items: [],
          page: 1,
          pageSize: 5,
          totalItems: 0,
          totalPages: 1,
        },
      });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '5', 10));
    const filterDuration = url.searchParams.get('sessionDuration');

    let ranking = getStoredRanking();

    if (filterDuration) {
      const durationNum = Number(filterDuration);
      const matchesDuration = ranking.filter(
        (entry) => !entry.config || entry.config.sessionDurationSeconds === durationNum
      );
      if (matchesDuration.length >= 5) {
        ranking = matchesDuration;
      } else {
        ranking = ranking.map((entry) => ({
          ...entry,
          config: {
            sessionDurationSeconds: durationNum,
            enemySpawnIntervalSeconds: entry.config?.enemySpawnIntervalSeconds || 3,
            tilesetTheme: entry.config?.tilesetTheme || 'assets_1',
          },
        }));
      }
    }

    ranking.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracyPercent !== a.accuracyPercent) return b.accuracyPercent - a.accuracyPercent;
      const durA = a.durationSeconds ?? 9999;
      const durB = b.durationSeconds ?? 9999;
      if (durA !== durB) return durA - durB;
      const timeA = new Date(a.recordedAt || a.date).getTime() || 0;
      const timeB = new Date(b.recordedAt || b.date).getTime() || 0;
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });

    const reindexed = ranking.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
    const totalItems = reindexed.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (page - 1) * pageSize;
    const items = reindexed.slice(startIndex, startIndex + pageSize);

    return HttpResponse.json<ApiResponse<PaginatedResponse<RankingEntry>>>({
      success: true,
      data: {
        items,
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  }),

  http.post('/api/ranking', async ({ request }) => {
    const errorResponse = await simulateScenario('record');
    if (errorResponse) return errorResponse;

    const payload = (await request.json()) as SubmitScorePayload;
    const ranking = getStoredRanking();

    const matchId = payload.matchId || `rank_match_${Date.now()}`;
    const existingEntry = ranking.find(
      (r) => (r.matchId && r.matchId === matchId) || r.id === matchId
    );

    if (existingEntry) {
      return HttpResponse.json<ApiResponse<RankingEntry>>({
        success: true,
        data: existingEntry,
        message: 'Score already recorded on leaderboard (idempotent)',
      }, { status: 200 });
    }

    const now = new Date();
    const newEntry: RankingEntry = {
      id: matchId,
      matchId,
      playerId: payload.playerId || 'player_local',
      rank: ranking.length + 1,
      captainName: payload.captainName || 'Anonymous Buccaneer',
      shipName: payload.shipName || 'The Black Pearl',
      score: payload.score,
      durationSeconds: payload.durationSeconds,
      shipsDestroyed: payload.shipsDestroyed,
      accuracyPercent: payload.accuracyPercent,
      date: now.toISOString().split('T')[0],
      recordedAt: now.toISOString(),
      endReason: payload.endReason || 'TIME_EXPIRED',
      config: payload.config || DEFAULT_CONFIG_120,
    };

    ranking.push(newEntry);
    saveStoredRanking(ranking.slice(0, 100));

    const scenario = getStoredScenario();
    if (scenario === 'TIMEOUT_AFTER_RECORD') {
      return HttpResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Gateway Timeout after score persistence' },
        { status: 504 }
      );
    }

    return HttpResponse.json<ApiResponse<RankingEntry>>({
      success: true,
      data: newEntry,
      message: 'Score submitted to leaderboard',
    }, { status: 201 });
  }),

  http.get('/api/matches', async ({ request }) => {
    const errorResponse = await simulateScenario('matches');
    if (errorResponse) return errorResponse;

    const scenario = getStoredScenario();
    if (scenario === 'EMPTY') {
      return HttpResponse.json<ApiResponse<PaginatedResponse<MatchRecord>>>({
        success: true,
        data: {
          items: [],
          page: 1,
          pageSize: 5,
          totalItems: 0,
          totalPages: 1,
        },
      });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get('pageSize') || '5', 10));

    const matches = getStoredMatches().sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    const totalItems = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (page - 1) * pageSize;
    const items = matches.slice(startIndex, startIndex + pageSize);

    return HttpResponse.json<ApiResponse<PaginatedResponse<MatchRecord>>>({
      success: true,
      data: {
        items,
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  }),

  http.post('/api/matches', async ({ request }) => {
    const errorResponse = await simulateScenario('record');
    if (errorResponse) return errorResponse;

    const payload = (await request.json()) as RecordMatchPayload;
    const matches = getStoredMatches();

    const matchId = payload.matchId || `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existingRecord = matches.find(
      (m) => (m.matchId && m.matchId === matchId) || m.id === matchId
    );

    if (existingRecord) {
      return HttpResponse.json<ApiResponse<MatchRecord>>({
        success: true,
        data: existingRecord,
        message: 'Match voyage already recorded (idempotent)',
      }, { status: 200 });
    }

    const now = new Date();
    const newRecord: MatchRecord = {
      id: matchId,
      matchId,
      playerId: payload.playerId || 'player_local',
      captainName: payload.captainName || 'Captain Jack',
      date: now.toLocaleDateString(),
      result: payload.result,
      score: payload.score,
      durationSeconds: payload.durationSeconds,
      shipsDestroyed: payload.shipsDestroyed,
      shotsFired: payload.shotsFired,
      shotsHit: payload.shotsHit,
      accuracyPercent: payload.accuracyPercent,
      endReason: payload.endReason || 'TIME_EXPIRED',
      config: payload.config || DEFAULT_CONFIG_120,
      recordedAt: now.toISOString(),
      synced: true,
    };

    matches.unshift(newRecord);
    saveStoredMatches(matches.slice(0, 100));

    const scenario = getStoredScenario();
    if (scenario === 'TIMEOUT_AFTER_RECORD') {
      return HttpResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Gateway Timeout after match persistence' },
        { status: 504 }
      );
    }

    return HttpResponse.json<ApiResponse<MatchRecord>>({
      success: true,
      data: newRecord,
      message: 'Match voyage recorded in captain logbook',
    }, { status: 201 });
  }),

  http.post('/api/matches/sync-offline', async ({ request }) => {
    const errorResponse = await simulateScenario('record');
    if (errorResponse) return errorResponse;

    const offlineList = (await request.json()) as MatchRecord[];
    const current = getStoredMatches();
    const existingIds = new Set(current.map((m) => m.matchId || m.id));

    const newlySynced: MatchRecord[] = [];
    for (const off of offlineList) {
      const matchId = off.matchId || off.id;
      if (!existingIds.has(matchId)) {
        newlySynced.push({ ...off, id: matchId, matchId, synced: true });
        existingIds.add(matchId);
      }
    }

    const merged = [...newlySynced, ...current].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    saveStoredMatches(merged.slice(0, 100));

    return HttpResponse.json<ApiResponse<{ syncedCount: number; syncedIds: string[] }>>({
      success: true,
      data: {
        syncedCount: newlySynced.length,
        syncedIds: offlineList.map((m) => m.matchId || m.id),
      },
    });
  }),

  http.delete('/api/matches', () => {
    saveStoredMatches([]);
    return HttpResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Match logbook cleared',
    });
  }),

  http.post('/api/reset', () => {
    resetAllMockData();
    return HttpResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Mock data and network scenarios successfully reset',
    });
  }),

  http.get('/api/config', () => {
    return HttpResponse.json<ApiResponse<GameSettings>>({
      success: true,
      data: loadGameSettings(),
    });
  }),

  http.post('/api/config', async ({ request }) => {
    const body = (await request.json()) as Partial<GameSettings>;
    const saved = saveGameSettings(body);
    return HttpResponse.json<ApiResponse<GameSettings>>({
      success: true,
      data: saved,
    });
  }),
];
