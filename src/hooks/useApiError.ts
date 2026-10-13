import { useState, useCallback } from 'react';
import type { FieldValues, UseFormSetError, FieldPath } from 'react-hook-form';
import { BenchmarkOperationTimeoutError } from '@/api/catalog/operations';
import { useApp } from '@/hooks/useApp';
import {
  ApiException,
  formatServerErrorMessage,
  isUsageConflictError,
  isDuplicateConflictError,
  extractFieldErrors,
} from '@/services/http';

interface HandleErrorOptions<T extends FieldValues> {
  fallback: string;
  /** Called when status is 403. Provide `'message'` to show inline, or a callback (e.g. navigate). */
  onForbidden?: 'message' | (() => void);
  /** RHF setError — enables field-level 400 mapping. */
  setError?: UseFormSetError<T>;
}

export function useApiError<T extends FieldValues = FieldValues>() {
  const { t } = useApp();
  const [serverError, setServerError] = useState<string | null>(null);

  const clearError = useCallback(() => setServerError(null), []);

  const handleError = useCallback(
    (e: unknown, options: HandleErrorOptions<T>): void => {
      setServerError(null);

      if (e instanceof BenchmarkOperationTimeoutError) {
        setServerError(
          t.common.errors.operationDelayed.replace(
            '{operationId}',
            e.receipt.operationId,
          ),
        );
        return;
      }

      if (
        e instanceof ApiException &&
        e.payload.code === 'TEST_METRIC_REQUIRED'
      ) {
        setServerError(t.common.errors.metricRequiredForPublication);
        return;
      }

      if (!(e instanceof ApiException)) {
        setServerError(formatServerErrorMessage(e) ?? options.fallback);
        return;
      }

      if (e.status === 403) {
        if (options.onForbidden === 'message') {
          setServerError(t.common.errors.forbidden);
        } else if (typeof options.onForbidden === 'function') {
          options.onForbidden();
        } else {
          setServerError(t.common.errors.forbidden);
        }
        return;
      }

      if (e.status === 400) {
        const fieldErrors = extractFieldErrors(e);
        const { _general: general, ...fields } = fieldErrors;

        if (options.setError && Object.keys(fields).length > 0) {
          Object.entries(fields).forEach(([field, message]) => {
            options.setError!(field as FieldPath<T>, { type: 'server', message });
          });
          if (general) setServerError(general);
        } else {
          setServerError(formatServerErrorMessage(e) ?? options.fallback);
        }
        return;
      }

      if (isUsageConflictError(e)) {
        setServerError(
          t.common.errors.usageConflict.replace('{count}', String(e.payload.usageCount)),
        );
        return;
      }

      if (isDuplicateConflictError(e)) {
        setServerError(t.common.errors.duplicateConflict);
        return;
      }

      setServerError(formatServerErrorMessage(e) ?? options.fallback);
    },
    [t],
  );

  return { serverError, clearError, handleError };
}
