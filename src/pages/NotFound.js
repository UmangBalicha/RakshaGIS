import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export default function NotFound() {
    return (_jsxs("div", { className: "mx-auto max-w-md py-16 text-center", children: [_jsx("p", { className: "text-5xl font-extrabold text-slate-200", children: "404" }), _jsx("h1", { className: "mt-2 text-xl font-extrabold text-slate-900", children: "Page not found" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "The page you are looking for does not exist." }), _jsx(Link, { to: "/", className: "mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700", children: "Back to home" })] }));
}
