import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function IconButton({
  children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={
        'flex h-9 w-9 items-center justify-center rounded-full text-text ' +
        'bg-white/[0.06] border-[0.5px] border-white/10 ' +
        'cursor-pointer ' + className
      }
    >
      {children}
    </button>
  );
}
