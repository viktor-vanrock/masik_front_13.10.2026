import { useEffect, useMemo } from 'react';
import { Loader2, X } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/hooks/useApp';
import { useDictionaryListQuery, useCreateDictionaryMutation, useUpdateDictionaryMutation } from '@/api/settings';
import { useApiError } from '@/hooks/useApiError';
import type { DictionaryCategory, DictionarySettingsEntry } from '@/types';
import { buildDictionaryFormSchema, type DictionaryFormData } from '../schemas';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';

type PairCast = Parameters<typeof useCreateDictionaryMutation>[0];

// Which type needs a parentId, and which list query to populate options from
const PARENT_SOURCE: Partial<Record<string, { category: DictionaryCategory; type: string }>> = {
  'sub-groups': { category: 'taxonomy', type: 'macro-groups' },
  'subdomains': { category: 'domains', type: 'domains' },
};

interface Props {
  category: DictionaryCategory;
  type: string;
  entry?: DictionarySettingsEntry;
  onClose: () => void;
}

export function DictionaryFormDialog({ category, type, entry, onClose }: Props) {
  const { t, lang } = useApp();
  const s = t.admin.settings;
  const isEdit = !!entry;
  const requireParent = type in PARENT_SOURCE;

  const pair = { category, type } as PairCast;
  const createMutation = useCreateDictionaryMutation(pair);
  const updateMutation = useUpdateDictionaryMutation(pair);
  const { serverError, handleError } = useApiError<DictionaryFormData>();

  // Load parent options from admin list queries (as per user requirement)
  const { data: macroGroupsData } = useDictionaryListQuery(
    { category: 'taxonomy' as const, type: 'macro-groups' as const },
    { limit: 500 },
  );
  const { data: domainsData } = useDictionaryListQuery(
    { category: 'domains' as const, type: 'domains' as const },
    { limit: 500 },
  );

  const parentOptions = useMemo(() => {
    if (type === 'sub-groups') return macroGroupsData?.data ?? [];
    if (type === 'subdomains') return domainsData?.data ?? [];
    return [];
  }, [type, macroGroupsData, domainsData]);

  const schema = useMemo(
    () => buildDictionaryFormSchema(s.errors, requireParent),
    [s.errors, requireParent],
  );

  const defaultValues: DictionaryFormData = {
    name: entry?.name ?? '',
    nameEn: entry?.nameEn ?? '',
    description: entry?.description ?? '',
    descriptionEn: entry?.descriptionEn ?? '',
    parentId: entry?.parentId ?? '',
  };

  const { control, handleSubmit, setError, trigger, formState: { isSubmitted } } = useForm<DictionaryFormData>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (isSubmitted) trigger();
  }, [lang, isSubmitted, trigger]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit(async (data) => {
    const basePayload = {
      name: data.name,
      nameEn: data.nameEn,
      ...(data.description ? { description: data.description } : {}),
      ...(data.descriptionEn ? { descriptionEn: data.descriptionEn } : {}),
    };

    const parentPayload =
      requireParent && data.parentId
        ? type === 'sub-groups'
          ? { macroGroupId: data.parentId }
          : type === 'subdomains'
            ? { domainId: data.parentId }
            : {}
        : {};

    const payload = { ...basePayload, ...parentPayload };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(
          { id: entry.id, patch: payload } as Parameters<typeof updateMutation.mutateAsync>[0],
        );
      } else {
        await createMutation.mutateAsync(
          payload as Parameters<typeof createMutation.mutateAsync>[0],
        );
      }
      onClose();
    } catch (e) {
      handleError(e, { fallback: s.saveFallback, onForbidden: 'message', setError });
    }
  });

  const titleText = isEdit ? s.formTitleEdit : s.formTitleCreate;
  const submitText = isEdit ? s.submitSave : s.submitCreate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {titleText}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {requireParent && (
            <Controller
              name="parentId"
              control={control}
              render={({ field, fieldState }) => (
                <Field label={s.fieldParent} required error={fieldState.error?.message}>
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: `1px solid ${fieldState.error ? 'var(--danger)' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">{s.parentPlaceholder}</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {lang === 'ru' ? opt.name : opt.nameEn}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            />
          )}

          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field label={s.fieldName} required error={fieldState.error?.message}>
                <Input
                  name="name"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                />
              </Field>
            )}
          />

          <Controller
            name="nameEn"
            control={control}
            render={({ field, fieldState }) => (
              <Field label={s.fieldNameEn} required error={fieldState.error?.message}>
                <Input
                  name="nameEn"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                />
              </Field>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Field label={s.fieldDescription}>
                <Input name="description" value={field.value ?? ''} onChange={field.onChange} />
              </Field>
            )}
          />

          <Controller
            name="descriptionEn"
            control={control}
            render={({ field }) => (
              <Field label={s.fieldDescriptionEn}>
                <Input name="descriptionEn" value={field.value ?? ''} onChange={field.onChange} />
              </Field>
            )}
          />

          {serverError && (
            <div
              role="alert"
              className="p-2 rounded-lg text-xs"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}
            >
              {serverError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {s.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
