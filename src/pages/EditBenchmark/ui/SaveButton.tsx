import { useApp } from "@/hooks/useApp";
import { CheckCircle2, Save, Loader2 } from "lucide-react";

interface Props {
  saved: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const SaveButton = ({ saved, onClick, disabled = false }: Props) => {
  const { t } = useApp();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
      style={{
        backgroundColor: saved ? '#10b981' : 'var(--accent)',
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {disabled ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saved ? t.admin.saved : t.admin.saveChanges}
    </button>
  );
};