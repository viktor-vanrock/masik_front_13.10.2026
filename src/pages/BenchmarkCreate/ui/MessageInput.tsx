import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DialogueStatus, DialogueCompletionKind } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  inputValue: string;
  isTyping: boolean;
  disabled?: boolean;
  placeholder?: string;
  status?: DialogueStatus;
  completionKind?: DialogueCompletionKind;
  doneMessage: string;
  onSend: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const MessageInput = ({
  inputValue,
  isTyping,
  disabled = false,
  placeholder,
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
    <div className="space-y-2">
      <div className="benchmark-chat-composer-box flex gap-3 items-end h-[77px] min-h-[77px] border border-[#d1d7de] rounded-[20px] px-4 py-3 bg-white shadow-[0_12px_40px_-20px_#1e1e2030] max-[600px]:px-4">
        <div className="flex min-w-0 flex-1 items-center">
          <textarea
            id="benchmark-chat-answer"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder ?? (lang === 'ru' ? 'Сообщение...' : 'Message...')}
            rows={2}
            className="benchmark-chat-composer-textarea w-full min-h-[44px] max-h-[44px] py-1.5 px-0 border-0 bg-transparent text-[13px] text-[#1e1e20] leading-[1.5] resize-none outline-none shadow-none focus-visible:outline-none focus-visible:shadow-none max-[600px]:text-base"
            style={{ scrollbarWidth: 'auto', scrollbarColor: '#686e78 transparent' }}
          />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!inputValue.trim() || isTyping || disabled}
          aria-label={t.create.send}
          className="benchmark-chat-send grid w-[42px] h-[42px] flex-none place-items-center rounded-full bg-[#515dad] text-white cursor-pointer transition-colors duration-150 hover:bg-[#465195] disabled:bg-[#515dad] disabled:opacity-65"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className="w-[18px] h-[18px] fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]">
            <path d="M4 9h10m-4-4 4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
