import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPES } from '../../lib/types';
import { DISASTER_TYPE_META, SEVERITY_META } from '../../lib/utils';
import { useReportStore } from '../../stores/reportStore';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner } from '../../components/ui';
const SEV_FILL = {
    Critical: '#dc2626',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981',
};
const TYPE_FILL = ['#dc2626', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#64748b', '#14b8a6', '#a855f7', '#78716c'];
function dayKey(iso) {
    return iso.slice(0, 10);
}
function shortDay(iso) {
    return iso.slice(5).replace('-', '/');
}
export default function AdminAnalytics() {
    useLiveReports();
    const reports = useReportStore((s) => s.reports);
    const loading = useReportStore((s) => s.loading);
    const perDay = useMemo(() => {
        const map = new Map();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400_000).toISOString();
            map.set(dayKey(d), 0);
        }
        for (const r of reports) {
            const k = dayKey(r.created_at);
            if (map.has(k))
                map.set(k, (map.get(k) ?? 0) + 1);
        }
        return [...map.entries()].map(([day, count]) => ({ day: shortDay(day), reports: count }));
    }, [reports]);
    const bySeverity = useMemo(() => ['critical', 'high', 'medium', 'low'].map((s) => ({
        name: SEVERITY_META[s].label,
        value: reports.filter((r) => r.severity === s).length,
    })), [reports]);
    const byType = useMemo(() => DISASTER_TYPES.map((t) => ({
        name: DISASTER_TYPE_META[t].label,
        value: reports.filter((r) => r.disaster_type === t).length,
    })).filter((x) => x.value > 0), [reports]);
    const statusShare = useMemo(() => {
        const total = Math.max(1, reports.length);
        const pct = (n) => Math.round((n / total) * 100);
        const resolved = reports.filter((r) => r.status === 'resolved').length;
        const active = reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length;
        const falseAlarm = reports.filter((r) => r.status === 'false_alarm').length;
        return { resolved, active, falseAlarm, resolvedPct: pct(resolved), activePct: pct(active) };
    }, [reports]);
    if (loading && reports.length === 0) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "flex justify-center py-16", children: _jsx(Spinner, {}) }) }));
    }
    if (reports.length === 0) {
        return _jsx(EmptyState, { title: "No data yet", hint: "Analytics will appear once incidents are reported." });
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Analytics" }), _jsxs("p", { className: "mt-0.5 text-sm text-slate-500", children: ["Trends across ", reports.length, " incident reports."] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Reports per day (last 14 days)" }) }), _jsx(CardContent, { children: _jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: perDay, margin: { top: 5, right: 10, bottom: 0, left: -15 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e2e8f0" }), _jsx(XAxis, { dataKey: "day", tick: { fontSize: 11 }, stroke: "#64748b" }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 11 }, stroke: "#64748b" }), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "reports", stroke: "#dc2626", strokeWidth: 2.5, dot: { r: 3 } })] }) }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Reports by severity" }) }), _jsx(CardContent, { children: _jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: bySeverity, margin: { top: 5, right: 10, bottom: 0, left: -15 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e2e8f0" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 11 }, stroke: "#64748b" }), _jsx(YAxis, { allowDecimals: false, tick: { fontSize: 11 }, stroke: "#64748b" }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "value", radius: [6, 6, 0, 0], children: bySeverity.map((entry) => (_jsx(Cell, { fill: SEV_FILL[entry.name] ?? '#64748b' }, entry.name))) })] }) }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Reports by disaster type" }) }), _jsxs(CardContent, { children: [_jsx("div", { style: { height: 260 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: byType, dataKey: "value", nameKey: "name", innerRadius: 55, outerRadius: 95, paddingAngle: 3, label: { fontSize: 11 }, children: byType.map((entry, i) => (_jsx(Cell, { fill: TYPE_FILL[i % TYPE_FILL.length] }, entry.name))) }), _jsx(Tooltip, {})] }) }) }), _jsx("div", { className: "mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-600", children: byType.map((t, i) => (_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full", style: { background: TYPE_FILL[i % TYPE_FILL.length] } }), t.name, ": ", t.value] }, t.name))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Response snapshot" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-600", children: [_jsx("span", { children: "Resolved" }), _jsxs("span", { className: "tabular-nums", children: [statusShare.resolved, " (", statusShare.resolvedPct, "%)"] })] }), _jsx("div", { className: "mt-1 h-3 overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: "h-full rounded-full bg-emerald-500", style: { width: `${statusShare.resolvedPct}%` } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-600", children: [_jsx("span", { children: "Active (pending + investigating)" }), _jsxs("span", { className: "tabular-nums", children: [statusShare.active, " (", statusShare.activePct, "%)"] })] }), _jsx("div", { className: "mt-1 h-3 overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: "h-full rounded-full bg-orange-500", style: { width: `${statusShare.activePct}%` } }) })] }), _jsxs("div", { className: "rounded-xl bg-slate-50 p-4 text-sm text-slate-600", children: [_jsxs("p", { children: [_jsx("strong", { className: "text-slate-900", children: statusShare.falseAlarm }), " reports were marked as false alarms."] }), _jsx("p", { className: "mt-1", children: "Triage pending reports quickly to keep the active queue short and the public map trustworthy." })] })] })] })] })] }));
}
