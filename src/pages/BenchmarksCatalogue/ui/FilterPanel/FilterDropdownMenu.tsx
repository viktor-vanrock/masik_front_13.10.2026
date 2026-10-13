import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@ui/DropdownMenu';
import type { DropdownMenuOption } from './types';

interface Props {
    label: string,
    selected: string[],
    options: DropdownMenuOption[],
    onToggle: (item: string) => void,
    available?: Set<string>
}

export const FilterDropdownMenu = ({
  label,
  selected,
  options,
  onToggle,
  available
}: Props) => {
    
  const sorted = [...options].sort((a, b) => {
    const aAvail = !available || available.has(a.value);
    const bAvail = !available || available.has(b.value);
    if (aAvail !== bAvail) return aAvail ? -1 : 1;
    return 0;
  });
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        selectedCount={selected.length}
        className={`flex items-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        badgeClassName=' border-[var(--accent)] text-[var(--accent)]'
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--accent)',
          border: `1px solid var(--border-strong)`,
          cursor: 'pointer',
        }}
      >
        {label}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {sorted.map((opt) => {
          const isSelected = selected.includes(opt.value);

          const isAvailable = !available || isSelected || available.has(opt.value);

          return (<DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onToggle(opt.value)}
            // ⬇️ Не закрываем меню при клике
            onSelect={(e) => e.preventDefault()}
            disabled={!isAvailable}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
          )})}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}