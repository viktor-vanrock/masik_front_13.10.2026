import type { FieldPath, UseFormReturn } from 'react-hook-form';
import {
  STEP_FIELDS,
  type BenchmarkFormData,
  type BenchmarkFormSchemas,
} from './schemas/formSchema';

type FormApi = Pick<
  UseFormReturn<BenchmarkFormData>,
  'getValues' | 'setError' | 'clearErrors'
>;

interface Props extends FormApi {
  step: number;
  schemas: BenchmarkFormSchemas;
}

export const validateCurrentStep = ({
  getValues,
  setError,
  clearErrors,
  step,
  schemas,
}: Props): boolean => {
  const currentData = getValues();
  const stepSchemas = [schemas.step1, schemas.step2, schemas.step3, schemas.step4, schemas.step5];
  const schema = stepSchemas[step];
  if (!schema) return true;

  const result = schema.safeParse(currentData);
  if (result.success) return true;

  const stepFields = STEP_FIELDS[step as keyof typeof STEP_FIELDS] || [];
  stepFields.forEach((field) => clearErrors(field as FieldPath<BenchmarkFormData>));

  result.error.issues.forEach((err) => {
    const path = err.path[0] as FieldPath<BenchmarkFormData>;
    setError(path, { type: 'manual', message: err.message });
  });

  const firstErrorPath = result.error.issues[0]?.path[0];
  if (firstErrorPath != null) {
    const fieldName = typeof firstErrorPath === 'string' ? firstErrorPath : String(firstErrorPath);
    const element = document.querySelector(`[name="${fieldName}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (element as HTMLElement | null)?.focus();
  }

  return false;
};
