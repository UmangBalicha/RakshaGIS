import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Home, LayoutDashboard, MapPin, Menu, Search, ShieldAlert, X } from 'lucide-react';
import { listNotifications, markNotificationRead } from '../../lib/api';
import { isDemoMode } from '../../lib/api';
import { cn, timeAgo } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui';
import StickyReportCta from './StickyReportCta';
/* ---------------- Notifications bell ---------------- */
export function NotificationsBell() {
    const profile = useAuthStore((s) => s.profile);
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!profile)
            return;
        let cancelled = false;
        listNotifications(profile.id)
            .then((rows) => {
            if (!cancelled)
                setItems(rows);
        })
            .catch(() => undefined);
        const timer = window.setInterval(() => {
            if (!profile)
                return;
            listNotifications(profile.id)
                .then((rows) => {
                if (!cancelled)
                    setItems(rows);
            })
                .catch(() => undefined);
        }, 30000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [profile]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape')
                setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open ]);
    if (!profile)
        return null;
    const unread = items.filter((n) => !n.is_read).length;
    const openItem = async (n) => {
        if (!n.is_read) {
            await markNotificationRead(n.id).catch(() => undefined);
            setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        }
        setOpen(false);
        // Deep-link: tapping a notification opens its incident report.
        if (n.report_id)
            navigate(`/track/${n.report_id}`);
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), className: "relative flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800", "aria-label": "Notifications", "aria-expanded": open, "aria-controls": "rg-notifications-popover", children: [_jsx(Bell, { className: "h-5 w-5" }), unread > 0 ? (_jsx("span", { className: "absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white", children: unread > 9 ? '9+' : unread })) : null] }), open ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setOpen(false) }), _jsxs("div", { id: "rg-notifications-popover", className: "absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl", children: [_jsx("div", { className: "border-b border-slate-100 px-4 py-3", children: _jsx("p", { className: "text-sm font-bold text-slate-900", children: "Notifications" }) }), _jsx("div", { className: "rg-scroll max-h-80 overflow-y-auto", children: items.length === 0 ? (_jsx("p", { className: "px-4 py-6 text-center text-sm text-slate-500", children: "No notifications yet." })) : (items.map((n) => (_jsxs("button", { type: "button", onClick: () => void openItem(n), className: cn('block w-full cursor-pointer touch-manipulation border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50', !n.is_read && 'bg-brand-50/60'), children: [_jsx("p", { className: "text-sm font-bold text-slate-900", children: n.title }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: n.message }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: timeAgo(n.created_at) })] }, n.id)))) })] })] })) : null] }));
}
/* ---------------- Public layout ---------------- */
function Brand() {
    return (_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white", children: _jsx(ShieldAlert, { className: "h-5 w-5" }) }), _jsxs("span", { className: "text-base font-extrabold tracking-tight text-slate-900 min-[400px]:text-lg", children: ["Raksha", _jsx("span", { className: "text-brand-600", children: "GIS" })] })] }));
}
export function PublicLayout() {
    const profile = useAuthStore((s) => s.profile);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const { pathname } = useLocation();
    // Never leave the hamburger drawer open across a navigation (e.g. a
    // bottom-tab tap changing the page behind the open drawer).
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);
    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        navigate('/');
    };
    const tabCls = ({ isActive }) => cn('relative flex min-h-[56px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-bold', isActive ? 'text-brand-600 after:absolute after:bottom-1 after:h-1 after:w-6 after:rounded-full after:bg-brand-600' : 'text-slate-500 hover:text-slate-900');
    return (_jsxs("div", { className: "flex min-h-screen flex-col", children: [_jsxs("header", { className: "rg-safe-top sticky top-0 z-[1000] border-b border-slate-200 bg-white/95 backdrop-blur", children: [_jsxs("div", { className: "rg-gutter-x mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 sm:h-16", children: [_jsx(Brand, {}), _jsxs("nav", { className: "hidden items-center gap-1 text-sm font-semibold sm:flex", children: [_jsx(NavLink, { to: "/", className: ({ isActive }) => cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'), children: "Home" }), _jsx(NavLink, { to: "/report", className: ({ isActive }) => cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'), children: "Report Incident" }), _jsx(NavLink, { to: "/track", className: ({ isActive }) => cn('rounded-lg px-3 py-2.5', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'), children: "Track" }), profile?.role === 'admin' ? (_jsxs(NavLink, { to: "/admin", className: "ml-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2.5 text-white hover:bg-slate-700", children: [_jsx(LayoutDashboard, { className: "h-4 w-4" }), " Dashboard"] })) : null] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(NotificationsBell, {}), profile ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "hidden max-w-32 truncate text-sm font-semibold text-slate-600 md:block", children: profile.full_name }), _jsx("span", { className: "hidden sm:inline-flex", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: () => void handleLogout(), children: "Sign out" }) })] })) : (_jsx(Link, { to: "/login", className: "hidden min-h-[44px] items-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white touch-manipulation hover:bg-brand-700 sm:inline-flex", children: "Sign in" })), _jsx("button", { type: "button", onClick: () => setMenuOpen((v) => !v), className: "flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden", "aria-label": menuOpen ? 'Close menu' : 'Open menu', "aria-expanded": menuOpen, "aria-controls": "rg-mobile-menu", children: menuOpen ? _jsx(X, { className: "h-6 w-6" }) : _jsx(Menu, { className: "h-6 w-6" }) })] })] }), isDemoMode ? (_jsx("div", { className: "border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-semibold text-amber-800", children: "Demo mode \u2014 data is stored locally in this browser. Add Supabase keys in .env to go live." })) : null, menuOpen ? (_jsx("nav", { id: "rg-mobile-menu", className: "rg-gutter-x border-t border-slate-100 bg-white py-3 sm:hidden", children: _jsxs("div", { className: "flex flex-col gap-1", children: [profile?.role === 'admin' ? (_jsxs(Link, { to: "/admin", onClick: () => setMenuOpen(false), className: "flex min-h-[48px] items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white touch-manipulation", children: [_jsx(LayoutDashboard, { className: "h-4 w-4" }), " Authority dashboard"] })) : null, profile ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "px-4 py-2 text-sm font-semibold text-slate-500", children: ["Signed in as ", profile.full_name] }), _jsx("button", { type: "button", onClick: () => void handleLogout(), className: "flex min-h-[48px] cursor-pointer touch-manipulation items-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700", children: "Sign out" })] })) : (_jsx(Link, { to: "/login", onClick: () => setMenuOpen(false), className: "flex min-h-[48px] items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white touch-manipulation", children: "Sign in" })), _jsx("p", { className: "mt-2 px-4 text-xs font-bold tracking-wide text-slate-400 uppercase", children: "Emergency numbers" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                                        { num: '112', label: 'National' },
                                        { num: '101', label: 'Fire' },
                                        { num: '108', label: 'Ambulance' },
                                        { num: '1077', label: 'Disaster' },
                                    ].map((e) => (_jsxs("a", { href: `tel:${e.num}`, className: "flex min-h-[48px] touch-manipulation flex-col items-center justify-center rounded-lg bg-red-50 py-2 ring-1 ring-red-200 ring-inset", children: [_jsx("span", { className: "text-base font-extrabold text-red-700 tabular-nums", children: e.num }), _jsx("span", { className: "text-xs font-bold text-red-700", children: e.label })] }, e.num))) })] }) })) : null] }), _jsx("main", { className: "rg-gutter-x mx-auto w-full max-w-6xl flex-1 pt-4 pb-24 sm:py-6 sm:pb-6", children: _jsx(Outlet, {}) }), _jsx("footer", { className: "mb-32 border-t border-slate-200 bg-white sm:mb-0", children: _jsxs("div", { className: "rg-gutter-x mx-auto flex max-w-6xl flex-col flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 text-sm text-slate-500 sm:flex-row sm:text-xs", children: [_jsx("p", { className: "font-semibold", children: "RakshaGIS \u2014 disaster reporting & response" }), _jsxs("p", { children: ["Emergencies: ", _jsx("a", { href: "tel:112", className: "font-bold text-slate-700 underline", children: "112" }), " national \u00B7 ", _jsx("a", { href: "tel:101", className: "font-bold text-slate-700 underline", children: "101" }), " fire \u00B7 ", _jsx("a", { href: "tel:108", className: "font-bold text-slate-700 underline", children: "108" }), " ambulance \u00B7 ", _jsx("a", { href: "tel:1077", className: "font-bold text-slate-700 underline", children: "1077" }), " disaster.", import.meta.env.VITE_MAPMYINDIA_KEY
                                    ? ' Map: © MapmyIndia.'
                                    : ' Map: © OpenStreetMap · boundaries are indicative.'] }), _jsxs("p", { className: "text-xs sm:text-xs", children: ["Built by ", _jsx("span", { className: "font-bold text-slate-700", children: "Umang Balicha" })] }), _jsx("p", { className: "flex items-center text-xs sm:text-xs", children: [_jsx(Link, { to: "/privacy", className: "inline-flex min-h-[44px] touch-manipulation items-center px-2 font-semibold hover:underline", children: "Privacy" }), "·", _jsx(Link, { to: "/terms", className: "inline-flex min-h-[44px] touch-manipulation items-center px-2 font-semibold hover:underline", children: "Terms" })] })] }) }), _jsx(StickyReportCta, {}), _jsx("nav", { className: "rg-bottom-safe rg-gutter-x fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden", children: _jsxs("div", { className: "flex items-stretch", children: [_jsxs(NavLink, { to: "/", end: true, className: tabCls, children: [_jsx(Home, { className: "h-6 w-6" }), "Home"] }), _jsxs(NavLink, { to: "/report", className: tabCls, children: [_jsx(MapPin, { className: "h-6 w-6" }), "Report"] }), _jsxs(NavLink, { to: "/track", className: tabCls, children: [_jsx(Search, { className: "h-6 w-6" }), "Track"] })] }) })] }));
}
/* ---------------- Admin layout ---------------- */
const ADMIN_LINKS = [
    { to: '/admin', label: 'Overview', end: true },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/red-zones', label: 'Red Zones' },
    { to: '/admin/relocation', label: 'Relocation' },
    { to: '/admin/safe-zones', label: 'Safe Zones' },
    { to: '/admin/analytics', label: 'Analytics' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/settings', label: 'Settings' },
];
export function AdminLayout() {
    const profile = useAuthStore((s) => s.profile);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const handleLogout = async () => {
        await logout();
        navigate('/');
    };
    return (_jsxs("div", { className: "flex min-h-screen flex-col", children: [_jsxs("header", { className: "rg-safe-top sticky top-0 z-[1000] border-b border-slate-200 bg-white", children: [_jsxs("div", { className: "rg-gutter-x mx-auto flex h-16 max-w-7xl items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Brand, {}), _jsx("span", { className: "hidden rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white md:inline-block", children: "AUTHORITY CONSOLE" })] }), _jsxs("nav", { className: "hidden items-center gap-1 text-sm font-semibold lg:flex", children: [ADMIN_LINKS.map((l) => (_jsx(NavLink, { to: l.to, end: l.end, className: ({ isActive }) => cn('rounded-lg px-3 py-2', isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'), children: l.label }, l.to))), _jsx(NavLink, { to: "/", className: "rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900", children: "Public site" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(NotificationsBell, {}), _jsxs("span", { className: "hidden text-sm font-semibold text-slate-600 md:block", children: [profile?.full_name, " \u00B7 Admin"] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => void handleLogout(), children: "Sign out" })] })] }), _jsx("nav", { className: "rg-gutter-x flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-2 text-sm font-semibold lg:hidden", children: ADMIN_LINKS.map((l) => (_jsx(NavLink, { to: l.to, end: l.end, className: ({ isActive }) => cn('inline-flex min-h-[44px] items-center rounded-lg px-3 py-2.5 whitespace-nowrap touch-manipulation', isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'), children: l.label }, l.to))) })] }), isDemoMode ? (_jsx("div", { className: "border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs font-semibold text-amber-800", children: "Demo mode \u2014 console data is stored locally in this browser. Add Supabase keys in .env to go live." })) : null, _jsx("main", { className: "rg-gutter-x mx-auto w-full max-w-7xl flex-1 py-6", children: _jsx(Outlet, {}) })] }));
}
