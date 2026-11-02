import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogFilterOptions, CatalogFilterValues } from '../types';
import { FilterDrawer } from './FilterDrawer';

const emptyFilters = (): CatalogFilterValues => ({ suites: [], language: [], modality: [], taskType: [], difficulty: [],
  capability: [], domain: [], subdomain: [], macroGroup: [], subGroup: [], abilityTaxon: [], abilityTag: [] });
const options: CatalogFilterOptions = { ...emptyFilters(), suites: ['Основной', 'Дополнительный'], language: ['Русский', 'Английский'],
  domain: ['Финансы', 'Право'], subdomain: ['Банки', 'Кредиты', 'Налоги'],
  domainChildren: { Финансы: ['Банки', 'Кредиты'], Право: ['Налоги'] }, macroChildren: {} };
const defaultProps = { onClose: vi.fn(), onReset: vi.fn(), onApply: vi.fn(), resultCount: 2, isCountPending: false,
  suiteSearch: '', onSuiteSearchChange: vi.fn(), filterOptions: options, selected: emptyFilters(), onToggle: vi.fn() };

beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });

describe('FilterDrawer', () => {
  it('renders real facet counts and keeps a selected zero-count value removable', () => {
    render(<FilterDrawer {...defaultProps} selected={{ ...emptyFilters(), language: ['Русский'] }}
      facetCounts={{ language: { Русский: 0, Английский: 0 }, suites: { Основной: 2, Дополнительный: 0 } }} />);
    const russian = screen.getByRole('button', { name: /Русский/ });
    expect(russian).toHaveAttribute('aria-pressed', 'true');
    expect(russian).toBeEnabled();
    expect(screen.getByRole('button', { name: /Английский/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Дополнительный/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Основной/ }).closest('label')).toHaveTextContent('2');
    fireEvent.click(russian);
    expect(defaultProps.onToggle).toHaveBeenCalledWith('language', 'Русский');
    fireEvent.click(screen.getByRole('button', { name: 'Показать 2 теста' }));
    expect(defaultProps.onApply).toHaveBeenCalledOnce();
  });

  it('finds a child in a collapsed tree and keeps only matching rows visible', () => {
    render(<FilterDrawer {...defaultProps} />);
    const finance = screen.getByRole('checkbox', { name: 'Финансы' }).closest('.tnode')!;
    expect(finance.querySelector('.tkids')).toHaveAttribute('hidden');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Домен и поддомен: поиск' }), { target: { value: 'банк' } });
    expect(finance).toHaveClass('force');
    expect(screen.getByRole('checkbox', { name: 'Банки' })).toBeVisible();
    expect(finance.querySelector('.tkids')).not.toHaveAttribute('hidden');
    expect(screen.queryByRole('checkbox', { name: 'Кредиты' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Право' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Банки' }));
    expect(defaultProps.onToggle).toHaveBeenCalledWith('subdomain', 'Банки');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Домен и поддомен: поиск' }), { target: { value: 'ничего' } });
    expect(within(screen.getByRole('searchbox', { name: 'Домен и поддомен: поиск' }).closest('.fgroup')!)
      .getByText('Ничего не найдено')).toBeVisible();
  });

  it('supports controlled search and checkbox selections without inventing counts', () => {
    const { rerender } = render(<FilterDrawer {...defaultProps} />);
    const search = screen.getByRole('searchbox', { name: 'Набор: поиск' });
    fireEvent.change(search, { target: { value: 'основ' } });
    expect(defaultProps.onSuiteSearchChange).toHaveBeenCalledWith('основ');
    rerender(<FilterDrawer {...defaultProps} suiteSearch="основ" />);
    expect(screen.getByRole('checkbox', { name: 'Основной' })).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: 'Дополнительный' })).not.toBeInTheDocument();
    expect(document.querySelector('.opt em')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Основной' }));
    expect(defaultProps.onToggle).toHaveBeenCalledWith('suites', 'Основной');
  });

  it('traps focus, closes on Escape and restores trigger focus and scroll styles', () => {
    document.body.style.overflow = 'auto';
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button type="button" onClick={() => setOpen(true)}>Открыть фильтры</button>
        {open && <FilterDrawer {...defaultProps} onClose={() => setOpen(false)} />}</>;
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Открыть фильтры' });
    trigger.focus();
    fireEvent.click(trigger);
    const close = screen.getByRole('button', { name: 'Закрыть' });
    const apply = screen.getByRole('button', { name: 'Показать 2 теста' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(apply).toHaveFocus();
    fireEvent.keyDown(apply, { key: 'Tab' });
    expect(close).toHaveFocus();
    trigger.focus();
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('closes from the scrim and resets through the existing callbacks', () => {
    render(<FilterDrawer {...defaultProps} />);
    fireEvent.click(document.querySelector('.scrim')!);
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(defaultProps.onReset).toHaveBeenCalledOnce();
  });
});
