import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReportDetailModal, SeverityBadge, StatusBadge } from '../../components/reports/ReportDetail';
import ReportFiltersBar from '../../components/reports/ReportFilters';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPE_META, formatDateTime } from '../../lib/utils';
import { applyFilters, useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, EmptyState, Spinner } from '../../components/ui';
function toCsv(rows) {
    const header = 'id,created_at,disaster_type,severity,status,latitude,longitude,address,reporter,injuries,description';
    const esc = (v) => {
        const s = String(v);
        // Formula injection: a cell starting with = + - @ executes as a
        // formula when the export is opened in Excel/Sheets. A leading
        // apostrophe neutralizes it (rendered without the quote).
        const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
        return `"${safe.replace(/"/g, '""')}"`;
    };
    const lines = rows.map((r) => [
        r.id, r.created_at, r.disaster_type, r.severity, r.status,
        r.latitude, r.longitude, esc(r.address), esc(r.reporter_name),
        r.has_injuries ? r.injury_count : 0, esc(r.description),
    ].join(','));
    return [header, ...lines].join('\n');
}
export default function AdminReports() {
    useLiveReports();
    const reports = useReportStore((s) => s.reports);
    const loading = useReportStore((s) => s.loading);
    const loadError = useReportStore((s) => s.error);
    const refresh = useReportStore((s) => s.refresh);
    const filters = useReportStore((s) => s.filters);
    const [selected, setSelected] = useState(null);
    const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
    const exportCsv = () => {
        if (filtered.length === 0) {
            toast.error('Nothing to export.');
            return;
        }
        const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rakshagis-reports-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filtered.length} reports to CSV.`);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-extrabold text-slate-900", children: ["Incident reports (", filtered.length, ")"] }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: "Triage severity and response status for every incident." })] }), _jsx(Button, { variant: "secondary", onClick: exportCsv, children: "Export CSV" })] }), _jsx(ReportFiltersBar, {}), _jsx(Card, { children: _jsx(CardContent, { className: "rg-scroll overflow-x-auto p-0", children: loading && reports.length === 0 ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Spinner, {}) })) : loadError && reports.length === 0 ? (_jsxs("div", { role: "alert", className: "m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-center", children: [_jsx("p", { className: "text-sm font-bold text-red-800", children: "Couldn\u2019t load reports \u2014 check your connection." }), _jsx(Button, { size: "sm", className: "mt-3", onClick: () => void refresh(), children: "Retry" })] })) : filtered.length === 0 ? (_jsx("div", { className: "p-5", children: _jsx(EmptyState, { title: "No matching reports", hint: "Adjust the filters above." }) })) : (_jsxs("table", { className: "w-full min-w-220 text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase", children: [_jsx("th", { className: "px-4 py-3", children: "ID" }), _jsx("th", { className: "px-4 py-3", children: "Filed" }), _jsx("th", { className: "px-4 py-3", children: "Type" }), _jsx("th", { className: "px-4 py-3", children: "Severity" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Location" }), _jsx("th", { className: "px-4 py-3", children: "Reporter" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Action" })] }) }), _jsx("tbody", { children: filtered.map((r) => (_jsxs("tr", { className: "border-b border-slate-50 last:border-0 hover:bg-slate-50/70", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs font-bold text-slate-700", children: r.id.slice(0, 8) }), _jsx("td", { className: "px-4 py-3 text-xs whitespace-nowrap text-slate-500", children: formatDateTime(r.created_at) }), _jsx("td", { className: "px-4 py-3 text-xs font-semibold text-slate-700", children: DISASTER_TYPE_META[r.disaster_type].label }), _jsx("td", { className: "px-4 py-3", children: _jsx(SeverityBadge, { value: r.severity }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusBadge, { value: r.status }) }), _jsx("td", { className: "max-w-64 truncate px-4 py-3 text-xs text-slate-600", children: r.address }), _jsx("td", { className: "max-w-32 truncate px-4 py-3 text-xs text-slate-600", children: r.reporter_name }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx("button", { type: "button", onClick: () => setSelected(r), className: "cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 hover:underline", children: "Open \u2192" }) })] }, r.id))) })] })) }) }), _jsx(ReportDetailModal, { report: selected ? (reports.find((r) => r.id === selected.id) ?? selected) : null, onClose: () => setSelected(null) })] }));
}
