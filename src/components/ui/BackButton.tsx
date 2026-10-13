import { useApp } from '@/hooks/useApp';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
    link: string,
    text?: string
}
export const BackButton = ({ link, text }: Props) => {
  const { t } = useApp();

  return (
    <Link
      to={link}
      className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
      style={{ color: 'var(--text-muted)' }}
    >
      <ArrowLeft size={14} />
      {text || t.common.back}
    </Link>
  )
}