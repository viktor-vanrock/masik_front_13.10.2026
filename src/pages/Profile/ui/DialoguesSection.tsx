import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { DialoguesList } from './DialoguesList';
import type { Dialogue } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogues: Dialogue[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const DialoguesSection = ({ dialogues, isPending, isError, onRetry }: Props) => {
  const { t } = useApp();

  return (
    <section className="mt-14 grid gap-[18px] max-[700px]:mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-[24px] leading-[1.2] font-medium tracking-[-.01em]">
          {t.profile.creationSessions}
        </h2>
        <Link
          to="/create"
          className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-[14px] text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 border-[#ffffff1a] bg-[#ffffff14] text-[#f2f3fc] hover:not-disabled:bg-[#ffffff1f]"
        >
          <PlusCircle size={14} />
          {t.profile.newBenchmark}
        </Link>
      </div>

      {isPending ? (
        <p role="status" className="text-[14px] text-[#acb3cf]">
          {t.common.loading}
        </p>
      ) : isError ? (
        <div role="alert" className="text-[14px] text-[#ff91a0]">
          <p>{t.profile.dialoguesLoadError}</p>
          <button type="button" onClick={onRetry} className="underline">
            {t.catalogue.retry}
          </button>
        </div>
      ) : dialogues.length === 0 ? (
        <EmptyState />
      ) : (
        <DialoguesList dialogues={dialogues} />
      )}
    </section>
  );
}
