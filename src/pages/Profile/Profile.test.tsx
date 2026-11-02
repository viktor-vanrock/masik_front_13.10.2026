import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONVERSATIONS_QUERY_KEYS, listConversations } from '@/api/conversations';
import type { ConversationDto } from '@/api/conversations';
import { translations } from '@/i18n';
import { ApiException } from '@/services/http';
import { mockUser } from '@/test/mocks/user';
import { createTestQueryClient, renderWithProviders } from '@/test/renderWithProviders';
import { saveConvName } from '@/pages/BenchmarkCreate/ui/CreateContent/utils/conversationUtils';
import { Profile } from './index';

const identity = vi.hoisted(() => ({ userId: 'alice', status: 'authenticated' }));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({
  t: translations.ru, lang: 'ru', status: identity.status,
  user: mockUser({ id: identity.userId }), userRole: 'USER', logout: vi.fn(), isLoggingOut: false,
}) }));
vi.mock('@/api/conversations/requests', () => ({ listConversations: vi.fn(), getConversation: vi.fn() }));
// Submission behavior is covered separately; keep this test focused on real
// profile -> useDialogues -> owner-scoped conversation query -> history links.
vi.mock('./ui/SubmissionsSection', () => ({ SubmissionsSection: () => null }));
const conversation = (id: string, status: ConversationDto['status'] = 'active'): ConversationDto => ({
  id, status, intent: 'create_new', createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-05T00:00:00.000Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listConversations).mockReset();
  identity.userId = 'alice';
  identity.status = 'authenticated';
});

describe('Profile conversation history', () => {
  it('renders real owner sessions and working links without invented messages', async () => {
    const id = 'ed6b9b1d-cbe1-4e81-9d5a-7d055642405b';
    saveConvName(id, 'Настоящая сессия', 'Real session');
    vi.mocked(listConversations).mockResolvedValue([conversation(id, 'generating')]);
    renderWithProviders(<Profile />, { route: '/profile' });
    const link = await screen.findByRole('link', { name: /Настоящая сессия/ });
    expect(link).toHaveAttribute('href', `/create?session=${id}`);
    expect(link).toHaveTextContent('Генерация');
    expect(link).toHaveTextContent('Обновлён');
    expect(link).not.toHaveTextContent('0 сообщ.');
    expect(screen.queryByText('benchmarkName')).not.toBeInTheDocument();
  });

  it('hides Alice history immediately while Bob loads and after logout', async () => {
    const aliceId = 'alice-private-session';
    const bobId = 'bob-private-session';
    saveConvName(aliceId, 'История Алисы', 'Alice history');
    saveConvName(bobId, 'История Боба', 'Bob history');
    let finishBob!: (value: ConversationDto[]) => void;
    vi.mocked(listConversations).mockResolvedValueOnce([conversation(aliceId)])
      .mockImplementationOnce(() => new Promise((resolve) => { finishBob = resolve; }));
    const { rerender } = renderWithProviders(<Profile />);
    await screen.findByRole('link', { name: /История Алисы/ });
    identity.userId = 'bob';
    rerender(<Profile />);
    expect(screen.queryByRole('link', { name: /История Алисы/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(translations.ru.common.loading);
    await waitFor(() => expect(finishBob).toBeTypeOf('function'));
    await act(async () => { finishBob([conversation(bobId)]); });
    await screen.findByRole('link', { name: /История Боба/ });
    identity.status = 'anonymous';
    rerender(<Profile />);
    expect(screen.queryByRole('link', { name: /История Боба/ })).not.toBeInTheDocument();
    expect(listConversations).toHaveBeenCalledTimes(2);
  });

  it('shows loading, failure with retry, and an empty state only after a successful empty response', async () => {
    let fail!: (reason: Error) => void;
    vi.mocked(listConversations).mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }))
      .mockResolvedValueOnce([]);
    renderWithProviders(<Profile />);
    expect(screen.getByRole('status')).toHaveTextContent(translations.ru.common.loading);
    expect(screen.queryByText(translations.ru.profile.emptyDialogues)).not.toBeInTheDocument();
    await waitFor(() => expect(fail).toBeTypeOf('function'));
    await act(async () => { fail(new ApiException({ statusCode: 400, message: 'Unavailable' })); });
    expect(await screen.findByRole('alert')).toHaveTextContent(translations.ru.profile.dialoguesLoadError);
    expect(screen.queryByText(translations.ru.profile.emptyDialogues)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: translations.ru.catalogue.retry }));
    expect(await screen.findByText(translations.ru.profile.emptyDialogues)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the same owner cache as chat and labels terminal conversation states honestly', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(CONVERSATIONS_QUERY_KEYS.list('alice'), [
      conversation('waiting', 'awaiting_choice'), conversation('done', 'completed'), conversation('closed', 'abandoned'),
    ]);
    renderWithProviders(<Profile />, { queryClient });
    expect(screen.getByText('Ожидает выбора')).toBeInTheDocument();
    expect(screen.getByText('Готово')).toBeInTheDocument();
    expect(screen.getByText('Закрыт')).toBeInTheDocument();
  });
});
