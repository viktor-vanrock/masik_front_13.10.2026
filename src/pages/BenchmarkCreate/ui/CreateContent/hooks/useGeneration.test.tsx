import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/api/conversations';
import type { ConversationGenerationDto } from '@/api/conversations';
import { DialoguePhase, DialogueStatus, type Dialogue } from '@/types';
import { useGeneration } from './useGeneration';

const dialogue: Dialogue = {
  id: 'conversation', conversationId: 'conversation', conversationStatus: 'generating',
  benchmarkName: 'Налоги', benchmarkNameEn: 'Taxes', startedAt: '', updatedAt: '',
  status: DialogueStatus.InProgress, phase: DialoguePhase.Create, messages: [],
};
const job: ConversationGenerationDto = {
  jobId: 'job', status: 'running', progress: { phase: null, completedGenerations: 0, totalGenerations: 1 },
  examples: [], error: null,
};

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('useGeneration', () => {
  it('recovers generation from the server after reload and stops polling on success', async () => {
    vi.useFakeTimers();
    const request = vi.spyOn(api, 'getConversationGeneration')
      .mockResolvedValueOnce(job)
      .mockResolvedValue({ ...job, status: 'succeeded', examples: [{ input: 'Вопрос', output: 'Ответ' }] });
    const { result, unmount } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    expect(result.current.generation?.status).toBe('running');
    await act(async () => { await vi.advanceTimersByTimeAsync(3_020); });
    expect(result.current.generation?.examples).toEqual([{ input: 'Вопрос', output: 'Ответ' }]);
    const calls = request.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(9_000); });
    expect(request).toHaveBeenCalledTimes(calls);
    unmount();
  });

  it('retries a failed generation in the same conversation', async () => {
    vi.spyOn(api, 'getConversationGeneration').mockResolvedValue({ ...job, status: 'failed' });
    const retry = vi.spyOn(api, 'retryConversationGeneration').mockResolvedValue({ ...job, status: 'queued' });
    const { result } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.generation?.status).toBe('failed'));
    act(() => result.current.retryGeneration());
    await waitFor(() => expect(result.current.generation?.status).toBe('queued'));
    expect(retry).toHaveBeenCalledWith('conversation');
  });

  it('does not request generation for recommendation conversations', async () => {
    const request = vi.spyOn(api, 'getConversationGeneration');
    renderHook(() => useGeneration({ ...dialogue, phase: DialoguePhase.Recommend }, 'user'), { wrapper: wrapper() });
    expect(request).not.toHaveBeenCalled();
  });

  it('cancels the current job, keeps terminal state and stops polling', async () => {
    vi.useFakeTimers();
    const poll = vi.spyOn(api, 'getConversationGeneration').mockResolvedValue(job);
    const cancel = vi.spyOn(api, 'cancelConversationGeneration').mockResolvedValue({ ...job, status: 'cancelled' });
    const { result, unmount } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await act(async () => { await vi.advanceTimersByTimeAsync(20); });
    await act(async () => { result.current.cancelGeneration(); await vi.advanceTimersByTimeAsync(20); });
    expect(cancel).toHaveBeenCalledWith('conversation', 'job');
    expect(result.current.generation?.status).toBe('cancelled');
    const calls = poll.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(9_000); });
    expect(poll).toHaveBeenCalledTimes(calls);
    unmount();
  });

  it('keeps the job visible when cancellation fails', async () => {
    vi.spyOn(api, 'getConversationGeneration').mockResolvedValue(job);
    vi.spyOn(api, 'cancelConversationGeneration').mockRejectedValue(new Error('Unavailable'));
    const { result } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.generation?.status).toBe('running'));
    act(() => result.current.cancelGeneration());
    await waitFor(() => expect(result.current.cancelGenerationError).toBe(true));
    expect(result.current.generation?.status).toBe('running');
    expect(result.current.isCancellingGeneration).toBe(false);
  });
});

describe('useGeneration account and request boundaries', () => {
  it('hides cached results and disables network actions without an authenticated user', async () => {
    const get = vi.spyOn(api, 'getConversationGeneration');
    const retry = vi.spyOn(api, 'retryConversationGeneration');
    const cancel = vi.spyOn(api, 'cancelConversationGeneration');
    const { result } = renderHook(() => useGeneration(dialogue, null), { wrapper: wrapper() });
    await act(async () => {
      result.current.refreshGeneration();
      result.current.retryGeneration();
      result.current.cancelGeneration();
    });
    expect(result.current.generation).toBeUndefined();
    expect(get).not.toHaveBeenCalled();
    expect(retry).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('keeps a late mutation result scoped to the user who started it', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const aliceKey = api.CONVERSATIONS_QUERY_KEYS.generation('alice', dialogue.id);
    const bobKey = api.CONVERSATIONS_QUERY_KEYS.generation('bob', dialogue.id);
    client.setQueryData(aliceKey, { ...job, status: 'failed' });
    let finishRetry!: (value: ConversationGenerationDto) => void;
    vi.spyOn(api, 'retryConversationGeneration').mockImplementation(() => new Promise((resolve) => { finishRetry = resolve; }));
    vi.spyOn(api, 'getConversationGeneration').mockImplementation(() => new Promise(() => {}));
    const provider = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, rerender } = renderHook(({ userId }) => useGeneration(dialogue, userId), {
      initialProps: { userId: 'alice' }, wrapper: provider,
    });
    act(() => result.current.retryGeneration());
    await waitFor(() => expect(finishRetry).toBeTypeOf('function'));
    rerender({ userId: 'bob' });
    expect(result.current.generation).toBeUndefined();
    await act(async () => { finishRetry({ ...job, jobId: 'alice-new-job', status: 'queued' }); });
    expect(client.getQueryData<ConversationGenerationDto>(aliceKey)?.jobId).toBe('alice-new-job');
    expect(client.getQueryData(bobKey)).toBeUndefined();
    expect(result.current.generation).toBeUndefined();
  });

  it('does not let an older poll resurrect a cancelled job', async () => {
    let finishPoll!: (value: ConversationGenerationDto) => void;
    vi.spyOn(api, 'getConversationGeneration').mockResolvedValueOnce(job)
      .mockImplementation(() => new Promise((resolve) => { finishPoll = resolve; }));
    vi.spyOn(api, 'cancelConversationGeneration').mockResolvedValue({ ...job, status: 'cancelled' });
    const { result } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.generation?.status).toBe('running'));
    act(() => result.current.refreshGeneration());
    await waitFor(() => expect(finishPoll).toBeTypeOf('function'));
    act(() => result.current.cancelGeneration());
    await waitFor(() => expect(result.current.generation?.status).toBe('cancelled'));
    await act(async () => { finishPoll(job); });
    expect(result.current.generation?.status).toBe('cancelled');
  });
});


describe('useGeneration retry race', () => {
  it('does not let an old terminal refetch overwrite the newly queued job', async () => {
    let finishPoll!: (value: ConversationGenerationDto) => void;
    const failed = { ...job, status: 'failed' as const };
    vi.spyOn(api, 'getConversationGeneration').mockResolvedValueOnce(failed)
      .mockImplementation(() => new Promise((resolve) => { finishPoll = resolve; }));
    vi.spyOn(api, 'retryConversationGeneration').mockResolvedValue({ ...job, jobId: 'new-job', status: 'queued' });
    const { result } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.generation?.status).toBe('failed'));
    act(() => result.current.refreshGeneration());
    await waitFor(() => expect(finishPoll).toBeTypeOf('function'));
    act(() => result.current.retryGeneration());
    await waitFor(() => expect(result.current.generation?.jobId).toBe('new-job'));
    await act(async () => { finishPoll(failed); });
    expect(result.current.generation).toMatchObject({ jobId: 'new-job', status: 'queued' });
  });
});


describe('useGeneration refetch during retry', () => {
  it('discards a stale refetch started after onMutate while retry is pending', async () => {
    let finishPoll!: (value: ConversationGenerationDto) => void;
    let finishRetry!: (value: ConversationGenerationDto) => void;
    const failed = { ...job, status: 'failed' as const };
    vi.spyOn(api, 'getConversationGeneration').mockResolvedValueOnce(failed)
      .mockImplementation(() => new Promise((resolve) => { finishPoll = resolve; }));
    vi.spyOn(api, 'retryConversationGeneration').mockImplementation(() => new Promise((resolve) => { finishRetry = resolve; }));
    const { result } = renderHook(() => useGeneration(dialogue, 'user'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.generation?.status).toBe('failed'));
    act(() => result.current.retryGeneration());
    await waitFor(() => expect(finishRetry).toBeTypeOf('function'));
    act(() => result.current.refreshGeneration());
    await waitFor(() => expect(finishPoll).toBeTypeOf('function'));
    await act(async () => { finishRetry({ ...job, jobId: 'replacement-job', status: 'queued' }); });
    await waitFor(() => expect(result.current.generation?.jobId).toBe('replacement-job'));
    await act(async () => { finishPoll(failed); });
    expect(result.current.generation).toMatchObject({ jobId: 'replacement-job', status: 'queued' });
  });
});
