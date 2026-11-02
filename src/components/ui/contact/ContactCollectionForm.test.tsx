/// <reference types="node" />
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { ApiException, httpClient } from '@/services/http';
import { ContactCollectionForm } from './ContactCollectionForm';
import { PRIVACY_POLICY_URL } from './consentText';

vi.mock('@/services/http', async original => ({ ...await original<typeof import('@/services/http')>(), httpClient: { post: vi.fn() } }));

beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterAll(() => vi.unstubAllGlobals());
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const key = (index: number) => vi.mocked(httpClient.post).mock.calls[index][2]?.headers?.['Idempotency-Key'];

const fill = () => {
  fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: '  Иван Иванов  ' } });
  fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: '  ivan@пример.рф  ' } });
  fireEvent.click(screen.getByRole('checkbox'));
};

describe('ContactCollectionForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates all three fields and opens the full consent in a dialog', () => {
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    expect(screen.getByText('Оставьте контакты — пришлём результат позже')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(httpClient.post).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Текст согласия' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Текст согласия' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Согласие на получение рекламных и/или информационных рассылок')).toBeInTheDocument();
    expect(screen.getByText(/Действия, совершаемые с персональными данными \(обработка персональных данных\):/)).toBeInTheDocument();
    expect(screen.getByText(/Передача \(предоставление, доступ\) персональных данных третьим лицам:/)).toBeInTheDocument();
    expect(screen.getByText(/Отзыв Согласия\. Я уведомлен\(а\)/)).toBeInTheDocument();
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === PRIVACY_POLICY_URL)).toBe(true);
    const closeButton = screen.getByRole('button', { name: 'Закрыть текст согласия' });
    const policyLink = screen.getByRole('link');
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(policyLink).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Текст согласия' })).toHaveFocus();
  });

  it('contains programmatic outside focus until consent closes and restores its opener', () => {
    render(<><ContactCollectionForm ownerId="owner-1" conversationId="chat-1" /><button type="button">Внешнее действие</button></>);
    const opener = screen.getByRole('button', { name: 'Текст согласия' });
    const outside = screen.getByRole('button', { name: 'Внешнее действие' });
    opener.focus(); fireEvent.click(opener);
    const close = screen.getByRole('button', { name: 'Закрыть текст согласия' });
    outside.focus();
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    outside.focus();
    expect(outside).toHaveFocus();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it('cancels backdrop focus changes when closing consent and preserves its opener and checkbox', () => {
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fireEvent.click(screen.getByRole('checkbox'));
    const opener = screen.getByRole('button', { name: 'Текст согласия' });
    opener.focus(); fireEvent.click(opener);
    const backdrop = screen.getByRole('presentation');
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    fireEvent(backdrop, down);
    expect(down.defaultPrevented).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it('hides contacts immediately during a pending request and reopens empty after success', async () => {
    let resolveRequest!: (value: { data: { publicNumber: string } }) => void;
    vi.mocked(httpClient.post).mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }) as ReturnType<typeof httpClient.post>);
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    const form = screen.getByLabelText('ФИО').closest('form')!;
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith('/demo/contacts', {
      conversationId: 'chat-1', fullName: 'Иван Иванов', email: 'ivan@пример.рф', consent: true,
    }, { signal: expect.any(AbortSignal), headers: { 'Idempotency-Key': expect.stringMatching(uuid) } }));
    expect(screen.queryByLabelText('ФИО')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email получателя')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Отправляем заявку…');
    expect(screen.queryByRole('button', { name: 'Вернуться к форме' })).not.toBeInTheDocument();
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    resolveRequest({ data: { publicNumber: 'AIJ-2026-ABCDEF1234567890ABCDEF12' } });
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-ABCDEF1234567890ABCDEF12.')).toBeInTheDocument());
    expect(screen.queryByLabelText('ФИО')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(httpClient.post).toHaveBeenCalledTimes(1);
  });

  it('keeps contacts hidden after a save failure and reopens an empty form', async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('server error'));
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Не удалось отправить данные. Попробуйте ещё раз.')).toBeInTheDocument());
    expect(screen.queryByLabelText('ФИО')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email получателя')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('allows another independent request with the same email', async () => {
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ data: { publicNumber: 'AIJ-2026-FIRST' } })
      .mockResolvedValueOnce({ data: { publicNumber: 'AIJ-2026-SECOND' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-FIRST.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-SECOND.')).toBeInTheDocument());
    expect(httpClient.post).toHaveBeenCalledTimes(2);
    expect(key(0)).not.toBe(key(1));
  });

  it('has no skip action for the DEMO contact step', () => {
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    expect(screen.queryByRole('button', { name: 'Пропустить' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('does not hide invalid input or send it to the server', () => {
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: 'invalid email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('  Иван Иванов  ');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('invalid email');
    expect(screen.getByRole('alert')).toHaveTextContent('Укажите корректный адрес электронной почты.');
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it('does not apply an old chat submission to another chat form', async () => {
    let finish!: (value: { data: { publicNumber: string } }) => void;
    vi.mocked(httpClient.post).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }) as ReturnType<typeof httpClient.post>);
    const { rerender } = render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledOnce());
    rerender(<ContactCollectionForm ownerId="owner-1" conversationId="chat-2" />);
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: 'Другой посетитель' } });
    await act(async () => { finish({ data: { publicNumber: 'AIJ-OLD-CHAT' } }); });
    expect(screen.getByLabelText('ФИО')).toHaveValue('Другой посетитель');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('removes PII before the request starts and never persists it in browser storage', async () => {
    vi.mocked(httpClient.post).mockImplementationOnce(async () => {
      expect(screen.queryByLabelText('ФИО')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email получателя')).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      return { data: { publicNumber: 'AIJ-PUBLIC', fullName: 'SHOULD-NOT-RENDER', email: 'private@example.org' } } as never;
    });
    const local = vi.spyOn(Storage.prototype, 'setItem');
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-PUBLIC.')).toBeInTheDocument());
    expect(document.body).not.toHaveTextContent('SHOULD-NOT-RENDER');
    expect(document.body).not.toHaveTextContent('private@example.org');
    expect(local).not.toHaveBeenCalled();
    local.mockRestore();
  });

  it('aborts on profile change and cannot carry an old response into the same chat for a new owner', async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(httpClient.post).mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }) as ReturnType<typeof httpClient.post>);
    const { rerender } = render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledOnce());
    const signal = vi.mocked(httpClient.post).mock.calls[0][2]?.signal;
    expect(signal?.aborted).toBe(false);
    rerender(<ContactCollectionForm ownerId="owner-2" conversationId="chat-1" />);
    expect(signal?.aborted).toBe(true);
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await act(async () => { reject(new Error('Иван Иванов ivan@пример.рф internal stack')); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the ready-test delivery message for a completed test', () => {
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-ready" context="ready-test" />);
    expect(screen.getByText(/Пришлем результат этого теста на вашу почту/)).toBeInTheDocument();
  });

  it('accepts Cyrillic characters before and after @', async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { publicNumber: 'AIJ-2026-CYRILLIC' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: 'Иван Иванов' } });
    fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: 'яиты@собака.рф' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith('/demo/contacts', {
      conversationId: 'chat-1', fullName: 'Иван Иванов', email: 'яиты@собака.рф', consent: true,
    }, { signal: expect.any(AbortSignal), headers: { 'Idempotency-Key': expect.stringMatching(uuid) } }));
  });

  it('reuses the key after a lost response when the same normalized contacts are entered again', async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ data: { publicNumber: 'AIJ-RECOVERED' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    fill();
    fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: 'Иван Иванов' } });
    fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: 'ivan@пример.рф' } });
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByText('Заявка принята, № AIJ-RECOVERED.');
    expect(key(0)).toMatch(uuid);
    expect(key(1)).toBe(key(0));
    expect(httpClient.post).toHaveBeenCalledTimes(2);
  });

  it.each(['fullName', 'email'] as const)('uses a new key after an error when %s changes', async (field) => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ data: { publicNumber: 'AIJ-NEXT' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    fill();
    fireEvent.change(screen.getByLabelText(field === 'fullName' ? 'ФИО' : 'Email получателя'),
      { target: { value: field === 'fullName' ? 'Новый посетитель' : 'other@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByText('Заявка принята, № AIJ-NEXT.');
    expect(key(1)).not.toBe(key(0));
  });

  it('rotates a conflicting key on the next explicit retry without exposing the server error', async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new ApiException({ statusCode: 409, message: 'private contact data' }))
      .mockResolvedValueOnce({ data: { publicNumber: 'AIJ-AFTER-CONFLICT' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    expect(await screen.findByRole('alert')).not.toHaveTextContent('private contact data');
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByText('Заявка принята, № AIJ-AFTER-CONFLICT.');
    expect(key(1)).not.toBe(key(0));
  });

  it.each([
    ['owner-1', 'chat-2'], ['owner-2', 'chat-1'],
  ])('drops the old key across identity scope %s/%s', async (ownerId, conversationId) => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce({ data: { publicNumber: 'AIJ-NEW-SCOPE' } });
    const { rerender } = render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByRole('alert');
    rerender(<ContactCollectionForm ownerId={ownerId} conversationId={conversationId} />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await screen.findByText('Заявка принята, № AIJ-NEW-SCOPE.');
    expect(key(1)).not.toBe(key(0));
  });

  it('clears the DOM before hashing and blocks double submission while the digest is pending', async () => {
    let finishDigest!: (value: ArrayBuffer) => void;
    const digest = vi.spyOn(crypto.subtle, 'digest').mockReturnValueOnce(new Promise(resolve => { finishDigest = resolve; }));
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { publicNumber: 'AIJ-ONE' } });
    render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); const form = screen.getByLabelText('ФИО').closest('form')!;
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(screen.queryByLabelText('ФИО')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email получателя')).not.toBeInTheDocument();
    expect(digest).toHaveBeenCalledOnce(); expect(httpClient.post).not.toHaveBeenCalled();
    await act(async () => { finishDigest(new ArrayBuffer(32)); });
    await screen.findByText('Заявка принята, № AIJ-ONE.');
    expect(httpClient.post).toHaveBeenCalledOnce(); digest.mockRestore();
  });

  it('does not start an obsolete request if the owner changes during hashing', async () => {
    let finishDigest!: (value: ArrayBuffer) => void;
    const digest = vi.spyOn(crypto.subtle, 'digest').mockReturnValueOnce(new Promise(resolve => { finishDigest = resolve; }));
    const { rerender } = render(<ContactCollectionForm ownerId="owner-1" conversationId="chat-1" />);
    fill(); fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    rerender(<ContactCollectionForm ownerId="owner-2" conversationId="chat-1" />);
    await act(async () => { finishDigest(new ArrayBuffer(32)); });
    expect(httpClient.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText('ФИО')).toHaveValue(''); digest.mockRestore();
  });

});
