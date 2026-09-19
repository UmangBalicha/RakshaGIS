import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ReportDetailModal, SeverityBadge, StatusBadge } from '../../components/reports/ReportDetail';
import ReportFiltersBar from '../../components/reports/ReportFilters';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPE_META, formatDateTime } from '../../lib/utils';
import type { DisasterReport } from '../../lib/types';
import { applyFilters, useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, EmptyState, Spinner } from '../../components/ui';

function toCsv(rows: DisasterReport[]): string {
  const header = 'id,created_at,disaster_type,severity,status,latitude,longitude,address,reporter,injuries,description';
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.id, r.created_at, r.disaster_type, r.severity, r.status,
      r.latitude, r.longitude, esc(r.address), esc(r.reporter_name),
      r.has_injuries ? r.injury_count : 0, esc(r.description),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

export default function AdminReports() {
  useLiveReports();
  const reports = useReportStore((s) => s.reports);
  const loading = useReportStore((s) => s.loading);
  const filters = useReportStore((s) => s.filters);
  const [selected, setSelected] = useState<DisasterReport | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Incident reports ({filtered.length})</h1>
          <p className="mt-0.5 text-sm text-slate-500">Triage severity and response status for every incident.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
      </div>

      <ReportFiltersBar />

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading && reports.length === 0 ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="p-5"><EmptyState title="No matching reports" hint="Adjust the filters above." /></div>
          ) : (
            <table className="w-full min-w-220 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Filed</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{DISASTER_TYPE_META[r.disaster_type].label}</td>
                    <td className="px-4 py-3"><SeverityBadge value={r.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge value={r.status} /></td>
                    <td className="max-w-64 truncate px-4 py-3 text-xs text-slate-600">{r.address}</td>
                    <td className="max-w-32 truncate px-4 py-3 text-xs text-slate-600">{r.reporter_name}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 hover:underline"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <ReportDetailModal
        report={selected ? (reports.find((r) => r.id === selected.id) ?? selected) : null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
