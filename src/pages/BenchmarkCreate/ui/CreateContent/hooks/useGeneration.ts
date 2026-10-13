import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CONVERSATIONS_QUERY_KEYS,
  getConversationGeneration,
  retryConversationGeneration,
  cancelConversationGeneration,
} from '@/api/conversations';
import { shouldRetry } from '@/services/http';
import { DialoguePhase, DialogueStatus, type Dialogue } from '@/types';

export function useGeneration(dialogue: Dialogue | null, userId: string | null) {
  const queryClient = useQueryClient();
  const conversationId = dialogue?.conversationId;
  const enabled = !!userId && !!conversationId && dialogue?.phase === DialoguePhase.Create;
  const query = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', conversationId ?? ''),
    queryFn: () => getConversationGeneration(conversationId!),
    enabled,
    retry: shouldRetry,
    refetchInterval: (current) => {
      const status = current.state.data?.status;
      if (status === 'succeeded' || status === 'failed' || status === 'cancelled') return false;
      if (status === 'none' && dialogue?.status === DialogueStatus.Done) return false;
      return 3_000;
    },
  });
  const retry = useMutation({
    mutationFn: ({ id }: { id: string; userId: string }) => retryConversationGeneration(id),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId, id) });
    },
    onSuccess: async (generation, { id, userId }) => {
      // A focus/refetch started before retry must not restore a terminal old job
      // and disable polling for the newly queued job.
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId, id) });
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEYS.generation(userId, id), generation);
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.list(userId) });
    },
    onError: (_error, { id, userId }) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId, id) });
    },
  });
  const cancel = useMutation({
    mutationFn: ({ id, jobId }: { id: string; jobId: string; userId: string }) => cancelConversationGeneration(id, jobId),
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', id) });
    },
    onSuccess: async (generation, { id, userId }) => {
      // An older in-flight poll must not restore the running state after cancel.
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', id) });
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', id), generation);
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.list(userId ?? '') });
    },
    onError: (_error, { id, userId }) => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', id) });
    },
  });

  return {
    generation: enabled ? query.data : undefined,
    generationError: enabled && query.isError,
    retryGeneration: () => { if (enabled && conversationId && userId) retry.mutate({ id: conversationId, userId }); },
    refreshGeneration: () => { if (enabled) void query.refetch(); },
    isRetryingGeneration: retry.isPending && retry.variables?.id === conversationId && retry.variables?.userId === userId,
    retryGenerationError: retry.isError && retry.variables?.id === conversationId && retry.variables?.userId === userId,
    cancelGeneration: () => {
      if (enabled && conversationId && userId && query.data?.jobId) cancel.mutate({ id: conversationId, jobId: query.data.jobId, userId });
    },
    isCancellingGeneration: cancel.isPending && cancel.variables?.id === conversationId && cancel.variables?.userId === userId,
    cancelGenerationError: cancel.isError && cancel.variables?.id === conversationId && cancel.variables?.userId === userId,
  };
}
