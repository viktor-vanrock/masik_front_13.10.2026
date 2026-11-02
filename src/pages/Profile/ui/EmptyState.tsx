import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useApp } from '@/hooks/useApp';


export const EmptyState = () => {
  const { t } = useApp();
  
  return (
    <div
      className="grid justify-items-center gap-[14px] rounded-[24px] border border-dashed border-[#acb3cf33] px-6 py-9 text-center text-[14px] text-[#acb3cf]"
    >
      <MessageSquare size={32} className="text-[#8890ad]" />
      <p className="m-0 text-[18px] font-semibold text-[#f2f3fc]">
        {t.profile.emptyDialogues}
      </p>
      <Link
        to="/create"
        className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-[14px] text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-h-11 bg-[#5865c9] px-5 text-white hover:bg-[#4552b4]"
      >
        {t.profile.newBenchmark}
      </Link>
    </div>
  );
}