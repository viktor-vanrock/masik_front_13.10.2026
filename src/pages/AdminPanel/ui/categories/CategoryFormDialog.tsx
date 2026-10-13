import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useApp } from '@/hooks/useApp';
import {
  useCreateSuiteMutation,
  useUpdateSuiteMutation,
  useRestoreSuiteMutation,
} from '@/api/catalog';
import { useApiError } from '@/hooks/useApiError';
import { isSoftDeletedConflict } from '@/services/http';
import type { BenchmarkSuite } from '@/types';
import { RestoreModal } from '@ui/RestoreModal';

import { buildCategoryFormSchema, type CategoryFormData } from './schemas';

interface Props {
  category?: BenchmarkSuite;
  onClose: () => void;
}

const emptyValues: CategoryFormData = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
};

export const CategoryFormDialog = ({ category, onClose }: Props) => {
  const { t, lang } = useApp();
  const isEdit = !!category;

  const createMutation = useCreateSuiteMutation();
  const updateMutation = useUpdateSuiteMutation();
  const restoreMutation = useRestoreSuiteMutation();
  const { serverError, handleError } = useApiError<CategoryFormData>();
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const schema = useMemo(
    () => buildCategoryFormSchema(t.admin.categories.errors),
    [t.admin.categories.errors],
  );

  const defaultValues: CategoryFormData = category
    ? {
      name: category.name,
      nameEn: category.nameEn,
      description: category.description ?? '',
      descriptionEn: category.descriptionEn ?? '',
    }
    : emptyValues;

  const methods = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (methods.formState.isSubmitted) methods.trigger();
  }, [lang, methods]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const restoreEntityName = methods.getValues('name') || methods.getValues('nameEn') || '';

  const onSubmit = methods.handleSubmit(async (data) => {
    const payload = {
      name: data.name,
      nameEn: data.nameEn,
      ...(data.description ? { description: data.description } : {}),
      ...(data.descriptionEn ? { descriptionEn: data.descriptionEn } : {}),
    };
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, patch: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (e) {
      if (!category && isSoftDeletedConflict(e)) {
        setRestoreId(e.payload.deletedId);
        return;
      }
      handleError(e, {
        fallback: t.admin.categories.saveFallback,
        onForbidden: 'message',
        setError: methods.setError,
      });
    }
  });

  const titleText = isEdit
    ? t.admin.categories.formTitleEdit
    : t.admin.categories.formTitleCreate;
  const submitText = isEdit
    ? t.admin.categories.submitSave
    : t.admin.categories.submitCreate;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={() => !isPending && onClose()}
      >
        <div
          className="w-full max-w-md rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {titleText}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
              <Field
                label={t.admin.categories.fieldName}
                required
                error={methods.formState.errors.name?.message}
              >
                <input
                  type="text"
                  {...methods.register('name')}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: `1px solid ${
                      methods.formState.errors.name ? 'var(--danger)' : 'var(--border)'
                    }`,
                  }}
                />
              </Field>

              <Field
                label={t.admin.categories.fieldNameEn}
                required
                error={methods.formState.errors.nameEn?.message}
              >
                <input
                  type="text"
                  {...methods.register('nameEn')}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: `1px solid ${
                      methods.formState.errors.nameEn ? 'var(--danger)' : 'var(--border)'
                    }`,
                  }}
                />
              </Field>

              <Field label={t.admin.categories.fieldDescription}>
                <textarea
                  {...methods.register('description')}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />
              </Field>

              <Field label={t.admin.categories.fieldDescriptionEn}>
                <textarea
                  {...methods.register('descriptionEn')}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                />
              </Field>

              {serverError && (
                <div
                  role="alert"
                  className="p-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                  }}
                >
                  {serverError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {t.admin.categories.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {submitText}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {restoreId && (
        <RestoreModal
          entityName={restoreEntityName}
          isPending={restoreMutation.isPending}
          onClose={() => setRestoreId(null)}
          onConfirm={async () => {
            await restoreMutation.mutateAsync(restoreId);
            setRestoreId(null);
            onClose();
          }}
        />
      )}
    </>
  );
};

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
      {label}
      {required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
        {error}
      </p>
    )}
  </div>
);
