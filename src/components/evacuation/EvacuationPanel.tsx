import { useEffect, useMemo, useState } from 'react';
import { Footprints, Car, Navigation } from 'lucide-react';
import { getEvacuationRoutes } from '../../lib/routing';
import {
  AMENITY_LABELS,
  SAFE_ZONE_TYPE_META,
  cn,
  formatDistance,
  formatDuration,
  googleNavUrl,
} from '../../lib/utils';
import type { EvacuationRoute, SafeZone, TravelProfile } from '../../lib/types';
import { useReportStore } from '../../stores/reportStore';
import { Spinner } from '../ui';

export interface EvacOrigin {
  lat: number;
  lng: number;
  label: string;
}

interface EvacuationPanelProps {
  origin: EvacOrigin;
  zones?: SafeZone[];
  onRouteSelect?: (route: EvacuationRoute | null) => void;
  autoSelectFirst?: boolean;
}

export default function EvacuationPanel({
  origin,
  zones,
  onRouteSelect,
  autoSelectFirst = true,
}: EvacuationPanelProps) {
  const storeZones = useReportStore((s) => s.zones);
  const list = zones ?? storeZones;
  const [profile, setProfile] = useState<TravelProfile>('driving');
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeZones = useMemo(() => list.filter((z) => z.is_active), [list]);

  useEffect(() => {
    let cancelled = false;
    if (activeZones.length === 0) {
      setRoutes([]);
      setSelectedId(null);
      onRouteSelect?.(null);
      return;
    }
    setLoading(true);
    setSlow(false);
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, 8000);
    getEvacuationRoutes(origin.lat, origin.lng, activeZones, profile, 3)
      .then((r) => {
        if (cancelled) return;
        setRoutes(r);
        const first = autoSelectFirst ? (r[0] ?? null) : null;
        setSelectedId(first?.safe_zone_id ?? null);
        onRouteSelect?.(first);
      })
      .catch(() => {
        if (!cancelled) setRoutes([]);
      })
      .finally(() => {
        window.clearTimeout(slowTimer);
        if (!cancelled) {
          setLoading(false);
          setSlow(false);
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lng, profile, activeZones]);

  const selected = routes.find((r) => r.safe_zone_id === selectedId) ?? null;
  const selectedZone = selected
    ? (activeZones.find((z) => z.id === selected.safe_zone_id) ?? null)
    : null;

  const pick = (r: EvacuationRoute) => {
    setSelectedId(r.safe_zone_id);
    onRouteSelect?.(r);
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-extrabold text-slate-900">Evacuate to safety</p>
          <p className="text-sm text-slate-500">
            From <strong>{origin.label}</strong> — nearest safe zones by road, live.
          </p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white" role="group" aria-label="Travel mode">
          <button
            type="button"
            onClick={() => setProfile('driving')}
            aria-pressed={profile === 'driving'}
            className={cn(
              'flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-1.5 px-4 py-3 text-sm font-bold',
              profile === 'driving' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            <Car className="h-4 w-4" /> Drive
          </button>
          <button
            type="button"
            onClick={() => setProfile('walking')}
            aria-pressed={profile === 'walking'}
            className={cn(
              'flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-1.5 px-4 py-3 text-sm font-bold',
              profile === 'walking' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            <Footprints className="h-4 w-4" /> Walk
          </button>
        </div>
      </div>

      {activeZones.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-500">
          No active safe zones are registered yet. An authority admin can add shelters,
          hospitals and grounds under Admin → Safe Zones.
        </p>
      ) : loading && routes.length === 0 ? (
        <div className="mt-3 rounded-lg bg-white p-4 text-sm font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Spinner /> Computing road routes via OSRM…
          </div>
          {slow ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
              Taking longer than expected — road data may be slow here. Try Walk mode for a direct route,
              or use the 3D navigation button once a route appears.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {routes.map((r, i) => {
            const z = activeZones.find((x) => x.id === r.safe_zone_id);
            const isSel = r.safe_zone_id === selectedId;
            const occPct = z?.capacity ? Math.min(100, Math.round((z.current_occupancy / z.capacity) * 100)) : null;
            return (
              <button
                key={r.safe_zone_id}
                type="button"
                onClick={() => pick(r)}
                aria-expanded={isSel}
                className={cn(
                  'block w-full cursor-pointer touch-manipulation rounded-xl border-2 bg-white p-3 text-left transition-colors',
                  isSel ? 'border-emerald-600 shadow-sm' : 'border-slate-200 hover:border-emerald-300',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-extrabold text-white">
                        {i + 1}
                      </span>
                      {r.safe_zone_name}
                    </p>
                    <p className="mt-0.5 pl-8 text-xs font-semibold text-slate-500">
                      {z ? SAFE_ZONE_TYPE_META[z.type].label : ''}
                      {z?.amenities?.length
                        ? ` · ${z.amenities.map((a) => AMENITY_LABELS[a] ?? a).slice(0, 3).join(', ')}`
                        : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-emerald-700">{formatDuration(r.duration_seconds)}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatDistance(r.distance_meters)}</p>
                    {r.is_estimate ? (
                      <p className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800">est.</p>
                    ) : null}
                  </div>
                </div>
                {isSel && occPct !== null && z ? (
                  <div className="mt-2 pl-8">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Occupancy</span>
                      <span className="tabular-nums">{z.current_occupancy}/{z.capacity} ({occPct}%)</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', occPct >= 90 ? 'bg-red-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                        style={{ width: `${occPct}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {selected && selectedZone ? (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-sm font-extrabold text-slate-900">
            Turn-by-turn → {selected.safe_zone_name}
          </p>
          <a
            href={googleNavUrl(
              selectedZone.latitude,
              selectedZone.longitude,
              { lat: origin.lat, lng: origin.lng },
              profile,
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex min-h-[56px] touch-manipulation items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-extrabold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98]"
          >
            <Navigation className="h-5 w-5" /> Start 3D navigation →
          </a>
          {selected.is_estimate ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
              Live road routing is unavailable — showing an estimated path. Follow police / local volunteer guidance on the ground.
            </p>
          ) : null}
          <ol className="rg-scroll mt-2 max-h-64 space-y-2 overflow-y-auto">
            {selected.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                  {i + 1}
                </span>
                <span>
                  <span className="font-semibold text-slate-800">{s.instruction}</span>{' '}
                  <span className="font-semibold whitespace-nowrap text-slate-400">
                    ({formatDistance(s.distance_meters)}
                    {s.duration_seconds >= 60 ? ` · ${formatDuration(s.duration_seconds)}` : ''})
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
