import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import type { ChatMessage } from '@/types';
import { MessageBubble } from './MessageBubble';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ t: translations.ru, lang: 'ru' }),
}));

describe('MessageBubble recommendations', () => {
  it('groups each of three recommendations with its own actions and settled status', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const message = {
      id: 'three-results', role: 'assistant', content: 'Результаты', timestamp: '',
      recommendations: ['benchmark-a', 'benchmark-b', 'benchmark-c'],
      recommendationItems: [
        { testId: 'benchmark-a', id: 'recommendation-a', status: 'pending' },
        { testId: 'benchmark-b', id: 'recommendation-b', status: 'pending' },
        { testId: 'benchmark-c', id: 'recommendation-c', status: 'pending' },
      ],
    } satisfies ChatMessage;
    const view = (msg: ChatMessage) =>
      <MemoryRouter><MessageBubble msg={msg} benchmarks={[]} onAcceptRecommendation={onAccept} onRejectRecommendation={onReject} /></MemoryRouter>;
    const { rerender } = render(view(message));

    for (const id of message.recommendations) {
      const group = within(screen.getByRole('group', { name: id }));
      expect(group.getByRole('link', { name: `${id}: ${translations.ru.create.viewBenchmark}` })).toHaveAttribute('href', `/benchmark/${id}`);
      expect(group.getByRole('button', { name: translations.ru.create.recommendYes })).toBeEnabled();
      expect(group.getByRole('button', { name: translations.ru.create.recommendNo })).toBeEnabled();
    }
    fireEvent.click(within(screen.getByRole('group', { name: 'benchmark-b' })).getByRole('button', { name: translations.ru.create.recommendYes }));
    fireEvent.click(within(screen.getByRole('group', { name: 'benchmark-c' })).getByRole('button', { name: translations.ru.create.recommendNo }));
    expect(onAccept).toHaveBeenCalledExactlyOnceWith('recommendation-b');
    expect(onReject).toHaveBeenCalledExactlyOnceWith('recommendation-c');

    rerender(view({ ...message, recommendationItems: [message.recommendationItems[0],
      { ...message.recommendationItems[1], status: 'selected' },
      { ...message.recommendationItems[2], status: 'rejected' },
    ] }));
    expect(within(screen.getByRole('group', { name: 'benchmark-a' })).getAllByRole('button')).toHaveLength(2);
    expect(within(screen.getByRole('group', { name: 'benchmark-b' })).getByRole('status')).toHaveTextContent(translations.ru.create.recommendDone);
    expect(within(screen.getByRole('group', { name: 'benchmark-c' })).getByRole('status')).toHaveTextContent(translations.ru.create.recommendNo);
  });

  it('uses the clicked benchmark recommendation ID', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(<MemoryRouter><MessageBubble
      msg={{
        id: 'message-1', role: 'assistant', content: 'Результаты',
        timestamp: '2026-09-23T00:00:00.000Z',
        recommendations: ['benchmark-a', 'benchmark-b'],
        recommendationItems: [
          { testId: 'benchmark-a', id: 'recommendation-a', status: 'pending' },
          { testId: 'benchmark-b', id: 'recommendation-b', status: 'pending' },
        ],
      }}
      benchmarks={[]}
      onAcceptRecommendation={onAccept}
      onRejectRecommendation={onReject}
    /></MemoryRouter>);

    fireEvent.click(screen.getAllByRole('button', { name: translations.ru.create.recommendYes })[1]);
    expect(onAccept).toHaveBeenCalledWith('recommendation-b');
    fireEvent.click(screen.getAllByRole('button', { name: translations.ru.create.recommendNo })[0]);
    expect(onReject).toHaveBeenCalledWith('recommendation-a');
  });
});

describe('MessageBubble Markdown', () => {
  const msg = { id: 'markdown-1', role: 'assistant' as const, timestamp: '2026-10-28T00:00:00.000Z' };

  it('renders assistant paragraphs, emphasis, lists, links and code from restored content', () => {
    const { container } = render(<MessageBubble benchmarks={[]} msg={{ ...msg, content:
      '## Результат\n\n- **Оценка**: точность\n- *Язык*: русский\n\n1. Первый шаг\n2. Второй шаг\n\n[Документация](https://example.com) и `accuracy`\n\n```json\n{"score": 1}\n```',
    }} />);
    expect(screen.getByRole('heading', { name: 'Результат' })).toBeInTheDocument();
    expect(screen.getByText('Оценка').tagName).toBe('STRONG');
    expect(screen.getByText('Язык').tagName).toBe('EM');
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Документация' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('accuracy').tagName).toBe('CODE');
    expect(container.querySelector('pre code')).toHaveTextContent('{"score": 1}');
  });

  it('keeps user text literal', () => {
    const { container } = render(<MessageBubble benchmarks={[]} msg={{ ...msg, role: 'user', content: '**Оценка**\n- Пример' }} />);
    expect(container).toHaveTextContent('**Оценка**');
    expect(container.querySelector('strong, ul')).toBeNull();
  });

  it('uses reference typography for example hints and the greeting follow-up without changing their text', () => {
    const greeting = 'Опишите, что хотите проверить, — сначала поищу в каталоге. Или выберите сценарий:';
    const hint = 'Например: ответы на вопросы по документам.';
    render(<MessageBubble benchmarks={[]} msg={{ ...msg, content: `Здравствуйте!\n\n${greeting}\n\n${hint}` }} />);
    expect(screen.getByText('Здравствуйте!')).not.toHaveClass('muted');
    expect(screen.getByText(greeting)).toHaveClass('muted');
    expect(screen.getByText(greeting)).not.toHaveAttribute('style');
    expect(screen.getByText(hint)).toHaveClass('muted');
    expect(screen.getByText(hint)).toHaveStyle({ fontSize: '14px' });
  });

  it('renders the entire summary as Markdown and keeps its confirmation action', () => {
    const onConfirmGeneration = vi.fn();
    render(<MessageBubble benchmarks={[]} onConfirmGeneration={onConfirmGeneration} msg={{ ...msg, content:
      '## Всё готово к подтверждению: черновик\n\nПроверьте требования:\n\n- **Оценка**: точность\n- Язык: русский\n\nДополнительное условие сохранено.',
    }} />);
    expect(screen.getByRole('heading', { name: 'Всё готово к подтверждению: черновик' })).toBeInTheDocument();
    expect(screen.getByText('Оценка').tagName).toBe('STRONG');
    expect(screen.getByText('Дополнительное условие сохранено.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Запустить генерацию' }));
    expect(onConfirmGeneration).toHaveBeenCalledOnce();
  });

  it('does not render raw HTML, unsafe URLs or remote images', () => {
    const { container } = render(<MessageBubble benchmarks={[]} msg={{ ...msg, content:
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n[Опасная ссылка](javascript:alert%281%29)\n\n![Описание](https://example.com/image.png)',
    }} />);
    expect(container.querySelector('script, img')).toBeNull();
    expect(screen.getByText('Опасная ссылка')).not.toHaveAttribute('href', expect.stringMatching(/^javascript:/));
    expect(screen.getByText('Описание')).toBeInTheDocument();
  });
});


describe('MessageBubble server options', () => {
  const message = { id: 'options', role: 'assistant' as const, timestamp: '', content: 'Выберите вариант' };
  it('sends the server option ID and label instead of its displayed text', () => {
    const sendOption = vi.fn();
    const sendText = vi.fn();
    const { container } = render(<MessageBubble benchmarks={[]} onSendOption={sendOption} onSendText={sendText} msg={{ ...message, agentOptions: [{ id: 'option-17', label: 'Русский' }] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(sendOption).toHaveBeenCalledWith('option-17', 'Русский');
    expect(sendText).not.toHaveBeenCalled();
    expect(container.querySelector('.m.a > .ava + .body > .chips')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Русский' })).not.toHaveClass('pri');
  });
  it.each(['Улучшить точность', 'Усилить проверку', 'Модифицировать критерий', 'Адаптировать вопросы', 'Русифицировать ответы'])('allows the server question answer "%s"', (label) => {
    const sendOption = vi.fn();
    render(<MessageBubble benchmarks={[]} onSendOption={sendOption} msg={{ ...message, agentOptions: [{ id: 'goal-accuracy', label }] }} />);
    const option = screen.getByRole('button', { name: label });
    expect(option).toBeEnabled();
    expect(option).not.toHaveAttribute('aria-disabled');
    fireEvent.click(option);
    expect(sendOption).toHaveBeenCalledExactlyOnceWith('goal-accuracy', label);
  });
  it('uses structured values for text prompts and keeps modification options inert', () => {
    const sendText = vi.fn();
    render(<MessageBubble benchmarks={[]} onSendText={sendText} msg={{ ...message, structuredPrompt: { kind: 'single', options: [{ value: 'new', label: 'Создать свой' }, { value: 'modify', label: 'Улучшить бенчмарк' }] } }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Создать свой' }));
    expect(screen.getByRole('button', { name: 'Создать свой' })).toHaveClass('pri');
    expect(sendText).toHaveBeenCalledWith('new');
    const modify = screen.getByRole('button', { name: 'Улучшить бенчмарк' });
    expect(modify).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(modify);
    expect(sendText).toHaveBeenCalledTimes(1);
  });
  it('disables history chips when the shell says they are no longer current', () => {
    const sendText = vi.fn();
    render(<MessageBubble benchmarks={[]} onSendText={sendText} optionsDisabled msg={{ ...message, quickReplies: ['Русский'] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(sendText).not.toHaveBeenCalled();
  });
  it('keeps local benchmark improvement and adaptation actions inert', () => {
    const sendText = vi.fn();
    const labels = ['Улучшить существующий', 'Адаптировать на русский', 'Русифицировать бенчмарк'];
    render(<MessageBubble benchmarks={[]} onSendText={sendText} msg={{ ...message, quickReplies: labels }} />);
    for (const label of labels) {
      const option = screen.getByRole('button', { name: label });
      expect(option).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(option);
    }
    expect(sendText).not.toHaveBeenCalled();
  });
  it('keeps adaptation task labels selectable when they are not modification commands', () => {
    const sendOption = vi.fn();
    render(<MessageBubble benchmarks={[]} onSendOption={sendOption} msg={{ ...message, agentOptions: [{ id: 'adaptation', label: 'Адаптация к новым условиям' }] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Адаптация к новым условиям' }));
    expect(sendOption).toHaveBeenCalledWith('adaptation', 'Адаптация к новым условиям');
  });
  it('disables generation confirmation when the shell says the summary is no longer current', () => {
    const confirm = vi.fn();
    render(<MessageBubble benchmarks={[]} onConfirmGeneration={confirm} optionsDisabled msg={{ ...message, content: 'Всё готово к подтверждению' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Запустить генерацию' }));
    expect(confirm).not.toHaveBeenCalled();
  });
});
