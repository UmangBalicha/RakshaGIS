import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSessionProfile } from '../../lib/auth';
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
    // Defense in depth: the client-side role check above is UX, not security
    // (RLS is the real gate). Re-verify the role from the server on mount so
    // a stale/demoted session can never keep rendering the console.
    const [reverified, setReverified] = useState(false);
    useEffect(() => {
        let cancelled = false;
        void getSessionProfile()
            .then((p) => {
            if (!cancelled) {
                useAuthStore.getState().setProfile(p);
                setReverified(true);
            }
        })
            .catch(() => {
            if (!cancelled)
                setReverified(true);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    if (!initialized || !reverified)
        return _jsx(LoadingScreen, {});
    if (!profile)
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: '/admin' } });
    if (profile.role !== 'admin')
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(Outlet, {});
}
