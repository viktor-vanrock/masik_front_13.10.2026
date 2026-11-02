import { useConversationsQuery } from '@/api/conversations';
import { useApp } from '@/hooks/useApp';
import { dtoToDialogue } from '@/pages/BenchmarkCreate/ui/CreateContent/utils/conversationUtils';

export function useDialogues() {
  const { status, user } = useApp();
  const userId = status === 'authenticated' ? user?.id ?? null : null;
  const query = useConversationsQuery(userId);

  return {
    // The list API has no messages/counts. Reuse the chat's summary mapping
    // without inventing messages or loading every conversation's full history.
    dialogues: userId ? (query.data ?? []).map(dtoToDialogue) : [],
    isPending: !!userId && query.isPending,
    isError: !!userId && query.isError,
    onRetry: () => { if (userId) void query.refetch(); },
  };
}
