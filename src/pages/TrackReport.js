import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import IncidentMap from '../components/map/IncidentMap';
import EvacuationPanel from '../components/evacuation/EvacuationPanel';
import { SeverityBadge, StatusBadge } from '../components/reports/ReportDetail';
import ReportFiltersBar from '../components/reports/ReportFilters';
import { getReport } from '../lib/api';
import { DISASTER_TYPE_META, STATUS_META, cn, formatDateTime } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { applyFilters, useReportStore } from '../stores/reportStore';
import { useLiveReports } from '../lib/hooks';
import { Button, Card, CardContent, EmptyState, Input, Spinner } from '../components/ui';
const MINE_KEY = 'rakshagis_mine_v1';
function myIds() {
    try {
        const raw = localStorage.getItem(MINE_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
const TIMELINE = ['pending', 'investigating', 'contained', 'resolved'];
function StatusTimeline({ status }) {
    if (status === 'false_alarm') {
        return (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600", children: ["This report was reviewed and marked as a ", _jsx("strong", { children: "false alarm" }), ". No further action needed."] }));
    }
    const idx = TIMELINE.indexOf(status);
    return (_jsx("ol", { className: "space-y-0", children: TIMELINE.map((s, i) => (_jsxs("li", { className: "relative flex gap-3 pb-5 last:pb-0", children: [i < TIMELINE.length - 1 ? (_jsx("span", { className: cn('absolute top-6 left-[11px] h-full w-0.5', i < idx ? 'bg-emerald-500' : 'bg-slate-200') })) : null, _jsx("span", { className: cn('z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold', i < idx && 'bg-emerald-500 text-white', i === idx && 'bg-brand-600 text-white', i > idx && 'bg-slate-200 text-slate-500'), children: i < idx ? '✓' : i + 1 }), _jsx("div", { className: "pt-0.5", children: _jsxs("p", { className: cn('text-sm font-bold', i <= idx ? 'text-slate-900' : 'text-slate-500'), children: [STATUS_META[s].label, i === idx ? ' — current stage' : ''] }) })] }, s))) }));
}
function TrackDetail({ id }) {
    const [searchParams] = useSearchParams();
    const zones = useReportStore((s) => s.zones);
  const redZones = useReportStore((s) => s.redZones);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [retryNonce, setRetryNonce] = useState(0);
    const [evacOpen, setEvacOpen] = useState(searchParams.get('evacuate') === '1');
    const [route, setRoute] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        setLoadError(false);
        getReport(id)
            .then((r) => {
            if (cancelled)
                return;
            if (!r)
                setNotFound(true);
            else
                setReport(r);
        })
            .catch(() => {
            // Network/offline failure is NOT "not found" — say so explicitly.
            if (!cancelled)
                setLoadError(true);
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [id, retryNonce]);
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "flex justify-center py-16", children: _jsx(Spinner, {}) }) }));
    }
    if (loadError && !report) {
        return (_jsxs("div", { role: "alert", className: "rounded-xl border border-red-200 bg-red-50 p-4 text-center", children: [_jsx("p", { className: "text-sm font-bold text-red-800", children: "Couldn\u2019t load this report" }), _jsx("p", { className: "mt-1 text-sm text-red-700", children: "You may be offline. Check your connection and try again." }), _jsx(Button, { size: "sm", className: "mt-3", onClick: () => setRetryNonce((n) => n + 1), children: "Retry" })] }));
    }
    if (notFound || !report) {
        return (_jsx(EmptyState, { title: "Report not found", hint: "Check the report ID \u2014 it is shown on the confirmation screen right after you submit." }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { to: "/track", className: "inline-flex min-h-[44px] touch-manipulation items-center py-2 text-sm font-bold text-brand-600 hover:underline", children: "\u2190 All reports" }), _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: DISASTER_TYPE_META[report.disaster_type].label }), _jsxs("p", { className: "mt-0.5 text-sm text-slate-500", children: ["Report ID ", _jsx("span", { className: "font-mono font-bold text-slate-700", children: report.id.slice(0, 8) }), ' · ', "filed ", formatDateTime(report.created_at)] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(SeverityBadge, { value: report.severity }), _jsx(StatusBadge, { value: report.status })] })] }), _jsx(IncidentMap, { reports: [report], zones: zones, redZones: redZones, showDangerZones: true, selectedRoute: route, height: "320px" }), _jsxs("div", { children: [_jsx(Button, { variant: "secondary", size: "md", onClick: () => setEvacOpen((v) => !v), "aria-expanded": evacOpen, children: evacOpen ? 'Hide evacuation routes' : 'Show evacuation routes →' }), evacOpen ? (_jsx("div", { className: "mt-3", children: _jsx(EvacuationPanel, { origin: { lat: report.latitude, lng: report.longitude, label: report.address }, onRouteSelect: setRoute }) })) : null] }), _jsxs("div", { className: "grid grid-cols-1 gap-4 lg:grid-cols-2", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-5", children: [_jsx("h2", { className: "text-sm font-extrabold text-slate-900", children: "Response progress" }), _jsx("div", { className: "mt-4", children: _jsx(StatusTimeline, { status: report.status }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "space-y-3 pt-5 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-500", children: "Location" }), _jsx("p", { className: "font-medium text-slate-900", children: report.address }), _jsxs("p", { className: "text-sm text-slate-400", children: [report.latitude.toFixed(5), ", ", report.longitude.toFixed(5)] })] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-500", children: "Description" }), _jsx("p", { className: "text-slate-800", children: report.description || '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-500", children: "Casualties / injuries" }), _jsx("p", { className: "text-slate-800", children: report.has_injuries ? `Yes (${report.injury_count})` : 'None reported' })] }), report.images.length > 0 ? (_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-500", children: "Photos" }), _jsx("div", { className: "mt-1.5 grid grid-cols-3 gap-2", children: report.images.map((src) => (_jsx("img", { src: src, alt: "Photo evidence attached to this incident report", className: "h-20 w-full rounded-lg border border-slate-200 object-cover" }, src))) })] })) : null] }) })] })] }));
}
export default function TrackReport() {
    const { id } = useParams();
    // Always bootstrap the store: the detail route needs zones/red zones for
    // its map and evacuation panel even on a cold deep-link.
    useLiveReports();
    const reports = useReportStore((s) => s.reports);
    const loading = useReportStore((s) => s.loading);
    const loadError = useReportStore((s) => s.error);
    const refresh = useReportStore((s) => s.refresh);
    const filters = useReportStore((s) => s.filters);
    const profile = useAuthStore((s) => s.profile);
    const [mineOnly, setMineOnly] = useState(false);
    const [lookup, setLookup] = useState('');
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState('');
    const mine = useMemo(() => new Set(myIds()), []);
    const visible = useMemo(() => {
        let rows = applyFilters(reports, filters);
        if (mineOnly) {
            rows = rows.filter((r) => mine.has(r.id) || (profile && r.reporter_id === profile.id));
        }
        return rows;
    }, [reports, filters, mineOnly, mine, profile]);
    if (id)
        return _jsx(TrackDetail, { id: id });
    const handleLookup = async () => {
        const q = lookup.trim();
        if (!q) {
            setLookupError('Enter a report ID to search.');
            return;
        }
        const direct = reports.find((r) => r.id === q || r.id.startsWith(q));
        if (direct) {
            setLookupError('');
            setLookupResult(direct);
            return;
        }
        setLookupBusy(true);
        setLookupError('');
        try {
            const r = await getReport(q);
            if (!r)
                setLookupError('No report found with that ID.');
            setLookupResult(r);
        }
        catch {
            setLookupError('Lookup failed. Please try again.');
        }
        finally {
            setLookupBusy(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-extrabold text-slate-900", children: "Track incidents" }), _jsx("p", { className: "mt-1 text-sm text-slate-500", children: "Follow response progress by report ID, or browse everything below." })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5", children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row", children: [_jsx(Input, { placeholder: "Paste a report ID (e.g. seed-01\u2026)", value: lookup, onChange: (e) => { setLookup(e.target.value); setLookupError(''); }, onKeyDown: (e) => {
                                        if (e.key === 'Enter')
                                            void handleLookup();
                                    } }), _jsx(Button, { onClick: () => void handleLookup(), disabled: lookupBusy, className: "sm:w-40", children: lookupBusy ? 'Searching…' : 'Find report' })] }), lookupError ? (_jsx("p", { role: "alert", className: "mt-2 text-sm font-semibold text-red-600", children: lookupError })) : null, lookupResult ? (_jsx(Link, { to: `/track/${lookupResult.id}`, className: "mt-3 block rounded-lg border border-slate-200 p-3 hover:bg-slate-50", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("p", { className: "text-sm font-bold text-slate-900", children: [DISASTER_TYPE_META[lookupResult.disaster_type].label, " \u2014 ", lookupResult.address] }), _jsx(StatusBadge, { value: lookupResult.status })] }) })) : null] }) }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx(ReportFiltersBar, { compact: true }), _jsxs("label", { className: "inline-flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-2.5 px-2 py-3 text-sm font-semibold text-slate-600", children: [_jsx("input", { type: "checkbox", checked: mineOnly, onChange: (e) => setMineOnly(e.target.checked), className: "h-6 w-6 shrink-0 accent-red-600" }), "Only my reports"] })] }), loading && reports.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex justify-center py-16", children: _jsx(Spinner, {}) }) })) : loadError && reports.length === 0 ? (_jsxs("div", { role: "alert", className: "rounded-xl border border-red-200 bg-red-50 p-4 text-center", children: [_jsx("p", { className: "text-sm font-bold text-red-800", children: "Couldn\u2019t load reports \u2014 you may be offline." }), _jsx(Button, { size: "sm", className: "mt-3", onClick: () => void refresh(), children: "Retry" })] })) : visible.length === 0 ? (_jsx(EmptyState, { title: "No reports match", hint: "Try clearing the filters or the 'Only my reports' toggle." })) : (_jsx("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: visible.map((r) => (_jsx(Link, { to: `/track/${r.id}`, className: "group", children: _jsx(Card, { className: "transition-shadow group-hover:shadow-md", children: _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-sm font-bold text-slate-900", children: [DISASTER_TYPE_META[r.disaster_type].label, _jsx("span", { className: "ml-2 font-mono text-xs font-semibold text-slate-400", children: r.id.slice(0, 8) })] }), _jsx("p", { className: "mt-0.5 line-clamp-1 text-sm text-slate-500", children: r.address })] }), _jsx(SeverityBadge, { value: r.severity })] }), _jsxs("div", { className: "mt-3 flex items-center justify-between", children: [_jsx(StatusBadge, { value: r.status }), _jsx("span", { className: "text-xs text-slate-400", children: formatDateTime(r.created_at) })] })] }) }) }, r.id))) }))] }));
}
