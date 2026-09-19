import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap';
import EvacuationPanel from '../components/evacuation/EvacuationPanel';
import { useLiveReports } from '../lib/hooks';
import { DISASTER_TYPE_META, SEVERITY_META, cn } from '../lib/utils';
import type { EvacuationRoute } from '../lib/types';
import { useReportStore } from '../stores/reportStore';
import { Button, EmptyState } from '../components/ui';

export default function Evacuate() {
  const { id } = useParams<{ id: string }>();
  useLiveReports();
  const reports = useReportStore((s) => s.reports);
  const zones = useReportStore((s) => s.zones);
  const loading = useReportStore((s) => s.loading);

  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null);

  const report = reports.find((r) => r.id === id) ?? null;

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-3" aria-label="Loading evacuation">
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-3">
        <Link
          to="/"
          className="inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to map
        </Link>
        <EmptyState
          title="Report not found"
          hint="This incident may have been removed or the link is incorrect."
        />
      </div>
    );
  }

  const typeLabel = DISASTER_TYPE_META[report.disaster_type].label;

  return (
    <div className="space-y-3">
      {/* Sticky action header — stays visible while scrolling to routes */}
      <div className="sticky top-14 z-[900] -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-100/95 px-4 py-2 backdrop-blur sm:top-16">
        <Link
          to="/"
          className="inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to map
        </Link>
        <Link to="/report">
          <Button size="md">Report an incident →</Button>
        </Link>
      </div>

      {/* Incident summary — one glance context */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        {report.severity === 'critical' || report.severity === 'high' ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
        ) : (
          <MapPin className="h-5 w-5 shrink-0 text-slate-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">
            Evacuate — {typeLabel}
          </p>
          <p className="truncate text-sm text-slate-500">{report.address}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
            SEVERITY_META[report.severity].badge,
          )}
        >
          {SEVERITY_META[report.severity].label}
        </span>
      </div>

      {/* Map with live route — dvh height leaves the navigate button visible */}
      <IncidentMap
        reports={[report]}
        zones={zones}
        showDangerZones
        selectedRoute={selectedRoute}
        className="rg-map-evac"
        centerOnUser
      />

      {/* Evacuation panel — scrollable, auto-selects best route */}
      <EvacuationPanel
        origin={{ lat: report.latitude, lng: report.longitude, label: report.address }}
        onRouteSelect={setSelectedRoute}
      />
    </div>
  );
}
