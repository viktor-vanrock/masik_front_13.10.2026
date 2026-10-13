import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  BenchmarkOperationTimeoutError,
  useRestoreMyCatalogSubmissionMutation,
  useSubmitCatalogEntryMutation,
  benchmarkFormToCreateDto,
} from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { useApiError } from '@/hooks/useApiError';
import { isSoftDeletedConflict } from '@/services/http';
import { RestoreModal } from '@ui/RestoreModal';

import { STEPS, getStepTitle } from './consts';
import { Stepper } from './ui/Stepper';
import { Step1 } from './ui/Step1';
import { Step2 } from './ui/Step2';
import { Step3 } from './ui/Step3';
import { Step4 } from './ui/Step4';
import { Step5 } from './ui/Step5';
import {
  buildBenchmarkFormSchemas,
  type BenchmarkFormData,
} from './schemas/formSchema';
import { validateCurrentStep } from './utils';

const defaultValues: BenchmarkFormData = {
  suiteId: '',
  name: '', nameEn: '', description: '', descriptionEn: '',
  codebaseName: '', codebaseUrl: '', paperTitle: '', paperUrl: '',
  metrics: '', instructions: '', instructionsEn: '',
  gigaMetricAdapterName: '', gigaMetricSetUrl: '', gigaMetricLaunchCommand: '',
  macroGroupId: '', subGroupIds: [], abilityTaxonIds: [],
  taskTypeId: '', modalityIds: [], languageId: '', difficultyId: '',
  capabilityIds: [],
  sizeInSamples: '', medianSampleSizeWords: '',
  domainIds: [], subdomainIds: [],
  examples: [{ input: '', output: '', explanation: '' }],
};

export function NewBenchmark() {
  const { t, lang } = useApp();
  const [step, setStep] = useState(0);
  const [forbidden, setForbidden] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [delayedOperationId, setDelayedOperationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { serverError, handleError } = useApiError<BenchmarkFormData>();

  const createMutation = useSubmitCatalogEntryMutation();
  const restoreMutation = useRestoreMyCatalogSubmissionMutation();

  const schemas = useMemo(
    () => buildBenchmarkFormSchemas(t.benchmark.errors),
    [t.benchmark.errors],
  );

  const methods = useForm<BenchmarkFormData>({
    resolver: zodResolver(schemas.form),
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const { getValues, setError, clearErrors } = methods;

  useEffect(() => {
    if (methods.formState.isSubmitted) methods.trigger();
  }, [lang, methods]);

  const handleNext = async () => {
    const isValid = await validateCurrentStep({
      getValues,
      setError,
      clearErrors,
      step,
      schemas,
    });
    if (isValid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: BenchmarkFormData) => {
    const dto = benchmarkFormToCreateDto(data);
    try {
      await createMutation.mutateAsync(dto);
      navigate('/profile');
    } catch (e) {
      if (e instanceof BenchmarkOperationTimeoutError) {
        setDelayedOperationId(e.receipt.operationId);
        return;
      }
      if (isSoftDeletedConflict(e)) {
        setRestoreId(e.payload.deletedId);
        return;
      }
      handleError(e, {
        fallback: t.common.errors.createFailed,
        setError: methods.setError,
        onForbidden: () => setForbidden(true),
      });
    }
  };

  const handleAddToCatalog = () => onSubmit(getValues());

  if (forbidden) return <Navigate to="/forbidden" replace />;

  const isPending = createMutation.isPending || delayedOperationId !== null;
  const restoreEntityName = methods.getValues('name') || methods.getValues('nameEn') || '';

  return (
    <>
      <FormProvider {...methods}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {t.newBenchmark.title}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            {t.newBenchmark.subtitle}
          </p>

          <Stepper step={step} setStep={setStep} />

          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-base font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
              {t.newBenchmark.stepLabel
                .replace('{step}', String(step + 1))
                .replace('{title}', getStepTitle(t.newBenchmark, step))}
            </h2>
            <div className="space-y-5">
              {step === 0 && <Step1 />}
              {step === 1 && <Step2 />}
              {step === 2 && <Step3 />}
              {step === 3 && <Step4 />}
              {step === 4 && <Step5 />}
            </div>
          </div>

          {(serverError || delayedOperationId) && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {delayedOperationId
                ? t.newBenchmark.processingDelayed.replace(
                  '{operationId}',
                  delayedOperationId,
                )
                : serverError}
            </div>
          )}

          <div className="flex justify-between mt-5">
            <button
              onClick={handlePrev}
              disabled={step === 0 || isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: step === 0 ? 'var(--border-strong)' : 'var(--text-secondary)',
                cursor: step === 0 || isPending ? 'default' : 'pointer',
              }}
            >
              <ChevronLeft size={15} />
              {t.newBenchmark.back}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--accent)', cursor: 'pointer' }}
              >
                {t.newBenchmark.next}
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleAddToCatalog}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white"
                style={{
                  backgroundColor: 'var(--success)',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {delayedOperationId
                  ? t.newBenchmark.processing
                  : createMutation.isPending
                    ? t.newBenchmark.submitting
                    : t.newBenchmark.submit}
              </button>
            )}
          </div>
        </div>
      </FormProvider>

      {restoreId && (
        <RestoreModal
          entityName={restoreEntityName}
          isPending={restoreMutation.isPending}
          onClose={() => setRestoreId(null)}
          onConfirm={async () => {
            await restoreMutation.mutateAsync(restoreId);
            setRestoreId(null);
            navigate('/profile');
          }}
        />
      )}
    </>
  );
}
