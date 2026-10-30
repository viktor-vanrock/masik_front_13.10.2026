import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createContactRequest } from '@/api/contactRequests';
import { ContactCollectionForm } from './ContactCollectionForm';
import { PRIVACY_POLICY_URL } from './consentText';

vi.mock('@/api/contactRequests', () => ({ createContactRequest: vi.fn() }));

const fill = () => {
  fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: '  Иван Иванов  ' } });
  fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: '  ivan@пример.рф  ' } });
  fireEvent.click(screen.getByRole('checkbox'));
};

describe('ContactCollectionForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates all three fields and opens the full consent in a dialog', () => {
    render(<ContactCollectionForm chatId="chat-1" />);
    expect(screen.getByText('Отправить готовый бенчмарк заказчику на почту? Это необязательный шаг.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    expect(screen.getAllByRole('alert')).toHaveLength(3);
    expect(createContactRequest).not.toHaveBeenCalled();
    screen.getByRole('button', { name: 'Текст согласия' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Текст согласия' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Согласие на получение рекламных и/или информационных рассылок')).toBeInTheDocument();
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

  it('submits an IDN address, blocks duplicate sends and clears all fields on success', async () => {
    let resolveRequest!: (value: { publicNumber: string }) => void;
    vi.mocked(createContactRequest).mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));
    render(<ContactCollectionForm chatId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    expect(createContactRequest).toHaveBeenCalledWith({
      chatId: 'chat-1', fullName: 'Иван Иванов', email: 'ivan@пример.рф', consent: true,
    });
    expect(screen.getByLabelText('ФИО')).toHaveValue('  Иван Иванов  ');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('  ivan@пример.рф  ');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByLabelText('ФИО')).toBeDisabled();
    expect(screen.getByLabelText('Email получателя')).toBeDisabled();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отправляем…' })).toBeDisabled();
    resolveRequest({ publicNumber: 'AIJ-2026-ABCDEF1234567890ABCDEF12' });
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-ABCDEF1234567890ABCDEF12.')).toBeInTheDocument());
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(createContactRequest).toHaveBeenCalledTimes(1);
  });

  it('retains the entered values after a save failure', async () => {
    vi.mocked(createContactRequest).mockRejectedValueOnce(new Error('server error'));
    render(<ContactCollectionForm chatId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Не удалось отправить данные. Попробуйте ещё раз.')).toBeInTheDocument());
    expect(screen.getByLabelText('ФИО')).toHaveValue('  Иван Иванов  ');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('  ivan@пример.рф  ');
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('allows another independent request with the same email', async () => {
    vi.mocked(createContactRequest)
      .mockResolvedValueOnce({ publicNumber: 'AIJ-2026-FIRST' })
      .mockResolvedValueOnce({ publicNumber: 'AIJ-2026-SECOND' });
    render(<ContactCollectionForm chatId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-FIRST.')).toBeInTheDocument());
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(screen.getByText('Заявка принята, № AIJ-2026-SECOND.')).toBeInTheDocument());
    expect(createContactRequest).toHaveBeenCalledTimes(2);
  });

  it('allows the visitor to skip the form without sending a request', () => {
    render(<ContactCollectionForm chatId="chat-1" />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Пропустить' }));
    expect(screen.queryByLabelText('Email получателя')).not.toBeInTheDocument();
    expect(createContactRequest).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Вернуться к форме' }));
    expect(screen.getByLabelText('ФИО')).toHaveValue('');
    expect(screen.getByLabelText('Email получателя')).toHaveValue('');
  });

  it('shows the ready-test delivery message for a completed test', () => {
    render(<ContactCollectionForm chatId="chat-ready" context="ready-test" />);
    expect(screen.getByText(/Пришлем результат этого теста на вашу почту/)).toBeInTheDocument();
  });

  it('accepts Cyrillic characters before and after @', async () => {
    vi.mocked(createContactRequest).mockResolvedValueOnce({ publicNumber: 'AIJ-2026-CYRILLIC' });
    render(<ContactCollectionForm chatId="chat-1" />);
    fireEvent.change(screen.getByLabelText('ФИО'), { target: { value: 'Иван Иванов' } });
    fireEvent.change(screen.getByLabelText('Email получателя'), { target: { value: 'яиты@собака.рф' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Указать email' }));
    await waitFor(() => expect(createContactRequest).toHaveBeenCalledWith({
      chatId: 'chat-1', fullName: 'Иван Иванов', email: 'яиты@собака.рф', consent: true,
    }));
  });
});
