import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';

export type LeaderboardBoardDto = { id: string; name: string; description: string | null; modelIds: string[]; benchmarkIds: string[]; architectures: string[]; isPublic: boolean; systemKey: string | null; createdAt: string; updatedAt: string };
export type SaveLeaderboardBoardDto = Pick<LeaderboardBoardDto, 'name' | 'modelIds' | 'benchmarkIds' | 'architectures'> & { description?: string };
const key = ['leaderboard-boards'] as const;
export const useLeaderboardBoardsQuery = (authenticated: boolean) => useQuery({ queryKey: [...key, authenticated], queryFn: async () => {
  const publicBoards = (await httpClient.get<LeaderboardBoardDto[]>(BACKEND_PATHS.leaderboardBoards.public)).data;
  if (!authenticated) return publicBoards;
  return (await httpClient.get<LeaderboardBoardDto[]>(BACKEND_PATHS.leaderboardBoards.list)).data;
} });
export const useCreateLeaderboardBoardMutation = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: async (dto: SaveLeaderboardBoardDto) => (await httpClient.post<LeaderboardBoardDto>(BACKEND_PATHS.leaderboardBoards.create, dto)).data, onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) }); };
export const useUpdateLeaderboardBoardMutation = () => { const queryClient = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...dto }: SaveLeaderboardBoardDto & { id: string }) => (await httpClient.patch<LeaderboardBoardDto>(BACKEND_PATHS.leaderboardBoards.detail(id), dto)).data, onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) }); };
