import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CreateBenchmarkLink } from '@/components/ui/CreateBenchmarkLink';
import { CatalogSkillLink } from './CatalogSkillLink';
import { catalogSkillUrl } from './catalogSkillUrl';

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('landing service links', () => {
  it('creates a different intent on every click, including repeated clicks on the same link', () => {
    render(<MemoryRouter><CreateBenchmarkLink>Создать</CreateBenchmarkLink><Location /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Создать' });
    fireEvent.click(link);
    const first = screen.getByTestId('location').textContent!;
    const firstParams = new URL(first, 'https://example.test').searchParams;
    expect(firstParams.get('mode')).toBe('create');
    expect(firstParams.get('new')).toMatch(/^[0-9a-f-]{36}$/);
    fireEvent.click(link);
    const second = screen.getByTestId('location').textContent!;
    expect(second).not.toBe(first);
    expect(new URL(second, 'https://example.test').searchParams.has('session')).toBe(false);
  });

  it.each([
    ['logic', 'рассужд'], ['code', 'код'], ['data', 'данн'],
    ['agents', 'агент'], ['finance', 'финанс'],
  ])('preserves the original %s catalog search', (skill, search) => {
    expect(new URL(catalogSkillUrl(skill), 'https://example.test').searchParams.get('search')).toBe(search);
  });

  it('uses the selected oracle skill at click time', () => {
    render(<MemoryRouter><div className="bf-home">
      <button className="skill" data-skill="logic" aria-checked="true">Логика</button>
      <button className="skill" data-skill="lang" aria-checked="false">Язык</button>
      <CatalogSkillLink>Проверить</CatalogSkillLink>
    </div><Location /></MemoryRouter>);
    screen.getByRole('button', { name: 'Логика' }).setAttribute('aria-checked', 'false');
    screen.getByRole('button', { name: 'Язык' }).setAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('link', { name: 'Проверить' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/catalog?language=ru');
  });
});
