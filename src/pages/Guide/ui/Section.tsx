import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils.ts/cn';

interface SectionProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ icon: Icon, title, children, className }: SectionProps) {
  return (
    <section className={cn('mb-10', className)}>
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
        <Icon size={16} />
        {title}
      </h2>
      {children}
    </section>
  );
}