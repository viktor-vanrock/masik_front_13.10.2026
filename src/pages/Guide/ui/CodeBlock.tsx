// components/ui/CodeBlock.tsx
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils.ts/cn';

interface CodeBlockProps extends ComponentPropsWithoutRef<'pre'> {
  code: string;
  language?: string;
}

export function CodeBlock({ code, className, ...props }: CodeBlockProps) {
  return (
    <pre
      className={cn(
        'text-xs rounded-lg p-3 overflow-x-auto font-mono',
        'bg-bg-elevated text-secondary border border-border-default',
        className
      )}
      {...props}
    >
      {code}
    </pre>
  );
}