import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { MessageInput } from './MessageInput';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ t: translations.ru, lang: 'ru' }),
}));

describe('MessageInput benchmark creation', () => {
  it('renders textarea and send button, send is disabled when empty', () => {
    const onSend = vi.fn();
    const props = {
      inputValue: '',
      isTyping: false,
      awaitingStructuredAnswer: true,
      showSkipButton: true,
      doneMessage: '',
      onSend,
      onChange: vi.fn(),
      onKeyDown: vi.fn(),
      onSkip: vi.fn(),
    };

    render(<MessageInput {...props} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: translations.ru.create.send })).toBeDisabled();
  });

  it('enables send button with text and fires onSend on click', () => {
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
    const sendButton = screen.getByRole('button', { name: translations.ru.create.send });
    expect(sendButton).toBeEnabled();
    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledOnce();
  });
});
