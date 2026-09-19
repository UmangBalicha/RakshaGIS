/* Minimal shadcn-style UI primitives (light theme only). */
import { useEffect } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 min-h-[44px] px-4 text-sm touch-manipulation',
  md: 'h-12 min-h-[48px] px-5 text-sm touch-manipulation',
  lg: 'h-14 min-h-[56px] px-6 text-base touch-manipulation',
};

export function Button({ variant = 'primary', size = 'md', className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg font-semibold transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-[0.98]',
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

/* ---------- Card ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('border-b border-slate-100 px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn('text-base font-bold text-slate-900', className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

/* ---------- Badge ---------- */

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Form fields ---------- */

export function Label({ htmlFor, children, required }: { htmlFor?: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

const INPUT_CLS =
  'w-full min-h-[48px] rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm sm:py-2.5';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_CLS, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(INPUT_CLS, 'min-h-24 resize-y', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(INPUT_CLS, 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/* ---------- Stat ---------- */

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {accent ? <span className={cn('h-8 w-1.5 rounded-full', accent)} /> : null}
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

/* ---------- Spinner / empty ---------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600',
        className,
      )}
      aria-label="Loading"
    />
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-bold text-slate-700">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'rg-modal-panel w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="pr-2 text-base font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg px-3 py-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
