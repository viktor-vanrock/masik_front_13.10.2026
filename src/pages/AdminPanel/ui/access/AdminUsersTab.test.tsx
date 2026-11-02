import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import { translations } from '@/i18n';
import { mockUser } from '@/test/mocks/user';
import { renderWithProviders } from '@/test/renderWithProviders';
import { AdminUsersTab } from './AdminUsersTab';

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({
  t: translations.ru, lang: 'ru', user: { id: 'operator', role: 'SUPERUSER' },
}) }));

const labels = translations.ru.admin.users;

beforeEach(() => vi.restoreAllMocks());

describe('AdminUsersTab DEMO assignment', () => {
  it('creates a DEMO account through the existing users endpoint and preserves every role option', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { data: [], total: 0 } });
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: mockUser({ role: 'DEMO' }) });
    renderWithProviders(<AdminUsersTab />);
    await screen.findByText(labels.empty);
    fireEvent.click(screen.getByRole('button', { name: labels.createButton }));
    const select = screen.getByRole('combobox', { name: labels.roleLabel });
    expect(select).toHaveValue('USER');
    expect(within(select).getAllByRole('option').map(option => option.getAttribute('value')))
      .toEqual(['USER', 'ADMIN', 'SUPERUSER', 'DEMO']);
    fireEvent.change(screen.getByLabelText(labels.usernameLabel), { target: { value: 'demo_terminal' } });
    fireEvent.change(screen.getByLabelText(labels.emailLabel), { target: { value: 'demo@example.test' } });
    fireEvent.change(screen.getByLabelText(labels.passwordLabel, { exact: false }), { target: { value: 'strong-password' } });
    fireEvent.change(select, { target: { value: 'DEMO' } });
    fireEvent.click(screen.getAllByRole('button', { name: labels.createButton }).at(-1)!);
    await waitFor(() => expect(post).toHaveBeenCalledExactlyOnceWith('/users', {
      username: 'demo_terminal', email: 'demo@example.test', password: 'strong-password', role: 'DEMO',
    }));
  });

  it('assigns DEMO to an existing account and keeps it selected when editing that profile again', async () => {
    const user = mockUser({ id: 'visitor', username: 'visitor', role: 'USER', email: 'visitor@example.test' });
    const demo = { ...user, role: 'DEMO' as const };
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({ data: { data: [user], total: 1 } })
      .mockResolvedValue({ data: { data: [demo], total: 1 } });
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue({ data: demo });
    renderWithProviders(<AdminUsersTab />);
    fireEvent.click(await screen.findByTitle(labels.editButton));
    fireEvent.change(screen.getByRole('combobox', { name: labels.roleLabel }), { target: { value: 'DEMO' } });
    fireEvent.click(screen.getByRole('button', { name: labels.saveButton }));
    await waitFor(() => expect(patch).toHaveBeenCalledExactlyOnceWith('/users/visitor', {
      username: user.username, email: user.email, role: 'DEMO',
    }));
    await screen.findByText(translations.ru.roles.DEMO);
    fireEvent.click(screen.getByTitle(labels.editButton));
    expect(screen.getByRole('combobox', { name: labels.roleLabel })).toHaveValue('DEMO');
  });
});
