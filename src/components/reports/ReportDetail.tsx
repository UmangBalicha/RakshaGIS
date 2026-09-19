import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { updateReport } from '../../lib/api';
import { DISASTER_TYPE_META, SEVERITY_META, STATUS_META, cn, formatDateTime } from '../../lib/utils';
import type { DisasterReport, EvacuationRoute, ReportStatus, Severity } from '../../lib/types';
import { useAuthStore } from '../../stores/authStore';
import { useReportStore } from '../../stores/reportStore';
import EvacuationPanel from '../evacuation/EvacuationPanel';
import IncidentMap from '../map/IncidentMap';
import { Badge, Button, Label, Modal, Select } from '../ui';

export function SeverityBadge({ value }: { value: Severity }) {
  return <Badge className={cn('ring-1', SEVERITY_META[value].badge)}>{SEVERITY_META[value].label}</Badge>;
}

export function StatusBadge({ value }: { value: ReportStatus }) {
  return <Badge className={cn('ring-1', STATUS_META[value].badge)}>{STATUS_META[value].label}</Badge>;
}

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: ReportStatus[] = ['pending', 'investigating', 'contained', 'resolved', 'false_alarm'];

export function ReportDetailModal({
  report,
  onClose,
}: {
  report: DisasterReport | null;
  onClose: () => void;
}) {
  const isAdmin = useAuthStore((s) => s.profile?.role === 'admin');
  const refresh = useReportStore((s) => s.refresh);
  const [severity, setSeverity] = useState<Severity>(report?.severity ?? 'low');
  const [status, setStatus] = useState<ReportStatus>(report?.status ?? 'pending');
  const [saving, setSaving] = useState(false);
  const [evacOpen, setEvacOpen] = useState(false);
  const [route, setRoute] = useState<EvacuationRoute | null>(null);

  useEffect(() => {
    setSeverity(report?.severity ?? 'low');
    setStatus(report?.status ?? 'pending');
    setEvacOpen(false);
    setRoute(null);
  }, [report?.id, report?.severity, report?.status]);

  if (!report) return null;

  const dirty = severity !== report.severity || status !== report.status;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReport(report.id, { severity, status });
      toast.success('Report updated.');
      await refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${DISASTER_TYPE_META[report.disaster_type].label} — ${report.id.slice(0, 8)}`} wide>
      <div className="flex flex-wrap gap-2">
        <SeverityBadge value={report.severity} />
        <StatusBadge value={report.status} />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-500">Location</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{report.address}</dd>
          <dd className="text-sm text-slate-400">
            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Reported by</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{report.reporter_name}</dd>
          <dd className="text-sm text-slate-400">{formatDateTime(report.created_at)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold text-slate-500">Description</dt>
          <dd className="mt-0.5 text-slate-800">{report.description || '—'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Casualties / injuries</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {report.has_injuries ? `Yes (${report.injury_count})` : 'None reported'}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-500">Last updated</dt>
          <dd className="mt-0.5 text-slate-800">{formatDateTime(report.updated_at)}</dd>
        </div>
      </dl>

      {report.images.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {report.images.map((src) => (
            <img key={src} src={src} alt="Incident evidence" className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <Button variant="secondary" size="md" onClick={() => setEvacOpen((v) => !v)} aria-expanded={evacOpen}>
          {evacOpen ? 'Hide evacuation routes' : 'Show evacuation routes →'}
        </Button>
        {evacOpen ? (
          <div className="mt-3 space-y-3">
            <IncidentMap
              reports={[report]}
              showDangerZones
              selectedRoute={route}
              height="240px"
            />
            <EvacuationPanel
              origin={{ lat: report.latitude, lng: report.longitude, label: report.address }}
              onRouteSelect={setRoute}
            />
          </div>
        ) : null}
      </div>

      {isAdmin ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">Authority triage</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="triage-sev">Severity</Label>
              <Select
                id="triage-sev"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_META[s].label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="triage-status">Status</Label>
              <Select
                id="triage-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button className="mt-3" size="md" disabled={!dirty || saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save triage'}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
