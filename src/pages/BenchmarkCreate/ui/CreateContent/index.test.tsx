import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { CreateContent } from './index';

const state = vi.hoisted(() => ({ jobId: 'job-1', noop: vi.fn() }));
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ lang: 'ru', t: translations.ru, user: { id: 'user-1' } }),
}));
vi.mock('@/api/catalog', () => ({
  useBenchmarkQuery: () => ({ data: undefined, isPending: false, isError: false, refetch: state.noop }),
  useBenchmarksQuery: () => ({ data: { data: [] }, isPending: false, isError: false, refetch: state.noop }),
  useSuiteQuery: () => ({ data: undefined, isPending: false, isError: false, refetch: state.noop }),
}));
vi.mock('./hooks/usePublishState', () => ({
  usePublishState: () => ({ stage: 'idle', progress: 0, publishedId: '', publishError: null,
    softDeletedId: null, isPending: false, isRestoring: false, reset: state.noop,
    handlePublish: state.noop, clearSoftDeletedId: state.noop, handleRestoreConfirm: state.noop }),
}));
vi.mock('./hooks/useConversation/useConversation', () => ({
  useConversation: () => ({
    dialogues: [], activeId: 'chat-1', entryConversationId: null, isTyping: false, connectionError: null,
    activeDialogue: { id: 'chat-1', conversationId: 'chat-1', conversationStatus: 'completed',
      benchmarkName: 'Test chat', benchmarkNameEn: 'Test chat', messages: [], status: 'done', phase: 'create' },
    generation: { jobId: state.jobId, status: 'succeeded', examples: [{ input: 'Question one' }, { input: 'Question two' }],
      progress: { phase: null, completedGenerations: 2, totalGenerations: 2 }, error: null },
    production: undefined,
    loadMoreDialogues: state.noop, loadMoreArchived: state.noop, hasMoreDialogues: false, hasMoreArchived: false,
    isLoadingMoreDialogues: false, isLoadingMoreArchived: false, archivedTotal: 0,
    startNewSession: state.noop, retryEntrySession: state.noop, startDerivedCreation: state.noop,
    renameDialogue: state.noop, toggleArchive: state.noop, togglePin: state.noop, sendMessage: state.noop,
    acceptRecommendation: state.noop, rejectRecommendation: state.noop, retryGeneration: state.noop,
    refreshGeneration: state.noop, cancelGeneration: state.noop, refreshProduction: state.noop, startProduction: state.noop,
  }),
}));
vi.mock('../Sidebar', () => ({ Sidebar: () => null }));
vi.mock('../CreateHeader', () => ({ CreateHeader: () => null }));
vi.mock('../MessageInput', () => ({ MessageInput: () => null }));

describe('CreateContent generation dock', () => {
  it('keeps feedback outside tasks, preserves selection on collapse and resets for a new job', () => {
    state.jobId = 'job-1';
    const { container, rerender } = render(<MemoryRouter><CreateContent /></MemoryRouter>);
    const dock = container.querySelector('details')!;
    const summary = dock.querySelector('summary')!;
    expect(dock.open).toBe(false);
    expect(summary).toHaveTextContent('Задания созданы (2)');

    fireEvent.click(summary);
    expect(dock.open).toBe(true);
    const tasks = screen.getAllByRole('article');
    expect(tasks).toHaveLength(2);
    expect(tasks.every((task) => !task.contains(summary))).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 1' }));
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();

    fireEvent.click(summary);
    fireEvent.click(summary);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();

    state.jobId = 'job-2';
    rerender(<MemoryRouter><CreateContent /></MemoryRouter>);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).toBeChecked();
  });
});
