import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import IncidentMap, { type MapFocus } from '../../components/map/IncidentMap';
import { ReportDetailModal, SeverityBadge, StatusBadge } from '../../components/reports/ReportDetail';
import ReportFiltersBar from '../../components/reports/ReportFilters';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPE_META, SEVERITY_META, formatDateTime, timeAgo } from '../../lib/utils';
import type { DisasterReport } from '../../lib/types';
import { applyFilters, useReportStore } from '../../stores/reportStore';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner, Stat } from '../../components/ui';

export default function AdminDashboard() {
  useLiveReports();
  const reports = useReportStore((s) => s.reports);
  const alerts = useReportStore((s) => s.alerts);
  const zones = useReportStore((s) => s.zones);
  const loading = useReportStore((s) => s.loading);
  const filters = useReportStore((s) => s.filters);

  const [selected, setSelected] = useState<DisasterReport | null>(null);
  const [focus, setFocus] = useState<MapFocus | undefined>(undefined);

  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const active = useMemo(
    () => filtered.filter((r) => r.status === 'pending' || r.status === 'investigating'),
    [filtered],
  );

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
    const c = { critical: 0, high: 0, medium: 0, low: 0 } as Record<DisasterReport['severity'], number>;
    for (const r of active) c[r.severity] += 1;
    return c;
  }, [active]);

  const openReport = (r: DisasterReport, fly = false) => {
    if (fly) setFocus({ lat: r.latitude, lng: r.longitude, id: r.id, nonce: Date.now() });
    setSelected(r);
  };

  const openAlertReport = (reportId: string | null) => {
    if (!reportId) return;
    const r = reports.find((x) => x.id === reportId);
    if (r) openReport(r, true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Authority console</h1>
          <p className="mt-0.5 text-sm text-slate-500">Live all-hazard intelligence, triage and evacuation tracking.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/reports">
            <Button variant="secondary">Manage reports</Button>
          </Link>
          <Link to="/admin/safe-zones">
            <Button variant="secondary">Safe zones</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total reports" value={stats.total} accent="bg-slate-500" />
        <Stat label="Active incidents" value={stats.active} accent="bg-orange-500" />
        <Stat label="Critical active" value={stats.critical} accent="bg-red-600" />
        <Stat label="Reported today" value={stats.today} accent="bg-blue-500" />
        <Stat label="Safe zones live" value={zones.filter((z) => z.is_active).length} accent="bg-emerald-500" />
      </div>

      <ReportFiltersBar />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live incident map ({active.length} active)</CardTitle>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE
            </span>
          </CardHeader>
          <CardContent>
            {loading && reports.length === 0 ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : active.length === 0 ? (
              <EmptyState title="No active incidents" hint="New reports will appear here in real time." />
            ) : (
              <IncidentMap
                reports={active}
                zones={zones}
                showDangerZones
                height="480px"
                fitKey={`admin-${filtered.length}`}
                focus={focus}
                onViewDetails={(reportId) => {
                  const r = reports.find((x) => x.id === reportId);
                  if (r) setSelected(r);
                }}
                onEvacuate={(r) => setSelected(r)}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Severity mix (active)</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {(Object.keys(severityCounts) as Array<DisasterReport['severity']>).map((s) => {
                const total = Math.max(1, active.length);
                const pct = Math.round((severityCounts[s] / total) * 100);
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_META[s].dot}`} />
                        {SEVERITY_META[s].label}
                      </span>
                      <span className="text-slate-500 tabular-nums">{severityCounts[s]} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${SEVERITY_META[s].dot}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Latest alerts — tap to open</CardTitle></CardHeader>
            <CardContent className="rg-scroll max-h-72 space-y-2 overflow-y-auto">
              {alerts.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openAlertReport(a.report_id)}
                  title={a.report_id ? 'Open the incident report' : undefined}
                  className="block w-full cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_META[a.severity].dot}`} />
                    <p className="line-clamp-2 text-xs font-medium text-slate-700">{a.message}</p>
                  </div>
                  <p className="mt-1 pl-4 text-[11px] text-slate-400">
                    {timeAgo(a.created_at)}{a.report_id ? ' · open report →' : ''}
                  </p>
                </button>
              ))}
              {alerts.length === 0 ? <p className="text-xs text-slate-400">No alerts yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alert log ({filtered.length})</CardTitle>
          <Link to="/admin/reports" className="text-xs font-bold text-brand-600 hover:underline">
            Open full table →
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {filtered.length === 0 ? (
            <div className="p-5"><EmptyState title="No matching reports" hint="Adjust the filters above." /></div>
          ) : (
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-2.5">Report</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Filed</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-2.5"><SeverityBadge value={r.severity} /></td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-600">{DISASTER_TYPE_META[r.disaster_type].label}</td>
                    <td className="max-w-56 truncate px-4 py-2.5 text-xs text-slate-600">{r.address}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap text-slate-500">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-2.5"><StatusBadge value={r.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openReport(r, true)}
                        className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 hover:underline"
                      >
                        Locate →
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
