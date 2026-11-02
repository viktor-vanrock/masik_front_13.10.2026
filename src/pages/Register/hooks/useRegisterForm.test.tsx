import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiException } from '@/services/http';
import { translations } from '@/i18n';
import { useRegisterForm } from './useRegisterForm';

const auth = vi.hoisted(() => ({ register: vi.fn(), registerError: null as unknown }));
vi.mock('@/context/auth', () => ({ useAuth: () => ({ ...auth, status: 'anonymous', isRegistering: false, retry: vi.fn() }) }));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru, lang: 'ru' }) }));

describe('registration server conflicts', () => {
  beforeEach(() => { auth.register.mockReset(); auth.registerError = null; });

  it.each([
    ['EMAIL_ALREADY_EXISTS', 'email', translations.ru.auth.emailAlreadyExists],
    ['USERNAME_ALREADY_EXISTS', 'username', translations.ru.auth.usernameAlreadyExists],
  ] as const)('places %s next to the relevant field without dropping the form', async (code, field, message) => {
    auth.registerError = new ApiException({ statusCode: 409, code, field, message: 'Backend fallback' });
    auth.register.mockRejectedValue(auth.registerError);
    const { result } = renderHook(() => useRegisterForm());
    // Subscribe to react-hook-form's lazy errors state before submitting.
    void result.current.form.formState.errors;
    act(() => result.current.form.reset({ username: 'new-user', email: 'existing@example.test', password: 'Catalog2026!', confirmPassword: 'Catalog2026!' }));
    await act(async () => { await result.current.onSubmit(); });
    await waitFor(() => expect(result.current.form.formState.errors[field]?.message).toBe(message));
    expect(result.current.serverError).toBeNull();
    expect(result.current.form.getValues('password')).toBe('Catalog2026!');

    auth.register.mockResolvedValue(undefined);
    await act(async () => { await result.current.onSubmit(); });
    expect(auth.register).toHaveBeenCalledTimes(2);
    expect(result.current.form.formState.errors[field]).toBeUndefined();
  });

  it('keeps unexpected errors visible without rejecting the submit handler', async () => {
    const error = new ApiException({ statusCode: 500, message: 'Service unavailable' });
    auth.registerError = error;
    auth.register.mockRejectedValue(error);
    const { result } = renderHook(() => useRegisterForm());
    act(() => result.current.form.reset({ username: 'new-user', email: 'new@example.test', password: 'Catalog2026!', confirmPassword: 'Catalog2026!' }));
    await act(async () => { await result.current.onSubmit(); });
    expect(result.current.serverError).toBe(error);
  });

  it.each([
    ['EMAIL_ALREADY_EXISTS', 'email', 'changed@example.test'],
    ['USERNAME_ALREADY_EXISTS', 'username', 'changed-user'],
  ] as const)('ignores a delayed %s after the field changes and allows resubmission', async (code, field, changedValue) => {
    let rejectRegistration!: (error: ApiException) => void;
    auth.register.mockReturnValueOnce(new Promise<void>((_resolve, reject) => { rejectRegistration = reject; }));
    const { result } = renderHook(() => useRegisterForm());
    void result.current.form.formState.errors;
    const values = { username: 'new-user', email: 'existing@example.test', password: 'Catalog2026!', confirmPassword: 'Catalog2026!' };
    act(() => result.current.form.reset(values));

    let submission!: Promise<void>;
    act(() => { submission = result.current.onSubmit(); });
    await waitFor(() => expect(auth.register).toHaveBeenCalledOnce());
    act(() => result.current.form.setValue(field, changedValue));
    await act(async () => {
      rejectRegistration(new ApiException({ statusCode: 409, code, field, message: 'Already exists' }));
      await submission;
    });

    expect(result.current.form.formState.errors[field]).toBeUndefined();
    expect(result.current.form.getValues(field)).toBe(changedValue);
    expect(result.current.form.getValues('password')).toBe(values.password);
    auth.register.mockResolvedValueOnce(undefined);
    await act(async () => { await result.current.onSubmit(); });
    expect(auth.register).toHaveBeenLastCalledWith({
      username: values.username, email: values.email, password: values.password, [field]: changedValue,
    });
  });
});
