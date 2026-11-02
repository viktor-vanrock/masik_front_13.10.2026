import { useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

type Props = {
  inputValue: string;
  isTyping: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSend: () => void;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MessageInput({ inputValue, isTyping, disabled = false, placeholder,
  onSend, onChange, onKeyDown }: Props) {
  const { t } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const resize = () => {
      const empty = !textarea.value;
      if (empty) textarea.value = textarea.placeholder;
      textarea.style.height = 'auto';
      const height = textarea.scrollHeight;
      if (empty) textarea.value = '';
      textarea.style.height = `${Math.max(40, Math.min(height, 180))}px`;
      textarea.style.overflowY = height > 180 ? 'auto' : 'hidden';
    };
    resize();
    const container = textarea.parentElement;
    if (!container || typeof ResizeObserver === 'undefined') return;
    let width = container.clientWidth;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === width) return;
      width = entry.contentRect.width;
      resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [inputValue, placeholder]);

  return <div className="composer">
    <form id="cmpF" onSubmit={(event) => { event.preventDefault(); if (inputValue.trim() && !disabled && !isTyping) onSend(); }}>
      <label className="sr-only" htmlFor="cmp">Сообщение</label>
      <textarea id="cmp" ref={textareaRef} rows={1} value={inputValue} disabled={disabled}
        placeholder={placeholder || 'Опишите задачу или ответьте на вопрос…'}
        onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />
      <button className="btn btn-primary send" type="submit" disabled={!inputValue.trim() || isTyping || disabled}
        aria-label={t.create.send}><ArrowUp aria-hidden="true" /></button>
    </form>
    <p className="hint">Enter — отправить · Shift + Enter — новая строка</p>
  </div>;
}
