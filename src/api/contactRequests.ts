import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';

export type CreateContactRequestInput = {
  chatId: string;
  fullName: string;
  email: string;
  consent: true;
};

export async function createContactRequest(input: CreateContactRequestInput): Promise<{ publicNumber: string }> {
  const { data } = await httpClient.post<{ publicNumber: string }>(BACKEND_PATHS.contactRequests.create, input);
  return data;
}
