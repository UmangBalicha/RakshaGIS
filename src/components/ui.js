import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* Minimal shadcn-style UI primitives (light theme only). */
import { useEffect } from 'react';
import { cn } from '../lib/utils';
const BTN_VARIANTS = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500',
    secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};
const BTN_SIZES = {
    sm: 'h-11 min-h-[44px] px-4 text-sm touch-manipulation',
    md: 'h-12 min-h-[48px] px-5 text-sm touch-manipulation',
    lg: 'h-14 min-h-[56px] px-6 text-base touch-manipulation',
};
export function Button({ variant = 'primary', size = 'md', className, type, ...rest }) {
    return (_jsx("button", { type: type ?? 'button', className: cn('inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg font-semibold transition-colors select-none', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', 'disabled:cursor-not-allowed disabled:opacity-50', 'active:scale-[0.98]', BTN_VARIANTS[variant], BTN_SIZES[size], className), ...rest }));
}
/* ---------- Card ---------- */
export function Card({ className, children }) {
    return (_jsx("div", { className: cn('rounded-xl border border-slate-200 bg-white shadow-sm', className), children: children }));
}
export function CardHeader({ className, children }) {
    return _jsx("div", { className: cn('border-b border-slate-100 px-5 py-4', className), children: children });
}
export function CardTitle({ className, children }) {
    return _jsx("h3", { className: cn('text-base font-bold text-slate-900', className), children: children });
}
export function CardContent({ className, children }) {
    return _jsx("div", { className: cn('px-5 py-4', className), children: children });
}
/* ---------- Badge ---------- */
export function Badge({ className, children }) {
    return (_jsx("span", { className: cn('inline-flex items-center gap-1 leading-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', className), children: children }));
}
/* ---------- Form fields ---------- */
export function Label({ htmlFor, children, required }) {
    return (_jsxs("label", { htmlFor: htmlFor, className: "mb-1.5 block text-sm font-semibold text-slate-700", children: [children, required ? _jsx("span", { className: "ml-0.5 text-brand-600", children: "*" }) : null] }));
}
export function FieldError({ message }) {
    if (!message)
        return null;
    return _jsx("p", { className: "mt-1 text-sm font-medium text-red-600", children: message });
}
const INPUT_CLS = 'w-full min-h-[48px] rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm sm:py-2.5';
export function Input({ className, ...rest }) {
    return _jsx("input", { className: cn(INPUT_CLS, className), ...rest });
}
export function Textarea({ className, ...rest }) {
    return _jsx("textarea", { className: cn(INPUT_CLS, 'min-h-24 resize-y', className), ...rest });
}
export function Select({ className, children, ...rest }) {
    return (_jsx("select", { className: cn(INPUT_CLS, 'cursor-pointer pr-8', className), ...rest, children: children }));
}
/* ---------- Stat ---------- */
export function Stat({ label, value, sub, accent, }) {
    return (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [accent ? _jsx("span", { className: cn('h-8 w-1.5 rounded-full', accent) }) : null, _jsx("p", { className: "text-xs font-semibold tracking-wide text-slate-500 uppercase", children: label })] }), _jsx("p", { className: "mt-1 text-2xl font-extrabold text-slate-900 tabular-nums", children: value }), sub ? _jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: sub }) : null] }));
}
/* ---------- Spinner / empty ---------- */
export function Spinner({ className }) {
    return (_jsx("span", { className: cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600', className), "aria-label": "Loading" }));
}
export function EmptyState({ title, hint }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center", children: [_jsx("p", { className: "text-base font-bold text-slate-700", children: title }), hint ? _jsx("p", { className: "mt-1 max-w-sm text-sm text-slate-500", children: hint }) : null] }));
}
/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide, }) {
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[1200] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-label": title, children: _jsxs("div", { className: cn('rg-modal-panel w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'), onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4", children: [_jsx("h3", { className: "pr-2 text-base font-bold text-slate-900", children: title }), _jsx("button", { type: "button", onClick: onClose, className: "flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg px-3 py-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700", "aria-label": "Close", children: "\u00D7" })] }), _jsx("div", { className: "px-5 py-4", children: children })] }) }));
}
