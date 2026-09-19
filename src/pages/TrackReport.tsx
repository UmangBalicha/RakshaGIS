import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import IncidentMap from '../components/map/IncidentMap';
import EvacuationPanel from '../components/evacuation/EvacuationPanel';
import { SeverityBadge, StatusBadge } from '../components/reports/ReportDetail';
import ReportFiltersBar from '../components/reports/ReportFilters';
import { getReport } from '../lib/api';
import { DISASTER_TYPE_META, STATUS_META, cn, formatDateTime } from '../lib/utils';
import type { DisasterReport, EvacuationRoute, ReportStatus } from '../lib/types';
import { useAuthStore } from '../stores/authStore';
import { applyFilters, useReportStore } from '../stores/reportStore';
import { useLiveReports } from '../lib/hooks';
import { Button, Card, CardContent, EmptyState, Input, Spinner } from '../components/ui';

const MINE_KEY = 'rakshagis_mine_v1';

function myIds(): string[] {
  try {
    const raw = localStorage.getItem(MINE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

const TIMELINE: ReportStatus[] = ['pending', 'investigating', 'contained', 'resolved'];

function StatusTimeline({ status }: { status: ReportStatus }) {
  if (status === 'false_alarm') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        This report was reviewed and marked as a <strong>false alarm</strong>. No further action needed.
      </div>
    );
  }
  const idx = TIMELINE.indexOf(status);
  return (
    <ol className="space-y-0">
      {TIMELINE.map((s, i) => (
        <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
          {i < TIMELINE.length - 1 ? (
            <span
              className={cn(
                'absolute top-6 left-[11px] h-full w-0.5',
                i < idx ? 'bg-emerald-500' : 'bg-slate-200',
              )}
            />
          ) : null}
          <span
            className={cn(
              'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
              i < idx && 'bg-emerald-500 text-white',
              i === idx && 'bg-brand-600 text-white',
              i > idx && 'bg-slate-200 text-slate-500',
            )}
          >
            {i < idx ? '✓' : i + 1}
          </span>
          <div className="pt-0.5">
            <p className={cn('text-sm font-bold', i <= idx ? 'text-slate-900' : 'text-slate-400')}>
              {STATUS_META[s].label}
              {i === idx ? ' — current stage' : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TrackDetail({ id }: { id: string }) {
  const [searchParams] = useSearchParams();
  const zones = useReportStore((s) => s.zones);
  const [report, setReport] = useState<DisasterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [evacOpen, setEvacOpen] = useState(searchParams.get('evacuate') === '1');
  const [route, setRoute] = useState<EvacuationRoute | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReport(id)
      .then((r) => {
        if (cancelled) return;
        if (!r) setNotFound(true);
        else setReport(r);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Card><CardContent className="flex justify-center py-16"><Spinner /></CardContent></Card>
    );
  }
  if (notFound || !report) {
    return (
      <EmptyState
        title="Report not found"
        hint="Check the report ID — it is shown on the confirmation screen right after you submit."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/track" className="inline-flex min-h-[44px] touch-manipulation items-center py-2 text-sm font-bold text-brand-600 hover:underline">← All reports</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {DISASTER_TYPE_META[report.disaster_type].label}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Report ID <span className="font-mono font-bold text-slate-700">{report.id.slice(0, 8)}</span>
            {' · '}filed {formatDateTime(report.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <SeverityBadge value={report.severity} />
          <StatusBadge value={report.status} />
        </div>
      </div>

      <IncidentMap reports={[report]} zones={zones} showDangerZones selectedRoute={route} height="320px" />

      <div>
        <Button variant="secondary" size="md" onClick={() => setEvacOpen((v) => !v)} aria-expanded={evacOpen}>
          {evacOpen ? 'Hide evacuation routes' : 'Show evacuation routes →'}
        </Button>
        {evacOpen ? (
          <div className="mt-3">
            <EvacuationPanel
              origin={{ lat: report.latitude, lng: report.longitude, label: report.address }}
              onRouteSelect={setRoute}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-extrabold text-slate-900">Response progress</h2>
            <div className="mt-4"><StatusTimeline status={report.status} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-5 text-sm">
            <div>
              <p className="font-semibold text-slate-500">Location</p>
              <p className="font-medium text-slate-900">{report.address}</p>
              <p className="text-sm text-slate-400">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Description</p>
              <p className="text-slate-800">{report.description || '—'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Casualties / injuries</p>
              <p className="text-slate-800">{report.has_injuries ? `Yes (${report.injury_count})` : 'None reported'}</p>
            </div>
            {report.images.length > 0 ? (
              <div>
                <p className="font-semibold text-slate-500">Photos</p>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {report.images.map((src) => (
                    <img key={src} src={src} alt="Report evidence" className="h-20 w-full rounded-lg border border-slate-200 object-cover" />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TrackReport() {
  const { id } = useParams();
  useLiveReports(!id);
  const reports = useReportStore((s) => s.reports);
  const loading = useReportStore((s) => s.loading);
  const filters = useReportStore((s) => s.filters);
  const profile = useAuthStore((s) => s.profile);
  const [mineOnly, setMineOnly] = useState(false);
  const [lookup, setLookup] = useState('');
  const [lookupResult, setLookupResult] = useState<DisasterReport | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const mine = useMemo(() => new Set(myIds()), []);
  const visible = useMemo(() => {
    let rows = applyFilters(reports, filters);
    if (mineOnly) {
      rows = rows.filter((r) => mine.has(r.id) || (profile && r.reporter_id === profile.id));
    }
    return rows;
  }, [reports, filters, mineOnly, mine, profile]);

  if (id) return <TrackDetail id={id} />;

  const handleLookup = async () => {
    const q = lookup.trim();
    if (!q) return;
    const direct = reports.find((r) => r.id === q || r.id.startsWith(q));
    if (direct) {
      setLookupResult(direct);
      return;
    }
    setLookupBusy(true);
    try {
      const r = await getReport(q);
      if (!r) toast.error('No report found with that ID.');
      setLookupResult(r);
    } catch {
      toast.error('Lookup failed. Please try again.');
    } finally {
      setLookupBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Track incidents</h1>
        <p className="mt-1 text-sm text-slate-500">Follow response progress by report ID, or browse everything below.</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Paste a report ID (e.g. seed-01…)"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleLookup();
              }}
            />
            <Button onClick={() => void handleLookup()} disabled={lookupBusy} className="sm:w-40">
              {lookupBusy ? 'Searching…' : 'Find report'}
            </Button>
          </div>
          {lookupResult ? (
            <Link to={`/track/${lookupResult.id}`} className="mt-3 block rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">{DISASTER_TYPE_META[lookupResult.disaster_type].label} — {lookupResult.address}</p>
                <StatusBadge value={lookupResult.status} />
              </div>
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReportFiltersBar compact />
        <label className="inline-flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-2.5 px-2 py-3 text-sm font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="h-6 w-6 shrink-0 accent-red-600"
          />
          Only my reports
        </label>
      </div>

      {loading && reports.length === 0 ? (
        <Card><CardContent className="flex justify-center py-16"><Spinner /></CardContent></Card>
      ) : visible.length === 0 ? (
        <EmptyState title="No reports match" hint="Try clearing the filters or the 'Only my reports' toggle." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((r) => (
            <Link key={r.id} to={`/track/${r.id}`} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {DISASTER_TYPE_META[r.disaster_type].label}
                        <span className="ml-2 font-mono text-xs font-semibold text-slate-400">{r.id.slice(0, 8)}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{r.address}</p>
                    </div>
                    <SeverityBadge value={r.severity} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge value={r.status} />
                    <span className="text-xs text-slate-400">{formatDateTime(r.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
