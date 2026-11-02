import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label: string;
  icon: LucideIcon;
  error?: string;
}

/** forwardRef — чтобы react-hook-form `register()` мог прокинуть ref. */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField({ label, icon: Icon, error, ...props }, ref) {
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const errorId = `${id}-error`;

    return (
      <div className="grid gap-2 [&_label]:text-[14px] [&_label]:font-semibold">
        <label htmlFor={id}>
          {label}
        </label>
        <div className="relative">
          <Icon
            size={16}
            className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2 text-[#8890ad]"
          />
          <input
            {...props}
            ref={ref}
            id={id}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={error ? [props['aria-describedby'], errorId].filter(Boolean).join(' ') : props['aria-describedby']}
            className="h-11 w-full rounded-[12px] border border-[#ffffff1a] bg-[#1d202fb3] pr-[14px] pl-10 text-[15px] text-[#f2f3fc] outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#8890ad] focus:border-[#6b73e8cc] focus:bg-[#1d202f] focus:shadow-[0_0_0_3px_#5865c938] focus-visible:outline-none! aria-invalid:border-[#ff91a0] autofill:[-webkit-text-fill-color:#f2f3fc] autofill:[-webkit-box-shadow:0_0_0_100px_#1d202f_inset] autofill:caret-[#f2f3fc] autofill:focus:[-webkit-box-shadow:0_0_0_100px_#1d202f_inset,0_0_0_3px_#5865c938]"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="m-0 text-[13px] leading-[18px] text-[#ff91a0]">
            {error}
          </p>
        )}
      </div>
    );
  }
);
