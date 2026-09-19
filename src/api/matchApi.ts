import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ApiResponse, MatchRecord, PaginatedResponse, RecordMatchPayload } from './types';
import { enqueueOfflineMatch, getPendingMatches, markMatchesAsSynced } from '../services/offlineQueue';

export interface FetchMatchesParams {
  page?: number;
  pageSize?: number;
}

export const fetchMatches = async (
  params: FetchMatchesParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<MatchRecord>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 5;

  const res = await apiClient.get<ApiResponse<PaginatedResponse<MatchRecord>>>('/matches', {
    params: { page, pageSize },
    signal,
  });
  return res.data.data;
};

export const recordMatch = async (payload: RecordMatchPayload): Promise<MatchRecord> => {
  const matchId = payload.matchId || `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedPayload: RecordMatchPayload = {
    ...payload,
    matchId,
    playerId: payload.playerId || 'player_local',
    captainName: payload.captainName || 'Captain Jack',
  };

  try {
    const res = await apiClient.post<ApiResponse<MatchRecord>>('/matches', normalizedPayload);
    return res.data.data;
  } catch (err) {
    const offlineRecord: MatchRecord = {
      id: matchId,
      matchId,
      playerId: normalizedPayload.playerId || 'player_local',
      captainName: normalizedPayload.captainName || 'Captain Jack',
      date: new Date().toLocaleDateString(),
      result: payload.result,
      score: payload.score,
      durationSeconds: payload.durationSeconds,
      shipsDestroyed: payload.shipsDestroyed,
      shotsFired: payload.shotsFired,
      shotsHit: payload.shotsHit,
      accuracyPercent: payload.accuracyPercent,
      endReason: payload.endReason || 'TIME_EXPIRED',
      config: payload.config,
      recordedAt: new Date().toISOString(),
      synced: false,
    };
    enqueueOfflineMatch(offlineRecord);
    return offlineRecord;
  }
};

export const clearMatches = async (): Promise<void> => {
  await apiClient.delete('/matches');
};

export const syncOfflineMatches = async (): Promise<string[]> => {
  const pending = getPendingMatches();
  if (pending.length === 0) return [];

  try {
    const res = await apiClient.post<ApiResponse<{ syncedCount: number; syncedIds: string[] }>>(
      '/matches/sync-offline',
      pending
    );
    markMatchesAsSynced(res.data.data.syncedIds);
    return res.data.data.syncedIds;
  } catch (err) {
    console.warn('Failed to sync offline matches', err);
    return [];
  }
};

export const useMatchHistory = (params: FetchMatchesParams = {}) => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 5;

  return useQuery({
    queryKey: ['matches', { page, pageSize }],
    queryFn: ({ signal }) => fetchMatches({ page, pageSize }, signal),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 15,
  });
};

export const useRecordMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recordMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

export const useSyncOfflineMatches = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncOfflineMatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
    },
  });
};

export const useClearMatchHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearMatches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

