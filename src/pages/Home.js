import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap';
import { useLiveReports } from '../lib/hooks';
import { useReportStore } from '../stores/reportStore';
import { Button, EmptyState } from '../components/ui';
const EMERGENCY_NUMBERS = [
    { num: '112', label: 'National' },
    { num: '101', label: 'Fire' },
    { num: '108', label: 'Ambulance' },
    { num: '1077', label: 'Disaster' },
];
export default function Home() {
    useLiveReports();
    const navigate = useNavigate();
    const reports = useReportStore((s) => s.reports);
    const zones = useReportStore((s) => s.zones);
    const loading = useReportStore((s) => s.loading);
    const active = reports.filter((r) => r.status === 'pending' || r.status === 'investigating');
    const openEvac = (r) => {
        navigate(`/evacuate/${r.id}`);
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { id: "rg-emergency-card", className: "rounded-2xl border border-slate-200 bg-white p-3 sm:p-4", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-extrabold text-red-700 uppercase", children: [_jsx(PhoneCall, { className: "h-4 w-4" }), " Emergency \u2014 tap to call"] }), _jsx("div", { className: "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4", children: EMERGENCY_NUMBERS.map((e) => (_jsxs("a", { href: `tel:${e.num}`, title: `${e.label} helpline`, className: "flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-xl bg-red-50 py-2 ring-1 ring-red-200 ring-inset hover:bg-red-100 active:scale-[0.98]", children: [_jsx("span", { className: "text-lg font-extrabold text-red-700 tabular-nums", children: e.num }), _jsx("span", { className: "text-xs font-bold text-red-400", children: e.label })] }, e.num))) }), _jsx(Link, { to: "/report", className: "mt-2 block sm:mt-3", children: _jsx(Button, { size: "lg", className: "w-full", children: "Report an incident \u2192" }) })] }), loading && reports.length === 0 ? (_jsxs("div", { className: "space-y-3", "aria-label": "Loading incidents", children: [_jsx("div", { className: "h-14 animate-pulse rounded-2xl bg-slate-200" }), _jsx("div", { className: "h-96 animate-pulse rounded-xl bg-slate-200" })] })) : active.length === 0 ? (_jsx(EmptyState, { title: "No active incidents", hint: "All reported incidents are currently resolved. The map will update live when new reports arrive." })) : (_jsxs(_Fragment, { children: [_jsx(IncidentMap, { reports: active, zones: zones, showDangerZones: true, className: "rg-map-home", centerOnUser: true, onEvacuate: openEvac }), _jsxs("div", { className: "flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-semibold text-slate-500", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-red-600" }), " Critical"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-orange-500" }), " High"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-amber-500" }), " Medium"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-emerald-500" }), " Low"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" }), " Safe zone"] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "h-3 w-3 rounded-full bg-blue-600" }), " You"] })] }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Tap a ", _jsx("strong", { children: "colored marker" }), " for details \u2014 or hit ", _jsx("strong", { children: "Evacuate safely" }), " for live road routing to the nearest shelter."] })] }))] }));
}
