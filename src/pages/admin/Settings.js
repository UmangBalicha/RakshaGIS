import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isDemoMode } from '../../lib/api';
import { isSupabaseEnabled } from '../../lib/supabase';
import { mockResetDemo } from '../../lib/mock';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '../../components/ui';
const NOTIF_KEY = 'rakshagis_notif_prefs_v1';
function loadPrefs() {
    try {
        const raw = localStorage.getItem(NOTIF_KEY);
        if (raw)
            return JSON.parse(raw);
    }
    catch {
        /* ignore */
    }
    return { browser: true, criticalOnly: false };
}
export default function AdminSettings() {
    const profile = useAuthStore((s) => s.profile);
    const refresh = useReportStore((s) => s.refresh);
    const [prefs, setPrefs] = useState(loadPrefs);
    const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    useEffect(() => {
        try {
            localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
        }
        catch {
            /* ignore */
        }
    }, [prefs]);
    const enableBrowser = async () => {
        if (typeof Notification === 'undefined') {
            toast.error('This browser does not support notifications.');
            return;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
            setPrefs((p) => ({ ...p, browser: true }));
            toast.success('Browser notifications enabled.');
        }
        else {
            toast.error('Notification permission was denied.');
        }
    };
    const testNotification = () => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
            toast.error('Enable browser notifications first.');
            return;
        }
        new Notification('RakshaGIS test alert', {
            body: 'Critical landslide near Mallital, Nainital — triage required.',
        });
        toast.success('Test notification sent.');
    };
    const resetDemo = async () => {
        if (!isDemoMode) {
            toast.error('Demo reset is only available in demo mode.');
            return;
        }
        mockResetDemo();
        await refresh();
        toast.success('Demo data restored to seed state.');
    };
    return (_jsxs("div", { className: "mx-auto max-w-3xl space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Settings" }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: "Console preferences, alerts and backend status." })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Signed in as" }) }), _jsxs(CardContent, { className: "text-sm", children: [_jsx("p", { className: "font-bold text-slate-900", children: profile?.full_name }), _jsxs("p", { className: "text-slate-500", children: [profile?.email ?? profile?.phone, " \u00B7 role: ", profile?.role] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Alert notifications" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Browser notifications" }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Status: ", permission, ". Pop a system alert when new reports arrive."] })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: () => void enableBrowser(), children: permission === 'granted' ? 'Re-check' : 'Enable' })] }), _jsxs("label", { className: "flex cursor-pointer items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Critical-only alerts" }), _jsx("p", { className: "text-xs text-slate-500", children: "Only notify for critical-severity reports." })] }), _jsx("input", { type: "checkbox", checked: prefs.criticalOnly, onChange: (e) => setPrefs((p) => ({ ...p, criticalOnly: e.target.checked })), className: "h-5 w-5 accent-red-600" })] }), _jsx(Button, { variant: "secondary", size: "sm", onClick: testNotification, children: "Send test alert" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Backend connection" }) }), _jsxs(CardContent, { className: "text-sm", children: [isSupabaseEnabled ? (_jsxs("div", { className: "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900", children: [_jsx("p", { className: "font-bold", children: "Live \u2014 connected to Supabase." }), _jsx("p", { className: "mt-0.5 text-xs", children: "Reports, auth and realtime sync use your Supabase project. Run supabase/schema.sql once to create tables." })] })) : (_jsxs("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900", children: [_jsx("p", { className: "font-bold", children: "Demo mode \u2014 no backend keys found." }), _jsx("p", { className: "mt-0.5 text-xs", children: "Data is seeded locally in this browser. Copy .env.example to .env and add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to go live." })] })), isDemoMode ? (_jsx(Button, { variant: "danger", size: "sm", className: "mt-3", onClick: () => void resetDemo(), children: "Restore demo seed data" })) : null] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Triage guide" }) }), _jsx(CardContent, { children: _jsxs("ul", { className: "list-disc space-y-1.5 pl-5 text-xs text-slate-600", children: [_jsxs("li", { children: [_jsx("strong", { children: "Critical" }), " \u2014 injuries reported, or an event threatening homes, hospitals or highways (quake, tsunami, cyclone, major blast). Triage immediately."] }), _jsxs("li", { children: [_jsx("strong", { children: "High" }), " \u2014 spreading floods, landslides, wildfires, or hazmat leaks affecting habitation."] }), _jsxs("li", { children: [_jsx("strong", { children: "Medium" }), " \u2014 contained building fires or slow-moving events away from people."] }), _jsxs("li", { children: [_jsx("strong", { children: "Low" }), " \u2014 minor, already controlled, or likely false alarm pending verification."] }), _jsx("li", { children: "Move reports through Pending \u2192 Investigating \u2192 Contained \u2192 Resolved so citizens see progress." })] }) })] })] }));
}
