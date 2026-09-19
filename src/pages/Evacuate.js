import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap';
import EvacuationPanel from '../components/evacuation/EvacuationPanel';
import { useLiveReports } from '../lib/hooks';
import { DISASTER_TYPE_META, SEVERITY_META, cn } from '../lib/utils';
import { useReportStore } from '../stores/reportStore';
import { Button, EmptyState } from '../components/ui';
export default function Evacuate() {
    const { id } = useParams();
    useLiveReports();
    const reports = useReportStore((s) => s.reports);
    const zones = useReportStore((s) => s.zones);
    const redZones = useReportStore((s) => s.redZones);
    const loading = useReportStore((s) => s.loading);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const report = reports.find((r) => r.id === id) ?? null;
    if (loading && reports.length === 0) {
        return (_jsxs("div", { className: "space-y-3", "aria-label": "Loading evacuation", children: [_jsx("div", { className: "h-12 animate-pulse rounded-xl bg-slate-200" }), _jsx("div", { className: "h-64 animate-pulse rounded-xl bg-slate-200" }), _jsx("div", { className: "h-32 animate-pulse rounded-xl bg-slate-200" })] }));
    }
    if (!report) {
        return (_jsxs("div", { className: "space-y-3", children: [_jsxs(Link, { to: "/", className: "inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to map"] }), _jsx(EmptyState, { title: "Report not found", hint: "This incident may have been removed or the link is incorrect." })] }));
    }
    const typeLabel = DISASTER_TYPE_META[report.disaster_type].label;
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "sticky top-14 z-[900] -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-100/95 px-4 py-2 backdrop-blur sm:top-16", children: [_jsxs(Link, { to: "/", className: "inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to map"] }), _jsx(Link, { to: "/report", children: _jsx(Button, { size: "md", children: "Report an incident \u2192" }) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3", children: [report.severity === 'critical' || report.severity === 'high' ? (_jsx(AlertTriangle, { className: "h-5 w-5 shrink-0 text-red-600" })) : (_jsx(MapPin, { className: "h-5 w-5 shrink-0 text-slate-500" })), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("p", { className: "text-sm font-extrabold text-slate-900", children: ["Evacuate \u2014 ", typeLabel] }), _jsx("p", { className: "truncate text-sm text-slate-500", children: report.address })] }), _jsx("span", { className: cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', SEVERITY_META[report.severity].badge), children: SEVERITY_META[report.severity].label })] }), _jsx(IncidentMap, { reports: [report], zones: zones, redZones: redZones, showDangerZones: true, selectedRoute: selectedRoute, className: "rg-map-evac", centerOnUser: true }), _jsx(EvacuationPanel, { origin: { lat: report.latitude, lng: report.longitude, label: report.address }, onRouteSelect: setSelectedRoute })] }));
}
