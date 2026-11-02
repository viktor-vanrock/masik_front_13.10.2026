import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CONVERSATIONS_QUERY_KEYS,
  getConversationProduction,
  startConversationProduction,
} from '@/api/conversations';
import { shouldRetry } from '@/services/http';
import { DialoguePhase, type Dialogue } from '@/types';

export function useProduction(dialogue: Dialogue | null, inventorSucceeded: boolean, userId: string | null) {
  const queryClient = useQueryClient();
  const conversationId = dialogue?.conversationId;
  const enabled = !!userId && !!conversationId && dialogue?.phase === DialoguePhase.Create && inventorSucceeded;
  const query = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEYS.production(userId ?? '', conversationId ?? ''),
    queryFn: () => getConversationProduction(conversationId!),
    enabled,
    retry: shouldRetry,
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      return status === 'queued' || status === 'running' ? 3_000 : false;
    },
  });
  const start = useMutation({
    mutationFn: ({ id, numTasks, creatorJobId, selectedIndices }: {
      id: string; userId: string; numTasks: number; creatorJobId: string; selectedIndices: number[];
    }) => startConversationProduction(id, numTasks, creatorJobId, selectedIndices),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.production(userId ?? '', id) });
    },
    onSuccess: async (production, { id, userId }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.production(userId ?? '', id) });
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEYS.production(userId ?? '', id), production);
    },
    onError: (_error, { id, userId }) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.production(userId ?? '', id) });
    },
  });

  return {
    production: enabled ? query.data : undefined,
    productionLoading: enabled && query.isPending,
    productionError: enabled && query.isError,
    refreshProduction: () => { if (enabled) void query.refetch(); },
    startProduction: (numTasks: number, creatorJobId: string, selectedIndices: number[]) => {
      if (enabled && userId && conversationId && creatorJobId && Number.isInteger(numTasks) && numTasks >= 1 && numTasks <= 1000
        && selectedIndices.length > 0 && numTasks % selectedIndices.length === 0 && selectedIndices.every((index) => Number.isInteger(index) && index >= 0)
        && new Set(selectedIndices).size === selectedIndices.length && !start.isPending) {
        start.mutate({ id: conversationId, userId, numTasks, creatorJobId, selectedIndices });
      }
    },
    isStartingProduction: start.isPending && start.variables?.id === conversationId && start.variables?.userId === userId,
    startProductionError: start.isError && start.variables?.id === conversationId && start.variables?.userId === userId,
  };
}
