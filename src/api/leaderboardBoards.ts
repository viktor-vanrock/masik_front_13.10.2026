import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient, shouldRetry } from '@/services/http';
import { LEADERBOARD_BOARD_QUERY_KEYS } from './leaderboardBoardQueryKeys';

export type LeaderboardBoardDto = {
  id: string;
  name: string;
  description: string | null;
  modelIds: string[];
  benchmarkIds: string[];
  architectures: string[];
  isPublic: boolean;
  systemKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SaveLeaderboardBoardDto = Pick<
  LeaderboardBoardDto,
  'name' | 'modelIds' | 'benchmarkIds' | 'architectures'
> & { description?: string };

export function useLeaderboardBoardsQuery(authenticated: boolean, userId?: string) {
  return useQuery<LeaderboardBoardDto[]>({
    queryKey: LEADERBOARD_BOARD_QUERY_KEYS.list(authenticated, userId),
    queryFn: async () => {
      const path = authenticated
        ? BACKEND_PATHS.leaderboardBoards.list
        : BACKEND_PATHS.leaderboardBoards.public;
      return (await httpClient.get<LeaderboardBoardDto[]>(path)).data;
    },
    retry: shouldRetry,
  });
}

export function useCreateLeaderboardBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: SaveLeaderboardBoardDto) =>
      (await httpClient.post<LeaderboardBoardDto>(BACKEND_PATHS.leaderboardBoards.create, dto)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEADERBOARD_BOARD_QUERY_KEYS.all }),
  });
}

export function useUpdateLeaderboardBoardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: SaveLeaderboardBoardDto & { id: string }) =>
      (await httpClient.patch<LeaderboardBoardDto>(BACKEND_PATHS.leaderboardBoards.detail(id), dto)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEADERBOARD_BOARD_QUERY_KEYS.all }),
  });
}
