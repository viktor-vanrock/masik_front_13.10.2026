import { cn } from "@/utils.ts/cn";

interface PlaceholderProps {
  text: string;
  height?: string;
  className?: string;
}

export function Placeholder({ text, height = 'h-28', className }: PlaceholderProps) {
  return (
    <div
      className={cn(
        height,
        'rounded-lg flex items-center justify-center text-xs text-muted',
        'bg-bg-elevated border border-dashed border-border-strong',
        className
      )}
    >
      {text}
    </div>
  );
}