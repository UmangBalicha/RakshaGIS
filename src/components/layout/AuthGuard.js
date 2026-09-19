import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Spinner } from '../ui';
function LoadingScreen() {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx(Spinner, { className: "h-8 w-8" }), _jsx("p", { className: "text-sm font-semibold text-slate-500", children: "Loading RakshaGIS\u2026" })] }) }));
}
export function RequireAuth() {
    const initialized = useAuthStore((s) => s.initialized);
    const profile = useAuthStore((s) => s.profile);
    const location = useLocation();
    if (!initialized)
        return _jsx(LoadingScreen, {});
    if (!profile)
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location.pathname } });
    return _jsx(Outlet, {});
}
export function RequireAdmin() {
    const initialized = useAuthStore((s) => s.initialized);
    const profile = useAuthStore((s) => s.profile);
    if (!initialized)
        return _jsx(LoadingScreen, {});
    if (!profile)
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: '/admin' } });
    if (profile.role !== 'admin')
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(Outlet, {});
}
