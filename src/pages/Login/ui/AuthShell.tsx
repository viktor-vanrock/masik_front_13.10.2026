import type { FormEventHandler, ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthShellProps {
  title: string;
  description: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

export function AuthShell({ title, description, onSubmit, children }: AuthShellProps) {
  return (
    <div className="relative isolate grid min-h-[calc(100vh-68px-97px)] place-items-center overflow-hidden bg-[#10121b] px-4 py-8 text-[#f2f3fc] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-[#6b73e8] [&_:focus-visible]:outline-offset-[3px]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden before:absolute before:inset-0 before:opacity-[.45] before:content-[''] before:[background-image:linear-gradient(rgb(172_179_207_/_12%)_1px,transparent_1px),linear-gradient(90deg,rgb(172_179_207_/_12%)_1px,transparent_1px)] before:[background-size:64px_64px] before:[background-position:center_top] before:[mask-image:radial-gradient(ellipse_60%_70%_at_70%_0%,#000_0%,transparent_75%)] after:absolute after:top-[-260px] after:right-[-240px] after:h-[600px] after:w-[900px] after:content-[''] after:[background:radial-gradient(closest-side,rgb(88_101_201_/_22%),transparent)]" aria-hidden="true" />
      <form className="grid w-full max-w-[420px] gap-[18px] rounded-[24px] border border-[#acb3cf33] bg-[#1d202f9e] p-[clamp(24px,4vw,36px)] shadow-[0_30px_80px_-30px_#040516] backdrop-blur-[24px] backdrop-saturate-[1.4]" onSubmit={onSubmit} noValidate>
        <Logo />
        <div><h1 className="m-0 text-[30px] leading-[1.1] font-medium tracking-[-.02em] text-[#f2f3fc]">{title}</h1><p className="mt-1.5 mb-0 text-[15px] leading-6 text-[#acb3cf]">{description}</p></div>
        {children}
      </form>
    </div>
  );
}
