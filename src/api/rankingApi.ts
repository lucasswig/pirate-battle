import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, RankingEntry, SubmitScorePayload } from './types';

export interface FetchRankingParams {
  page?: number;
  pageSize?: number;
  sessionDuration?: number;
  spawnInterval?: number;
}

export const fetchRanking = async (
  params: FetchRankingParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<RankingEntry>> => {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<RankingEntry>>>('/ranking', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 5,
      ...(params.sessionDuration ? { sessionDuration: params.sessionDuration } : {}),
      ...(params.spawnInterval ? { spawnInterval: params.spawnInterval } : {}),
    },
    signal,
  });
  return res.data.data;
};

export const submitScore = async (payload: SubmitScorePayload): Promise<RankingEntry> => {
  const res = await apiClient.post<ApiResponse<RankingEntry>>('/ranking', payload);
  return res.data.data;
};

export const useRanking = (params: FetchRankingParams = {}) => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 5;
  const sessionDuration = params.sessionDuration;
  const spawnInterval = params.spawnInterval;

  return useQuery({
    queryKey: ['ranking', { page, pageSize, sessionDuration, spawnInterval }],
    queryFn: ({ signal }) => fetchRanking({ page, pageSize, sessionDuration, spawnInterval }, signal),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 15,
  });
};

export const useSubmitRanking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

