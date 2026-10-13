import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/api/conversations';
import type { ConversationProductionDto } from '@/api/conversations';
import { DialoguePhase, DialogueStatus, type Dialogue } from '@/types';
import { useProduction } from './useProduction';

const dialogue: Dialogue = {
  id: 'conversation', conversationId: 'conversation', conversationStatus: 'completed',
  benchmarkName: 'Налоги', benchmarkNameEn: 'Taxes', startedAt: '', updatedAt: '',
  status: DialogueStatus.Done, phase: DialoguePhase.Create, messages: [],
};
const none: ConversationProductionDto = {
  jobId: null, status: 'none', requestedCount: null, generatedCount: 0, examples: [], error: null,
};

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('useProduction', () => {
  it('does not load production before Inventor succeeds', () => {
    const request = vi.spyOn(api, 'getConversationProduction');
    renderHook(() => useProduction(dialogue, false, 'user'), { wrapper: wrapper() });
    expect(request).not.toHaveBeenCalled();
  });

  it('starts production for the selected count and caches the returned job', async () => {
    vi.spyOn(api, 'getConversationProduction').mockResolvedValue(none);
    const start = vi.spyOn(api, 'startConversationProduction').mockResolvedValue({
      ...none, jobId: 'job', status: 'queued', requestedCount: 250,
    });
    const { result } = renderHook(() => useProduction(dialogue, true, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.production?.status).toBe('none'));
    act(() => result.current.startProduction(250, 'creator-1', [0, 2]));
    await waitFor(() => expect(result.current.production?.status).toBe('queued'));
    expect(start).toHaveBeenCalledWith('conversation', 250, 'creator-1', [0, 2]);
  });

  it('recovers an active job after reload and polls until completion', async () => {
    vi.useFakeTimers();
    const running: ConversationProductionDto = {
      ...none, jobId: 'job', status: 'running', requestedCount: 250, generatedCount: 40,
    };
    const request = vi.spyOn(api, 'getConversationProduction')
      .mockResolvedValueOnce(running)
      .mockResolvedValue({ ...running, status: 'succeeded', generatedCount: 250 });
    const { result, unmount } = renderHook(() => useProduction(dialogue, true, 'user'), { wrapper: wrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    expect(result.current.production?.generatedCount).toBe(40);
    await act(async () => { await vi.advanceTimersByTimeAsync(3_020); });
    expect(result.current.production?.status).toBe('succeeded');
    const calls = request.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(9_000); });
    expect(request).toHaveBeenCalledTimes(calls);
    unmount();
  });
});

describe('useProduction boundaries', () => {
  it('does not expose the previous account’s results or accept actions after logout', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(api.CONVERSATIONS_QUERY_KEYS.production('alice', dialogue.id), {
      ...none, jobId: 'alice-job', status: 'succeeded', examples: [{ input: 'Alice private task' }],
    });
    const request = vi.spyOn(api, 'getConversationProduction').mockImplementation(() => new Promise(() => {}));
    const start = vi.spyOn(api, 'startConversationProduction');
    const provider = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ userId }) => useProduction(dialogue, true, userId), {
      initialProps: { userId: 'alice' as string | null }, wrapper: provider,
    });
    expect(result.current.production?.jobId).toBe('alice-job');
    rerender({ userId: 'bob' });
    expect(result.current.production).toBeUndefined();
    rerender({ userId: null });
    const requestCount = request.mock.calls.length;
    await act(async () => {
      result.current.refreshProduction();
      result.current.startProduction(100, 'creator', [0]);
    });
    expect(request).toHaveBeenCalledTimes(requestCount);
    expect(start).not.toHaveBeenCalled();
  });

  it('rejects non-divisible counts, duplicate indices, and empty selections', async () => {
    vi.spyOn(api, 'getConversationProduction').mockResolvedValue(none);
    const start = vi.spyOn(api, 'startConversationProduction');
    const { result } = renderHook(() => useProduction(dialogue, true, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.production?.status).toBe('none'));
    act(() => {
      result.current.startProduction(100, 'creator', [0, 1, 2]);
      result.current.startProduction(100, 'creator', [0, 0]);
      result.current.startProduction(100, 'creator', []);
      result.current.startProduction(100, 'creator', [-1]);
    });
    expect(start).not.toHaveBeenCalled();
  });
});
