import { act, fireEvent, render, screen } from '@testing-library/react';
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
      onSend,
      onChange: vi.fn(),
      onKeyDown: vi.fn(),
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
      onSend={onSend}
      onChange={vi.fn()}
      onKeyDown={vi.fn()}
    />);
    expect(screen.getByRole('textbox')).toBeEnabled();
    const sendButton = screen.getByRole('button', { name: translations.ru.create.send });
    expect(sendButton).toBeEnabled();
    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledOnce();
  });

  it('grows with content, caps long input with scrolling, and shrinks after sending', () => {
    const props = { isTyping: false, onSend: vi.fn(), onChange: vi.fn(), onKeyDown: vi.fn() };
    const { rerender } = render(<MessageInput {...props} inputValue="" />);
    const textarea = screen.getByRole('textbox');
    let contentHeight = 120;
    Object.defineProperty(textarea, 'scrollHeight', { get: () => contentHeight });

    rerender(<MessageInput {...props} inputValue="Несколько строк" />);
    expect(textarea).toHaveStyle({ height: '120px', overflowY: 'hidden' });
    contentHeight = 400;
    rerender(<MessageInput {...props} inputValue="Большой текст" />);
    expect(textarea).toHaveStyle({ height: '180px', overflowY: 'auto' });
    contentHeight = 32;
    rerender(<MessageInput {...props} inputValue="" />);
    expect(textarea).toHaveStyle({ height: '40px', overflowY: 'hidden' });
  });

  it('recalculates wrapped content on width changes and releases the observer', () => {
    let onResize: ResizeObserverCallback = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { onResize = callback; }
      observe() {}
      disconnect = disconnect;
    });
    try {
      const { unmount } = render(<MessageInput inputValue="Текст с переносами" isTyping={false}
        onSend={vi.fn()} onChange={vi.fn()} onKeyDown={vi.fn()} />);
      const textarea = screen.getByRole('textbox');
      Object.defineProperty(textarea, 'scrollHeight', { value: 160 });
      act(() => onResize([{ contentRect: { width: 320 } } as ResizeObserverEntry], {} as ResizeObserver));
      expect(textarea).toHaveStyle({ height: '160px', overflowY: 'hidden' });
      unmount();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
