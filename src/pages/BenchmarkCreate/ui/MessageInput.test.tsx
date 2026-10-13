import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { MessageInput } from './MessageInput';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ t: translations.ru, lang: 'ru' }),
}));

describe('MessageInput benchmark creation', () => {
  it('shows one creation action while recommendations await a choice', () => {
    const onSkip = vi.fn();
    const props = {
      inputValue: '',
      isTyping: false,
      awaitingStructuredAnswer: true,
      showSkipButton: true,
      doneMessage: '',
      onSend: vi.fn(),
      onChange: vi.fn(),
      onKeyDown: vi.fn(),
      onSkip,
    };

    const { rerender } = render(<MessageInput {...props} />);
    const createButtons = screen.getAllByRole('button', {
      name: translations.ru.create.createOwnBenchmark,
    });
    expect(createButtons).toHaveLength(1);
    fireEvent.click(createButtons[0]);
    expect(onSkip).toHaveBeenCalledOnce();

    rerender(<MessageInput {...props} isTyping />);
    expect(screen.getByRole('button', { name: translations.ru.create.createOwnBenchmark })).toBeDisabled();
  });

  it('allows a free-form response alongside optional structured choices', () => {
    const onSend = vi.fn();
    render(<MessageInput
      inputValue="А что означает эта метрика?"
      isTyping={false}
      awaitingStructuredAnswer
      showSkipButton={false}
      doneMessage=""
      onSend={onSend}
      onChange={vi.fn()}
      onKeyDown={vi.fn()}
      onSkip={vi.fn()}
    />);
    expect(screen.getByRole('textbox')).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: translations.ru.create.send }));
    expect(onSend).toHaveBeenCalledOnce();
    expect(screen.getByText(translations.ru.create.optionalAnswerHint)).toBeInTheDocument();
  });
});
