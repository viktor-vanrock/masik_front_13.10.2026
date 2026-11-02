/**
 * useEnumLabels — тонкий хук поверх `formatEnum`, который инжектит `t`
 * из AppContext, чтобы вызывающему коду не приходилось каждый раз
 * деструктурировать `const { t } = useApp()` ради одной строки.
 */
import { useApp } from './useApp';
import { formatEnum, type EnumKind } from '@/utils/format/enum';

export function useEnumLabels() {
  const { t } = useApp();
  return (kind: EnumKind, value: string | null | undefined): string =>
    formatEnum(t, kind, value);
}
