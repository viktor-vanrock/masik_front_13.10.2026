// Todo перенести в ui kit
import { cn } from '@/utils.ts/cn';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import * as React from 'react';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

interface DropdownMenuTriggerProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> {
  selectedCount?: number;
  fullWidth?: boolean;
  badgeClassName?: string;
}

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  DropdownMenuTriggerProps
>(({ className, children, selectedCount, fullWidth, badgeClassName, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'group flex h-10 items-center justify-between rounded-lg border border-divider-secondary bg-surface px-3 py-2 text-sm text-content',
      'placeholder:text-content-muted',
      'focus:border-divider focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      fullWidth ? 'w-full' : 'w-auto',
      className,
    )}
    {...props}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span className="line-clamp-1">{children}</span>

      {selectedCount != null && selectedCount > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full',
            'border-2 border-current',
            'px-.5 text-xs font-bold',
            badgeClassName,
          )}
        >
          {selectedCount}
        </span>
      )}
    </span>

    <ChevronDown
      className={cn(
        'ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200',
        'group-data-[state=open]:rotate-180',
      )}
    />
  </DropdownMenuPrimitive.Trigger>
));
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none',
      'focus:bg-surface-muted data-[state=open]:bg-surface-muted',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-dropdown min-w-[8rem] overflow-hidden rounded-lg border border-divider-secondary bg-white p-1 text-content shadow-dropdown',
      'data-[state=closed]:animate-fade-out data-[state=open]:animate-scale-in',
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-dropdown max-h-96 min-w-[8rem] overflow-auto rounded-xl bg-white p-1.5 text-content',
        'shadow-[0_10px_38px_-10px_rgba(22,23,24,0.15),0_10px_20px_-15px_rgba(22,23,24,0.1)]',
        'ring-1 ring-black/5',
        'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
        'data-[state=closed]:animate-fade-out data-[state=open]:animate-scale-in',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none transition-colors',
      'focus:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span
          className={cn(
            'flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center',
            'border border-[var(--accent)] bg-[var(--accent)]'
          )}
        >
          {checked && <Check size={9} color="var(--white)" strokeWidth={3} />}
        </span>
      </DropdownMenuPrimitive.ItemIndicator>
      {!checked && (
        <span
          className={cn(
            'flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center',
            'border border-[var(--border-checkbox-disabled)] bg-transparent'
          )}
        />
      )}
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none transition-colors',
      'focus:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('bg-border-secondary -mx-1 my-1 h-px', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
    {...props}
  />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};