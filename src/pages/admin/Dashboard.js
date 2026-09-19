import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import IncidentMap, {} from '../../components/map/IncidentMap';
import { ReportDetailModal, SeverityBadge, StatusBadge } from '../../components/reports/ReportDetail';
import ReportFiltersBar from '../../components/reports/ReportFilters';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPE_META, SEVERITY_META, formatDateTime, timeAgo } from '../../lib/utils';
import { applyFilters, useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner, Stat } from '../../components/ui';
export default function AdminDashboard() {
    useLiveReports();
    const reports = useReportStore((s) => s.reports);
    const alerts = useReportStore((s) => s.alerts);
    const zones = useReportStore((s) => s.zones);
    const loading = useReportStore((s) => s.loading);
    const filters = useReportStore((s) => s.filters);
    const [selected, setSelected] = useState(null);
    const [focus, setFocus] = useState(undefined);
    const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
    const active = useMemo(() => filtered.filter((r) => r.status === 'pending' || r.status === 'investigating'), [filtered]);
    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return {
            total: reports.length,
            active: reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length,
            critical: reports.filter((r) => r.severity === 'critical' && (r.status === 'pending' || r.status === 'investigating')).length,
            today: reports.filter((r) => r.created_at.slice(0, 10) === today).length,
            resolved: reports.filter((r) => r.status === 'resolved').length,
        };
    }, [reports]);
    const severityCounts = useMemo(() => {
        const c = { critical: 0, high: 0, medium: 0, low: 0 };
        for (const r of active)
            c[r.severity] += 1;
        return c;
    }, [active]);
    const openReport = (r, fly = false) => {
        if (fly)
            setFocus({ lat: r.latitude, lng: r.longitude, id: r.id, nonce: Date.now() });
        setSelected(r);
    };
    const openAlertReport = (reportId) => {
        if (!reportId)
            return;
        const r = reports.find((x) => x.id === reportId);
        if (r)
            openReport(r, true);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Authority console" }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: "Live all-hazard intelligence, triage and evacuation tracking." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Link, { to: "/admin/reports", children: _jsx(Button, { variant: "secondary", children: "Manage reports" }) }), _jsx(Link, { to: "/admin/safe-zones", children: _jsx(Button, { variant: "secondary", children: "Safe zones" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 lg:grid-cols-5", children: [_jsx(Stat, { label: "Total reports", value: stats.total, accent: "bg-slate-500" }), _jsx(Stat, { label: "Active incidents", value: stats.active, accent: "bg-orange-500" }), _jsx(Stat, { label: "Critical active", value: stats.critical, accent: "bg-red-600" }), _jsx(Stat, { label: "Reported today", value: stats.today, accent: "bg-blue-500" }), _jsx(Stat, { label: "Safe zones live", value: zones.filter((z) => z.is_active).length, accent: "bg-emerald-500" })] }), _jsx(ReportFiltersBar, {}), _jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-3", children: [_jsxs(Card, { className: "xl:col-span-2", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { children: ["Live incident map (", active.length, " active)"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600", children: [_jsx("span", { className: "h-2 w-2 animate-pulse rounded-full bg-emerald-500" }), " LIVE"] })] }), _jsx(CardContent, { children: loading && reports.length === 0 ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Spinner, {}) })) : active.length === 0 ? (_jsx(EmptyState, { title: "No active incidents", hint: "New reports will appear here in real time." })) : (_jsx(IncidentMap, { reports: active, zones: zones, showDangerZones: true, height: "480px", fitKey: `admin-${filtered.length}`, focus: focus, onViewDetails: (reportId) => {
                                        const r = reports.find((x) => x.id === reportId);
                                        if (r)
                                            setSelected(r);
                                    }, onEvacuate: (r) => setSelected(r) })) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Severity mix (active)" }) }), _jsx(CardContent, { className: "space-y-2.5", children: Object.keys(severityCounts).map((s) => {
                                            const total = Math.max(1, active.length);
                                            const pct = Math.round((severityCounts[s] / total) * 100);
                                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-bold", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5 text-slate-700", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${SEVERITY_META[s].dot}` }), SEVERITY_META[s].label] }), _jsxs("span", { className: "text-slate-500 tabular-nums", children: [severityCounts[s], " (", pct, "%)"] })] }), _jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: `h-full rounded-full ${SEVERITY_META[s].dot}`, style: { width: `${pct}%` } }) })] }, s));
                                        }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Latest alerts \u2014 tap to open" }) }), _jsxs(CardContent, { className: "rg-scroll max-h-72 space-y-2 overflow-y-auto", children: [alerts.slice(0, 8).map((a) => (_jsxs("button", { type: "button", onClick: () => openAlertReport(a.report_id), title: a.report_id ? 'Open the incident report' : undefined, className: "block w-full cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2 w-2 shrink-0 rounded-full ${SEVERITY_META[a.severity].dot}` }), _jsx("p", { className: "line-clamp-2 text-xs font-medium text-slate-700", children: a.message })] }), _jsxs("p", { className: "mt-1 pl-4 text-[11px] text-slate-400", children: [timeAgo(a.created_at), a.report_id ? ' · open report →' : ''] })] }, a.id))), alerts.length === 0 ? _jsx("p", { className: "text-xs text-slate-400", children: "No alerts yet." }) : null] })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { children: ["Alert log (", filtered.length, ")"] }), _jsx(Link, { to: "/admin/reports", className: "text-xs font-bold text-brand-600 hover:underline", children: "Open full table \u2192" })] }), _jsx(CardContent, { className: "overflow-x-auto p-0", children: filtered.length === 0 ? (_jsx("div", { className: "p-5", children: _jsx(EmptyState, { title: "No matching reports", hint: "Adjust the filters above." }) })) : (_jsxs("table", { className: "w-full min-w-180 text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-y border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase", children: [_jsx("th", { className: "px-4 py-2.5", children: "Report" }), _jsx("th", { className: "px-4 py-2.5", children: "Severity" }), _jsx("th", { className: "px-4 py-2.5", children: "Type" }), _jsx("th", { className: "px-4 py-2.5", children: "Location" }), _jsx("th", { className: "px-4 py-2.5", children: "Filed" }), _jsx("th", { className: "px-4 py-2.5", children: "Status" }), _jsx("th", { className: "px-4 py-2.5 text-right", children: "Action" })] }) }), _jsx("tbody", { children: filtered.slice(0, 12).map((r) => (_jsxs("tr", { className: "border-b border-slate-50 last:border-0 hover:bg-slate-50/70", children: [_jsx("td", { className: "px-4 py-2.5 font-mono text-xs font-bold text-slate-700", children: r.id.slice(0, 8) }), _jsx("td", { className: "px-4 py-2.5", children: _jsx(SeverityBadge, { value: r.severity }) }), _jsx("td", { className: "px-4 py-2.5 text-xs font-semibold text-slate-600", children: DISASTER_TYPE_META[r.disaster_type].label }), _jsx("td", { className: "max-w-56 truncate px-4 py-2.5 text-xs text-slate-600", children: r.address }), _jsx("td", { className: "px-4 py-2.5 text-xs whitespace-nowrap text-slate-500", children: formatDateTime(r.created_at) }), _jsx("td", { className: "px-4 py-2.5", children: _jsx(StatusBadge, { value: r.status }) }), _jsx("td", { className: "px-4 py-2.5 text-right", children: _jsx("button", { type: "button", onClick: () => openReport(r, true), className: "cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 hover:underline", children: "Locate \u2192" }) })] }, r.id))) })] })) })] }), _jsx(ReportDetailModal, { report: selected ? (reports.find((r) => r.id === selected.id) ?? selected) : null, onClose: () => setSelected(null) })] }));
}
