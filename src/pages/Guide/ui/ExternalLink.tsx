import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils.ts/cn';

interface ExternalLinkProps extends ComponentPropsWithoutRef<'a'> {
  showIcon?: boolean;
}

export function ExternalLink({ 
  children, 
  className, 
  showIcon = true, 
  ...props 
}: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-accent',
        'hover:underline transition-all',
        className
      )}
      {...props}
    >
      {children}
      {showIcon && <ExternalLinkIcon size={14} />}
    </a>
  );
}