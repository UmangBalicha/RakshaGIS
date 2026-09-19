import { Link, useNavigate } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap';
import { useLiveReports } from '../lib/hooks';
import type { DisasterReport } from '../lib/types';
import { useReportStore } from '../stores/reportStore';
import { Button, EmptyState } from '../components/ui';

const EMERGENCY_NUMBERS = [
  { num: '112', label: 'National' },
  { num: '101', label: 'Fire' },
  { num: '108', label: 'Ambulance' },
  { num: '1077', label: 'Disaster' },
];

export default function Home() {
  useLiveReports();
  const navigate = useNavigate();
  const reports = useReportStore((s) => s.reports);
  const zones = useReportStore((s) => s.zones);
  const loading = useReportStore((s) => s.loading);

  const active = reports.filter((r) => r.status === 'pending' || r.status === 'investigating');

  const openEvac = (r: DisasterReport) => {
    navigate(`/evacuate/${r.id}`);
  };

  return (
    <div className="space-y-3">
      {/* Emergency numbers — 2×2 large tappable cards + single primary action */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-red-700 uppercase">
          <PhoneCall className="h-4 w-4" /> Emergency — tap to call
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EMERGENCY_NUMBERS.map((e) => (
            <a
              key={e.num}
              href={`tel:${e.num}`}
              title={`${e.label} helpline`}
              className="flex min-h-[56px] touch-manipulation flex-col items-center justify-center rounded-xl bg-red-50 py-2 ring-1 ring-red-200 ring-inset hover:bg-red-100 active:scale-[0.98]"
            >
              <span className="text-lg font-extrabold text-red-700 tabular-nums">{e.num}</span>
              <span className="text-xs font-bold text-red-400">{e.label}</span>
            </a>
          ))}
        </div>
        <Link to="/report" className="mt-2 block sm:mt-3">
          <Button size="lg" className="w-full">
            Report an incident →
          </Button>
        </Link>
      </div>

      {/* Live map, centered on the visitor */}
      {loading && reports.length === 0 ? (
        <div className="space-y-3" aria-label="Loading incidents">
          <div className="h-14 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
        </div>
      ) : active.length === 0 ? (
        <EmptyState title="No active incidents" hint="All reported incidents are currently resolved. The map will update live when new reports arrive." />
      ) : (
        <>
          <IncidentMap
            reports={active}
            zones={zones}
            showDangerZones
            className="rg-map-home"
            centerOnUser
            onEvacuate={openEvac}
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-600" /> Critical</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" /> High</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Medium</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Low</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-emerald-600 bg-white" /> Safe zone</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-600" /> You</span>
          </div>
          <p className="text-sm text-slate-500">
            Tap a <strong>colored marker</strong> for details — or hit <strong>Evacuate safely</strong> for live road routing to the nearest shelter.
          </p>
        </>
      )}
    </div>
  );
}
