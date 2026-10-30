import { describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import { createContactRequest } from './contactRequests';

vi.mock('@/services/http', () => ({ httpClient: { post: vi.fn() } }));

describe('contact request API', () => {
  it('posts the chat contact and returns only the public number', async () => {
    const input = { chatId: '11111111-1111-4111-8111-111111111111', fullName: 'Иван Иванов',
      email: 'ivan@пример.рф', consent: true as const };
    vi.mocked(httpClient.post).mockResolvedValue({ data: { publicNumber: 'AIJ-2026-ABC' } });
    await expect(createContactRequest(input)).resolves.toEqual({ publicNumber: 'AIJ-2026-ABC' });
    expect(httpClient.post).toHaveBeenCalledWith('/contact-requests', input);
  });
});
