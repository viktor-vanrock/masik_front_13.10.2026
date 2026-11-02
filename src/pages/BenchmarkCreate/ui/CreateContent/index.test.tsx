/// <reference types="node" />
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { translations } from '@/i18n';
import type { ChatMessage, ChatResponseProgress } from '@/types';
import type { UserRole } from '@/types/auth';
import { useConversationDetailQuery, type ConversationDetailDto, type ConversationProductionDto, type ConversationSpecification } from '@/api/conversations';
import { useConversation } from './hooks/useConversation/useConversation';
import { CreateContent } from './index';
import { httpClient } from '@/services/http';

const state = vi.hoisted(() => ({ userId: 'user-1', chatId: 'chat-1', role: 'USER' as UserRole, canRetryResponse: false, jobId: 'job-1', responsePending: false, socketConnected: true,
  briefProgress: undefined as ChatResponseProgress | undefined,
  messages: [] as ChatMessage[], hasGeneration: true, isTyping: false, pending: false, sendMessage: vi.fn(), sendOption: vi.fn(),
  production: undefined as ConversationProductionDto | undefined, generationError: false, productionError: false, noop: vi.fn() }));
const specificationState = vi.hoisted(() => ({ id: 'chat-1', status: 'active' as ConversationDetailDto['status'], specification: undefined as ConversationSpecification | undefined,
  demoRequest: undefined as ConversationDetailDto['demoRequest'] }));
beforeAll(() => { Element.prototype.scrollTo = vi.fn(); vi.stubGlobal('crypto', webcrypto); });
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  state.jobId = 'job-1'; state.responsePending = false; state.socketConnected = true; state.briefProgress = undefined;
  state.role = 'USER';
  state.userId = 'user-1'; state.chatId = 'chat-1'; state.canRetryResponse = false;
  state.production = undefined; state.generationError = false; state.productionError = false;
  state.messages = []; state.hasGeneration = true; state.isTyping = false; state.pending = false;
  state.sendMessage.mockClear(); state.sendOption.mockClear();
  vi.mocked(useConversation).mockClear();
  specificationState.specification = undefined;
  specificationState.id = 'chat-1'; specificationState.status = 'active'; specificationState.demoRequest = undefined;
  vi.mocked(httpClient.post).mockReset();
});

vi.mock('@/services/http', async original => ({ ...await original<typeof import('@/services/http')>(), httpClient: { post: vi.fn() } }));

vi.mock('@/api/conversations', async original => ({
  ...await original<typeof import('@/api/conversations')>(),
  useConversationDetailQuery: vi.fn(() => ({ data: { ...specificationState } })),
}));

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ lang: 'ru', t: translations.ru, user: { id: state.userId, role: state.role } }),
}));
vi.mock('@/api/catalog', () => ({
  useBenchmarkQuery: () => ({ data: undefined, isPending: false, isError: false, refetch: state.noop }),
  useBenchmarksQuery: () => ({ data: { data: [] }, isPending: false, isError: false, refetch: state.noop }),
  useSuiteQuery: () => ({ data: undefined, isPending: false, isError: false, refetch: state.noop }),
}));
vi.mock('./hooks/useConversation/useConversation', () => ({
  useConversation: vi.fn(() => ({
    dialogues: [], activeId: state.chatId, entryConversationId: null, isTyping: state.isTyping, connectionError: null,
    responsePending: state.responsePending, responseProgress: 'Ищем подходящие бенчмарки', briefProgress: state.briefProgress, socketConnected: state.socketConnected,
    activeDialogue: { id: state.chatId, conversationId: state.chatId, conversationStatus: 'completed',
      benchmarkName: 'Test chat', benchmarkNameEn: 'Test chat', messages: state.messages, status: 'done', phase: 'create', outgoingMessage: state.pending ? { delivery: 'sending' } : undefined },
    generation: state.hasGeneration ? { jobId: state.jobId, status: 'succeeded', examples: [{ input: 'Question one' }, { input: 'Question two' }],
      progress: { phase: null, completedGenerations: 2, totalGenerations: 2 }, error: null } : undefined,
    production: state.production, generationError: state.generationError, productionError: state.productionError,
    loadMoreDialogues: state.noop, loadMoreArchived: state.noop, hasMoreDialogues: false, hasMoreArchived: false,
    isLoadingMoreDialogues: false, isLoadingMoreArchived: false, archivedTotal: 0,
    startNewSession: state.noop, retryEntrySession: state.noop, startDerivedCreation: state.noop,
    renameDialogue: state.noop, toggleArchive: state.noop, togglePin: state.noop, sendMessage: state.sendMessage, sendOptionMessage: state.sendOption,
    acceptRecommendation: state.noop, rejectRecommendation: state.noop, retryGeneration: state.noop,
    refreshGeneration: state.noop, cancelGeneration: state.noop, refreshProduction: state.noop, startProduction: state.noop,
    canRetryResponse: state.canRetryResponse, retryResponse: state.noop,
  })),
}));
vi.mock('../Sidebar', () => ({ Sidebar: () => null }));
vi.mock('../CreateHeader', () => ({ CreateHeader: ({ displayStatus }: { displayStatus: string }) => <span data-testid="display-status">{displayStatus}</span> }));

describe('CreateContent entry route', () => {
  it.each([
    ['/create?mode=create&new=visit-1', 'create:visit-1'],
    ['/create?mode=create&new=visit-2', 'create:visit-2'],
    ['/create?mode=create', 'create:default'],
    ['/create', undefined],
    ['/create?session=existing-chat', undefined],
    ['/create?mode=modify&base=test-1&baseType=test&new=visit-1', 'modify:test:test-1:visit-1'],
  ])('selects the entry contract for %s', (route, entryIntentKey) => {
    const { rerender } = render(<MemoryRouter initialEntries={[route]}><CreateContent /></MemoryRouter>);
    expect(useConversation).toHaveBeenLastCalledWith(expect.objectContaining({ entryIntentKey }));
    rerender(<MemoryRouter initialEntries={[route]}><CreateContent /></MemoryRouter>);
    expect(useConversation).toHaveBeenLastCalledWith(expect.objectContaining({ entryIntentKey }));
  });
});

describe('CreateContent generation thread', () => {
  it.each([
    ['queued', 'productionQueued'], ['running', 'productionRunning'], ['failed', 'productionFailed'],
    ['succeeded', 'productionSucceeded'], ['cancelled', 'productionCancelled'],
  ] as const)('shows existing %s production status alongside generated samples', (status, label) => {
    state.production = { jobId: 'producer-1', status, requestedCount: 100, generatedCount: 20,
      examples: [], selectedIndices: [0, 1], error: null };
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    const message = translations.ru.create.generation[label];
    expect(screen.getByText(message)).toBeVisible();
  });

  it.each([
    [false, true, 'productionLoadFailed'],
    [true, false, 'loadFailed'],
    [true, true, 'loadFailed'],
  ] as const)('prioritizes load errors over cached production status (%s, %s)', (generationError, productionError, label) => {
    state.production = { jobId: 'producer-1', status: 'succeeded', requestedCount: 100, generatedCount: 100,
      examples: [], selectedIndices: [0, 1], error: null };
    state.generationError = generationError; state.productionError = productionError;
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    const message = translations.ru.create.generation[label];
    expect(screen.getByText(message)).toBeVisible();
  });

  it('keeps model response progress alongside generated tasks after merging develop', () => {
    state.responsePending = true;
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByText('Ищем подходящие бенчмарки').closest('[role="status"]')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Задания созданы (2)')).toHaveClass('sr-only');

    state.socketConnected = false;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByText('Ожидаем соединение')).toBeInTheDocument();

    state.responsePending = false;
    state.socketConnected = true;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByText('Ожидаем соединение')).not.toBeInTheDocument();
    expect(screen.queryByText('Ищем подходящие бенчмарки')).not.toBeInTheDocument();
  });

  it('keeps feedback outside task cards and resets selection only for a new job', () => {
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    const feedback = screen.getByText('Задания созданы (2)');
    const tasks = screen.getAllByRole('article');
    expect(tasks).toHaveLength(2);
    expect(tasks.every((task) => !task.contains(feedback))).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 1' }));
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();
    state.jobId = 'job-2';
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).toBeChecked();
  });
});

const assistant = (id: string, content: string, extras = {}): ChatMessage => ({ id, role: 'assistant', content, timestamp: '', ...extras });
const user = (id: string, content: string): ChatMessage => ({ id, role: 'user', content, timestamp: '' });

describe('CreateContent deferred demo brief', () => {
  it('shows saved brief stages through reconnect until owned readiness displays the contact form', () => {
    state.role = 'DEMO'; state.hasGeneration = false; state.responsePending = true;
    state.briefProgress = { stage: 'validate', message: 'Проверяем структуру брифа', updatedAt: '2026-11-02T10:00:00Z' };
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByText('Проверяем структуру брифа')).toBeVisible();
    expect(screen.getByRole('list', { name: 'Подготовка брифа' })).toBeVisible();
    expect(screen.queryByText('Ищем подходящие бенчмарки')).not.toBeInTheDocument();
    state.socketConnected = false;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByText('Последний подтверждённый этап: Проверяем структуру брифа')).toBeVisible();
    specificationState.demoRequest = { status: 'ready', revision: 'saved-brief' };
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByRole('list', { name: 'Подготовка брифа' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Контактные данные' })).toBeVisible();
  });

  it('restores readiness from owned detail and locks edits without showing generation or response progress', () => {
    state.role = 'DEMO';
    state.responsePending = true; state.isTyping = true;
    state.messages = [assistant('question', 'Последний вопрос', { agentOptions: [{ id: 'option', label: 'Улучшить точность' }] })];
    specificationState.demoRequest = { status: 'ready', revision: 'brief-revision-1' };
    const { unmount } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Оставьте контакты — пришлём результат позже' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Улучшить точность' })).toBeDisabled();
    expect(screen.queryByText('Задания созданы (2)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ищем подходящие бенчмарки')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('BenchFactory печатает')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить точность' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Сообщение' }), { key: 'Enter' });
    expect(state.sendOption).not.toHaveBeenCalled();
    expect(state.sendMessage).not.toHaveBeenCalled();
    unmount();
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByText('Оставьте контакты — пришлём результат позже')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeDisabled();
  });

  it('uses the completed detail to offer contacts and freezes every chat action', () => {
    state.role = 'DEMO'; state.isTyping = true; state.responsePending = true; state.canRetryResponse = true;
    specificationState.status = 'completed';
    state.messages = [assistant('question', 'Сохранённый вопрос', { agentOptions: [{ id: 'change', label: 'Изменить ответ' }] })];
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Пришлем результат этого теста на вашу почту' })).toBeVisible();
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Изменить ответ' })).toBeDisabled();
    expect(screen.getByText('Задания созданы (2)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Question one')).toHaveAttribute('readonly');
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Сгенерировать заново' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ищем подходящие бенчмарки')).not.toBeInTheDocument();
    expect(screen.queryByText(translations.ru.create.responseRetry)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Запустить генерацию' })).not.toBeInTheDocument();
  });

  it.each(['USER', 'ADMIN', 'SUPERUSER'] as const)('does not show DEMO contacts to %s for a completed test', (role) => {
    state.role = role; specificationState.status = 'completed';
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByRole('region', { name: 'Контактные данные' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled();
  });

  it('prioritizes completed material status when the detail also retains deferred ready metadata', () => {
    state.role = 'DEMO'; specificationState.status = 'completed';
    specificationState.demoRequest = { status: 'ready', revision: 'saved-brief' };
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByTestId('display-status')).toHaveTextContent('samples');
    expect(screen.getByRole('heading', { name: 'Пришлем результат этого теста на вашу почту' })).toBeVisible();
    expect(screen.getByDisplayValue('Question one')).toBeVisible();
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).toBeDisabled();
  });

  it('scopes pending contact results to the current profile and conversation', async () => {
    state.role = 'DEMO'; state.hasGeneration = false; specificationState.status = 'completed';
    let finish!: (value: { data: { publicNumber: string } }) => void;
    vi.mocked(httpClient.post).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }) as ReturnType<typeof httpClient.post>);
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: 'Иван Иванов' } });
    fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: 'ivan@example.org' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith('/demo/contacts', { conversationId: 'chat-1', fullName: 'Иван Иванов', email: 'ivan@example.org', consent: true }, { signal: expect.any(AbortSignal), headers: { 'Idempotency-Key': expect.any(String) } }));
    expect(state.sendMessage).not.toHaveBeenCalled();
    state.userId = 'user-2'; state.chatId = 'chat-2'; specificationState.id = 'chat-2';
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await act(async () => { finish({ data: { publicNumber: 'OLD-PUBLIC' } }); });
    await waitFor(() => expect(screen.queryByText(/OLD-PUBLIC/)).not.toBeInTheDocument());
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
  });

  it('keeps natural confirmation available until the server marks a valid brief ready', () => {
    state.role = 'DEMO'; state.hasGeneration = false;
    state.messages = [assistant('summary', 'Всё готово к подтверждению. Подтвердите требования.')];
    specificationState.specification = { goal: 'Проверка ответов', language: 'Русский' };
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByText('Оставьте контакты — пришлём результат позже')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Запустить генерацию' })).not.toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: 'Подтверждаю требования' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(state.sendMessage).toHaveBeenCalledExactlyOnceWith('Подтверждаю требования');
  });

  it('requires the current detail revision rather than assistant copy or a previous chat snapshot', () => {
    state.role = 'DEMO'; state.hasGeneration = false;
    state.messages = [assistant('copy', 'Оставьте контакты — пришлём результат позже')];
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled();
    specificationState.demoRequest = { status: 'ready', revision: '' };
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled();
    specificationState.demoRequest = { status: 'ready', revision: 'another-brief' };
    specificationState.id = 'another-chat';
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled();
  });

  it('preserves the ordinary user summary action even if a detail contains demo metadata', () => {
    state.hasGeneration = false;
    state.messages = [assistant('summary', 'Всё готово к подтверждению.')];
    specificationState.demoRequest = { status: 'ready', revision: 'old-demo-revision' };
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByText('Оставьте контакты — пришлём результат позже')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Запустить генерацию' }));
    expect(state.sendMessage).toHaveBeenCalledWith('Требования подтверждаю. Начни генерацию бенчмарка по согласованной сводке.');
  });
});

describe('CreateContent service actions', () => {
  it('sends Enter once while keeping Shift+Enter and IME composition local', () => {
    state.hasGeneration = false;
    render(<MemoryRouter><CreateContent /></MemoryRouter>);
    const input = screen.getByRole('textbox', { name: 'Сообщение' });
    fireEvent.change(input, { target: { value: 'Новая задача' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(state.sendMessage).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(state.sendMessage).toHaveBeenCalledExactlyOnceWith('Новая задача');
    expect(input).toHaveValue('');
  });

  it('confirms the latest real summary from a create entry through the interviewer', () => {
    state.hasGeneration = false;
    state.messages = [user('u1', 'Создать свой'), assistant('summary', 'Всё готово к подтверждению. Проверьте требования.')];
    const { rerender } = render(<MemoryRouter initialEntries={['/create?mode=create&new=test']}><CreateContent /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Запустить генерацию' }));
    expect(state.sendMessage).toHaveBeenCalledWith('Требования подтверждаю. Начни генерацию бенчмарка по согласованной сводке.');
    state.pending = true;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Запустить генерацию' })).not.toBeInTheDocument();
  });

  it('sends only current question option IDs and keeps answered options inactive', () => {
    state.hasGeneration = false;
    state.messages = [assistant('q1', 'Первый вопрос', { agentOptions: [{ id: 'old-id', label: 'Первый ответ' }] }),
      user('u1', 'Первый ответ'), assistant('q2', 'Следующий вопрос', { agentOptions: [{ id: 'current-id', label: 'Второй ответ' }] })];
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Первый ответ' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Второй ответ' }));
    expect(state.sendOption).toHaveBeenCalledWith('current-id', 'Второй ответ');
    state.pending = true;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Второй ответ' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Сообщение' })).toBeDisabled();
  });

  it('allows only the newest unanswered server question and locks its options while a response is pending', () => {
    state.hasGeneration = false;
    state.messages = [assistant('q1', 'Уточнение задачи', { agentOptions: [{ id: 'old', label: 'Старый вариант' }] }),
      assistant('q2', 'Что проверить?', { agentOptions: [{ id: 'accuracy', label: 'Улучшить точность' }] })];
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Старый вариант' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить точность' }));
    expect(state.sendOption).toHaveBeenCalledExactlyOnceWith('accuracy', 'Улучшить точность');
    state.responsePending = true;
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Улучшить точность' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить точность' }));
    expect(state.sendOption).toHaveBeenCalledTimes(1);
    state.responsePending = false;
    state.messages = [...state.messages, user('u1', 'Свой ответ вместо варианта')];
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Улучшить точность' })).toBeDisabled();
  });

  it('keeps the seven source specification rows unknown until supplied by a real contract', () => {
    state.hasGeneration = false;
    render(<MemoryRouter initialEntries={['/create?mode=create&new=test']}><CreateContent /></MemoryRouter>);
    expect(document.querySelector('#specN')).toHaveTextContent('1/7');
    expect(document.querySelectorAll('#specList .empty-v')).toHaveLength(6);
    expect(screen.getByPlaceholderText('Опишите, что нужно проверить…')).toBeVisible();
  });

  it('fills the source specification and progress from the current server snapshot, including corrections and removal', () => {
    state.hasGeneration = false;
    const { rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(useConversationDetailQuery).toHaveBeenLastCalledWith('chat-1', 'user-1');
    specificationState.specification = { goal: 'Надёжность двигателей BMW', domain: 'Автомобили', language: 'Русский' };
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Что проверяем\s*Надёжность двигателей BMW/ })).toBeDisabled();
    expect(document.querySelector('#specN')).toHaveTextContent('4/7');
    specificationState.specification = { ...specificationState.specification, language: 'Английский', metric: 'Rubric checklist', taskFormat: 'Вопрос — ответ', name: 'BMW-Reliability' };
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(document.querySelector('#specN')).toHaveTextContent('7/7');
    expect(document.querySelector('#specBar')).toHaveStyle('--p: 100%');
    expect(screen.getByRole('button', { name: /Язык\s*Английский/ })).toBeInTheDocument();
    specificationState.specification = { goal: 'Новая задача' };
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(document.querySelector('#specN')).toHaveTextContent('2/7');
    expect(screen.getByRole('button', { name: /Язык\s*не задано/ })).toBeInTheDocument();
    expect(screen.queryByText('BMW-Reliability')).not.toBeInTheDocument();
  });
});
