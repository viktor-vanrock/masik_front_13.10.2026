import { useParams, Navigate } from 'react-router-dom';
import { DICTIONARY_TYPES_BY_CATEGORY } from '@/types';
import { ROUTES } from '@/routes/routes.constants';
import type { DictionaryCategory } from '@/types';
import { DictionaryContent } from './ui/DictionaryContent';

function parseValidPair(
  category: string,
  type: string,
): { category: DictionaryCategory; type: string } | undefined {
  const types = DICTIONARY_TYPES_BY_CATEGORY[category as DictionaryCategory];
  if (!types || !(types as readonly string[]).includes(type)) return undefined;
  return { category: category as DictionaryCategory, type };
}

export function AdminSettings() {
  const { category = '', type = '' } = useParams<{ category: string; type: string }>();
  const pair = parseValidPair(category, type);

  if (!pair) return <Navigate to={ROUTES.ADMIN} replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DictionaryContent category={pair.category} type={pair.type} />
    </div>
  );
}
