import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { PasswordField } from '@/pages/Login/ui/PasswordField';
import { Register } from './index';

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru, lang: 'ru', user: null }) }));
vi.mock('@/context/auth', () => ({ useAuth: () => ({ status: 'anonymous', register: vi.fn(), registerError: null }) }));

describe('password visibility', () => {
  it('toggles both registration fields from either button without changing their values', () => {
    render(<MemoryRouter><Register /></MemoryRouter>);
    const password = screen.getByLabelText('Пароль', { exact: true });
    const confirm = screen.getByLabelText('Подтвердите пароль', { exact: true });
    fireEvent.change(password, { target: { value: 'Catalog2026!' } });
    fireEvent.change(confirm, { target: { value: 'Catalog2026!' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Показать пароль' })[0]);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'text');
    expect(screen.getAllByRole('button', { name: 'Скрыть пароль', pressed: true })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Скрыть пароль' })[1]);
    expect(password).toHaveAttribute('type', 'password');
    expect(confirm).toHaveAttribute('type', 'password');
    expect(password).toHaveValue('Catalog2026!');
    expect(confirm).toHaveValue('Catalog2026!');
  });

  it('keeps a standalone login password toggle working', () => {
    render(<PasswordField label="Пароль" defaultValue="Catalog2026!" />);
    fireEvent.click(screen.getByRole('button', { name: 'Показать пароль' }));
    expect(screen.getByLabelText('Пароль', { exact: true })).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Скрыть пароль' }));
    expect(screen.getByLabelText('Пароль', { exact: true })).toHaveAttribute('type', 'password');
  });
});
