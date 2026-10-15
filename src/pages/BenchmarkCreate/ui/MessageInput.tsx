import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DialogueStatus, DialogueCompletionKind } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  inputValue: string;
  isTyping: boolean;
  status?: DialogueStatus;
  completionKind?: DialogueCompletionKind;
  awaitingStructuredAnswer: boolean;
  showSkipButton: boolean;
  doneMessage: string;
  onSend: () => void;
  onChange: (value: string) => void; 
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSkip: () => void;
}

export const MessageInput = ({
  inputValue,
  isTyping,
  status,
  completionKind,
  doneMessage,
  onSend,
  onChange,
  onKeyDown,
}: Props) => {
  const { t, lang } = useApp();

  if (status === DialogueStatus.Done) {
    if (completionKind === DialogueCompletionKind.Create) {
      return null;
    }
    
    return (
      <div
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
        style={{
          backgroundColor: 'var(--status-done-bg)',
          border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)',
          color: 'var(--success)',
        }}
      >
        <CheckCircle2 size={16} />
        {doneMessage}
      </div>
    );
  }
  
  return (
    <div className="benchmark-chat-input space-y-2">
      <div
        className="benchmark-chat-input__field flex gap-3 items-end rounded-xl p-3"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="benchmark-chat-input__content">
          <textarea
            id="benchmark-chat-answer"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={lang === 'ru' ? 'Сообщение...' : 'Message...'}
            rows={2}
            className="flex-1 text-sm bg-transparent resize-none outline-none min-h-[24px] max-h-32"
            style={{
              lineHeight: '1.5',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!inputValue.trim() || isTyping}
          aria-label={t.create.send}
          className="benchmark-chat-input__send p-2 rounded-full transition-colors flex-shrink-0"
          style={{
            backgroundColor: '#515dad',
            color: '#fff',
          }}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10m-4-4 4 4-4 4" /></svg>
        </button>
      </div>
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end"
      >
        {/* {showSkipButton && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isTyping}
            className="text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <PlusCircle size={12} />
            {t.create.createOwnBenchmark}
          </button>
        )} */}
        {/* <p className="text-xs text-center sm:text-right" style={{ color: 'var(--text-dim)' }}>
          {awaitingStructuredAnswer
            ? t.create.optionalAnswerHint
            : lang === 'ru'
              ? 'Enter — отправить, Shift+Enter — перенос строки'
              : 'Enter to send, Shift+Enter for new line'}
        </p> */}
      </div>
    </div>
  );
}
