import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateReport } from '../../lib/api';
import { DISASTER_TYPE_META, SEVERITY_META, STATUS_META, cn, formatDateTime } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import EvacuationPanel from '../evacuation/EvacuationPanel';
import IncidentMap from '../map/IncidentMap';
import { Badge, Button, Label, Modal, Select } from '../ui';
export function SeverityBadge({ value }) {
    return _jsx(Badge, { className: cn('ring-1', SEVERITY_META[value].badge), children: SEVERITY_META[value].label });
}
export function StatusBadge({ value }) {
    return _jsx(Badge, { className: cn('ring-1', STATUS_META[value].badge), children: STATUS_META[value].label });
}
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['pending', 'investigating', 'contained', 'resolved', 'false_alarm'];
export function ReportDetailModal({ report, onClose, }) {
    const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
    const refresh = useReportStore((s) => s.refresh);
    const [severity, setSeverity] = useState(report?.severity ?? 'low');
    const [status, setStatus] = useState(report?.status ?? 'pending');
    const [saving, setSaving] = useState(false);
    const [evacOpen, setEvacOpen] = useState(false);
    const [route, setRoute] = useState(null);
    useEffect(() => {
        setSeverity(report?.severity ?? 'low');
        setStatus(report?.status ?? 'pending');
        setEvacOpen(false);
        setRoute(null);
    }, [report?.id, report?.severity, report?.status]);
    if (!report)
        return null;
    const dirty = severity !== report.severity || status !== report.status;
    const handleSave = async () => {
        setSaving(true);
        try {
            await updateReport(report.id, { severity, status });
            toast.success('Report updated.');
            await refresh();
            onClose();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Update failed.');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(Modal, { open: true, onClose: onClose, title: `${DISASTER_TYPE_META[report.disaster_type].label} — ${report.id.slice(0, 8)}`, wide: true, children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(SeverityBadge, { value: report.severity }), _jsx(StatusBadge, { value: report.status })] }), _jsxs("dl", { className: "mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "font-semibold text-slate-500", children: "Location" }), _jsx("dd", { className: "mt-0.5 font-medium text-slate-900", children: report.address }), _jsxs("dd", { className: "text-sm text-slate-400", children: [report.latitude.toFixed(5), ", ", report.longitude.toFixed(5)] })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-semibold text-slate-500", children: "Reported by" }), _jsx("dd", { className: "mt-0.5 font-medium text-slate-900", children: report.reporter_name }), _jsx("dd", { className: "text-sm text-slate-400", children: formatDateTime(report.created_at) })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("dt", { className: "font-semibold text-slate-500", children: "Description" }), _jsx("dd", { className: "mt-0.5 text-slate-800", children: report.description || '—' })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-semibold text-slate-500", children: "Casualties / injuries" }), _jsx("dd", { className: "mt-0.5 font-medium text-slate-900", children: report.has_injuries ? `Yes (${report.injury_count})` : 'None reported' })] }), _jsxs("div", { children: [_jsx("dt", { className: "font-semibold text-slate-500", children: "Last updated" }), _jsx("dd", { className: "mt-0.5 text-slate-800", children: formatDateTime(report.updated_at) })] })] }), report.images.length > 0 ? (_jsx("div", { className: "mt-4 grid grid-cols-3 gap-2", children: report.images.map((src) => (_jsx("img", { src: src, alt: "Incident evidence", className: "h-24 w-full rounded-lg border border-slate-200 object-cover" }, src))) })) : null, _jsxs("div", { className: "mt-4", children: [_jsx(Button, { variant: "secondary", size: "md", onClick: () => setEvacOpen((v) => !v), "aria-expanded": evacOpen, children: evacOpen ? 'Hide evacuation routes' : 'Show evacuation routes →' }), evacOpen ? (_jsxs("div", { className: "mt-3 space-y-3", children: [_jsx(IncidentMap, { reports: [report], showDangerZones: true, selectedRoute: route, height: "240px" }), _jsx(EvacuationPanel, { origin: { lat: report.latitude, lng: report.longitude, label: report.address }, onRouteSelect: setRoute })] })) : null] }), isAdmin ? (_jsxs("div", { className: "mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4", children: [_jsx("p", { className: "text-sm font-bold text-slate-900", children: "Authority triage" }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "triage-sev", children: "Severity" }), _jsx(Select, { id: "triage-sev", value: severity, onChange: (e) => setSeverity(e.target.value), children: SEVERITIES.map((s) => (_jsx("option", { value: s, children: SEVERITY_META[s].label }, s))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "triage-status", children: "Status" }), _jsx(Select, { id: "triage-status", value: status, onChange: (e) => setStatus(e.target.value), children: STATUSES.map((s) => (_jsx("option", { value: s, children: STATUS_META[s].label }, s))) })] })] }), _jsx(Button, { className: "mt-3", size: "md", disabled: !dirty || saving, onClick: () => void handleSave(), children: saving ? 'Saving…' : 'Save triage' })] })) : null] }));
}
