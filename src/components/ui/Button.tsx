import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-plate text-plate-ink hover:brightness-105 active:brightness-95',
  secondary: 'bg-raised text-chalk border border-line hover:bg-[#33383e]',
  ghost: 'text-muted hover:text-chalk hover:bg-raised',
  danger: 'bg-transparent text-stop border border-stop/40 hover:bg-stop/10',
  success: 'bg-go text-[#0d2418] hover:brightness-105'
};
const SIZES: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'min-h-11 px-4 py-2 text-[15px] gap-2 rounded-xl text-center',
  lg: 'min-h-14 px-5 py-3 text-lg gap-2.5 rounded-2xl text-center'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', icon, block, className = '', children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 select-none items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-raised hover:text-chalk disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
