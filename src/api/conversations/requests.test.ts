import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import { cancelConversationGeneration, getConversationGeneration, getConversationProduction, listSidebarConversations, startConversationProduction } from './requests';

vi.mock('@/services/http', () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
afterEach(() => vi.clearAllMocks());

describe('generation and producer gateway contract', () => {
  it('requests a sidebar page through the registered endpoint', async () => {
    const payload = { pinned: [], data: [], total: 0, pageSize: 20, archived: [] };
    vi.mocked(httpClient.get).mockResolvedValue({ data: payload });
    await expect(listSidebarConversations(3)).resolves.toEqual(payload);
    expect(httpClient.get).toHaveBeenCalledWith('/conversations/sidebar', { params: { page: 3 } });
  });
  it('sends selected indices and creator job ID without changing the producer payload', async () => {
    const job = { jobId: 'production', status: 'queued' };
    vi.mocked(httpClient.post).mockResolvedValue({ data: job });
    expect(await startConversationProduction('conversation/a', 250, 'creator-1', [0, 2])).toEqual(job);
    expect(httpClient.post).toHaveBeenCalledWith('/conversations/conversation%2Fa/production', {
      numTasks: 250, creatorJobId: 'creator-1', selectedIndices: [0, 2],
    });
  });

  it('uses conversation-scoped generation, cancellation and production URLs', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: {} });
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} });
    await getConversationGeneration('conversation/a');
    await getConversationProduction('conversation/a');
    await cancelConversationGeneration('conversation/a', 'job/b');
    expect(httpClient.get).toHaveBeenCalledWith('/conversations/conversation%2Fa/generation');
    expect(httpClient.get).toHaveBeenCalledWith('/conversations/conversation%2Fa/production');
    expect(httpClient.post).toHaveBeenCalledWith('/conversations/conversation%2Fa/generation/job%2Fb/cancel');
  });
});
