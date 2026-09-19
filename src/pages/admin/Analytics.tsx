import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLiveReports } from '../../lib/hooks';
import { DISASTER_TYPES } from '../../lib/types';
import { DISASTER_TYPE_META, SEVERITY_META } from '../../lib/utils';
import { useReportStore } from '../../stores/reportStore';
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Spinner } from '../../components/ui';

const SEV_FILL: Record<string, string> = {
  Critical: '#dc2626',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const TYPE_FILL = ['#dc2626', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#64748b', '#14b8a6', '#a855f7', '#78716c'];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function shortDay(iso: string): string {
  return iso.slice(5).replace('-', '/');
}

export default function AdminAnalytics() {
  useLiveReports();
  const reports = useReportStore((s) => s.reports);
  const loading = useReportStore((s) => s.loading);

  const perDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString();
      map.set(dayKey(d), 0);
    }
    for (const r of reports) {
      const k = dayKey(r.created_at);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].map(([day, count]) => ({ day: shortDay(day), reports: count }));
  }, [reports]);

  const bySeverity = useMemo(
    () =>
      (['critical', 'high', 'medium', 'low'] as const).map((s) => ({
        name: SEVERITY_META[s].label,
        value: reports.filter((r) => r.severity === s).length,
      })),
    [reports],
  );

  const byType = useMemo(
    () =>
      DISASTER_TYPES.map((t) => ({
        name: DISASTER_TYPE_META[t].label,
        value: reports.filter((r) => r.disaster_type === t).length,
      })).filter((x) => x.value > 0),
    [reports],
  );

  const statusShare = useMemo(() => {
    const total = Math.max(1, reports.length);
    const pct = (n: number) => Math.round((n / total) * 100);
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    const active = reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length;
    const falseAlarm = reports.filter((r) => r.status === 'false_alarm').length;
    return { resolved, active, falseAlarm, resolvedPct: pct(resolved), activePct: pct(active) };
  }, [reports]);

  if (loading && reports.length === 0) {
    return (
      <Card><CardContent className="flex justify-center py-16"><Spinner /></CardContent></Card>
    );
  }

  if (reports.length === 0) {
    return <EmptyState title="No data yet" hint="Analytics will appear once incidents are reported." />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
        <p className="mt-0.5 text-sm text-slate-500">Trends across {reports.length} incident reports.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Reports per day (last 14 days)</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perDay} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="reports" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Reports by severity</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySeverity} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {bySeverity.map((entry) => (
                      <Cell key={entry.name} fill={SEV_FILL[entry.name] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Reports by disaster type</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3} label={{ fontSize: 11 }}>
                    {byType.map((entry, i) => (
                      <Cell key={entry.name} fill={TYPE_FILL[i % TYPE_FILL.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
              {byType.map((t, i) => (
                <span key={t.name} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_FILL[i % TYPE_FILL.length] }} />
                  {t.name}: {t.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Response snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Resolved</span>
                <span className="tabular-nums">{statusShare.resolved} ({statusShare.resolvedPct}%)</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${statusShare.resolvedPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Active (pending + investigating)</span>
                <span className="tabular-nums">{statusShare.active} ({statusShare.activePct}%)</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-orange-500" style={{ width: `${statusShare.activePct}%` }} />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p><strong className="text-slate-900">{statusShare.falseAlarm}</strong> reports were marked as false alarms.</p>
              <p className="mt-1">Triage pending reports quickly to keep the active queue short and the public map trustworthy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
