import { z } from 'zod';

export interface DictionaryFormMessages {
  nameRequired: string;
  nameTooLong: string;
  nameEnRequired: string;
  nameEnTooLong: string;
  parentRequired: string;
}

export const buildDictionaryFormSchema = (
  msgs: DictionaryFormMessages,
  requireParent: boolean,
) =>
  z.object({
    name: z.string().min(1, msgs.nameRequired).max(500, msgs.nameTooLong),
    nameEn: z.string().min(1, msgs.nameEnRequired).max(500, msgs.nameEnTooLong),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    parentId: requireParent
      ? z.string().min(1, msgs.parentRequired)
      : z.string().optional(),
  });

export type DictionaryFormSchema = ReturnType<typeof buildDictionaryFormSchema>;
export type DictionaryFormData = z.infer<DictionaryFormSchema>;
