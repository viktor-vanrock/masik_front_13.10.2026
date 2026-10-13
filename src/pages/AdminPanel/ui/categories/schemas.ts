import { z } from 'zod';

export interface CategoryFormValidationMessages {
  nameRequired: string;
  nameTooLong: string;
  nameEnRequired: string;
  nameEnTooLong: string;
}

export const buildCategoryFormSchema = (m: CategoryFormValidationMessages) =>
  z.object({
    name: z.string().min(1, m.nameRequired).max(500, m.nameTooLong),
    nameEn: z.string().min(1, m.nameEnRequired).max(500, m.nameEnTooLong),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
  });

export type CategoryFormSchema = ReturnType<typeof buildCategoryFormSchema>;
export type CategoryFormData = z.infer<CategoryFormSchema>;
