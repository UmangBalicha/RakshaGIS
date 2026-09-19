import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  DISASTER_TYPE_META,
  SEVERITY_META,
  STATUS_META,
  cn,
  dangerRadiusMeters,
  googleNavUrl,
  timeAgo,
} from '../../lib/utils';
import { getMapTiles, loadMapmyIndiaSDK, mapmyIndiaKey } from '../../lib/maptiles';
import { useWideScreen } from '../../lib/hooks';
import type { DisasterReport, EvacuationRoute, SafeZone, Severity } from '../../lib/types';

const SEVERITY_COLOR: Record<Severity, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#dc2626',
};

const iconCache = new Map<string, L.DivIcon>();

function severityIcon(sev: Severity): L.DivIcon {
  const key = `sev-${sev}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const icon = L.divIcon({
    className: '',
    // Visual stays 26px; 44px iconSize gives a 44px touch target (Apple HIG).
    html: `<div class="rg-marker${sev === 'critical' ? ' rg-marker-pulse' : ''}" style="width:26px;height:26px;background:${SEVERITY_COLOR[sev]}"></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
  iconCache.set(key, icon);
  return icon;
}

function zoneIcon(): L.DivIcon {
  const key = 'zone';
  const cached = iconCache.get(key);
  if (cached) return cached;
  const icon = L.divIcon({
    className: '',
    // Visual stays 22px; 44px iconSize gives a 44px touch target.
    html: '<div class="rg-marker" style="width:22px;height:22px;background:#16a34a"><div style="width:8px;height:8px;border-radius:9999px;background:#fff"></div></div>',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
  iconCache.set(key, icon);
  return icon;
}

export interface MapFocus {
  lat: number;
  lng: number;
  id?: string;
  nonce: number;
}

function FitAll({ reports, fitKey }: { reports: DisasterReport[]; fitKey?: string }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitKey || fitted.current) return;
    if (reports.length === 0) return;
    fitted.current = true;
    const bounds = L.latLngBounds(reports.map((r) => [r.latitude, r.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, reports, fitKey]);
  return null;
}

function FlyTo({ focus, markers }: { focus?: MapFocus; markers: Map<string, L.Marker | null> }) {
  const map = useMap();
  const last = useRef(0);
  useEffect(() => {
    if (!focus || focus.nonce === last.current) return;
    last.current = focus.nonce;
    map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
    if (focus.id) {
      window.setTimeout(() => markers.get(focus.id ?? '')?.openPopup(), 850);
    }
  }, [map, focus, markers]);
  return null;
}

const userDotIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 1px 4px rgb(15 23 42 / 0.45)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/** Fly to the visitor's GPS position on mount and show a blue dot. Silent on denial. */
function UserCenter({ enabled }: { enabled?: boolean }) {
  const map = useMap();
  const [pos, setPos] = useState<[number, number] | null>(null);
  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (cancelled) return;
        const ll: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(ll);
        map.flyTo(ll, Math.max(map.getZoom(), 11), { duration: 1 });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
    return () => {
      cancelled = true;
    };
  }, [map, enabled]);
  if (!pos) return null;
  return <Marker position={pos} icon={userDotIcon} interactive={false} />;
}

/**
 * Keep Leaflet in sync when its container changes size: folding/unfolding a
 * foldable, rotating the phone, split-screen, or dynamic toolbar changes.
 * Without this the map renders grey/offset tiles after a resize.
 */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);
    // Orientation flips sometimes report size before rotation completes.
    const onOrientation = () => {
      window.setTimeout(() => map.invalidateSize(), 250);
    };
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, [map]);
  return null;
}

interface IncidentMapProps {
  reports: DisasterReport[];
  zones?: SafeZone[];
  showDangerZones?: boolean;
  selectedRoute?: EvacuationRoute | null;
  /** Fixed height (legacy). Omit when className supplies a viewport-relative height. */
  height?: string;
  /** Extra classes on the map frame — e.g. rg-map-home / rg-map-evac. */
  className?: string;
  fitKey?: string;
  focus?: MapFocus;
  /** Center the map on the visitor's GPS position instead of the default view. */
  centerOnUser?: boolean;
  onViewDetails?: (id: string) => void;
  onEvacuate?: (report: DisasterReport) => void;
}

export default function IncidentMap({
  reports,
  zones = [],
  showDangerZones = false,
  selectedRoute = null,
  height = '420px',
  className,
  fitKey,
  focus,
  centerOnUser = false,
  onViewDetails,
  onEvacuate,
}: IncidentMapProps) {
  const markers = useMemo(() => new Map<string, L.Marker | null>(), []);
  // Official India tiles when a MapmyIndia key is configured, else OSM.
  const key = mapmyIndiaKey();
  const [tiles, setTiles] = useState(getMapTiles);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    // Option (b): always load the Mappls SDK when a key is present so the
    // official Government of India boundaries render reliably.
    void loadMapmyIndiaSDK(key).then((ok) => {
      if (!cancelled && ok) setTiles(getMapTiles());
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const center = useMemo<[number, number]>(() => {
    if (reports.length === 1) return [reports[0].latitude, reports[0].longitude];
    return [24.5, 79.5];
  }, [reports]);

  const routeZone = selectedRoute
    ? zones.find((z) => z.id === selectedRoute.safe_zone_id) ?? null
    : null;

  // On phones, disable scroll-wheel capture so the page can be scrolled past
  // the map; map still pans with one finger and zooms with pinch.
  // Live flag (not a one-shot read) so folding/unfolding updates behaviour.
  const allowScrollZoom = useWideScreen();

  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-slate-200', className)}
      style={className ? undefined : { height }}
    >
      <MapContainer
        center={center}
        zoom={reports.length === 1 ? 12 : 5}
        scrollWheelZoom={allowScrollZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <InvalidateOnResize />
        <TileLayer attribution={tiles.attribution} url={tiles.url} />
        <FitAll reports={reports} fitKey={centerOnUser ? undefined : fitKey} />
        <FlyTo focus={focus} markers={markers} />
        <UserCenter enabled={centerOnUser} />

        {showDangerZones
          ? reports.map((r) => (
              <Circle
                key={`danger-${r.id}`}
                center={[r.latitude, r.longitude]}
                radius={dangerRadiusMeters(r.severity)}
                pathOptions={{
                  color: SEVERITY_COLOR[r.severity],
                  weight: 1.5,
                  fillColor: SEVERITY_COLOR[r.severity],
                  fillOpacity: 0.12,
                }}
              />
            ))
          : null}

        {zones
          .filter((z) => z.is_active)
          .map((z) => (
            <Marker key={z.id} position={[z.latitude, z.longitude]} icon={zoneIcon()}>
              <Popup className="rg-popup" maxWidth={280} minWidth={220}>
                <div className="min-w-48">
                  <p className="text-xs font-bold tracking-wide text-emerald-700 uppercase">
                    Safe zone
                  </p>
                  <p className="text-sm font-bold text-slate-900">{z.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{z.address}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {z.capacity
                      ? `Occupancy ${z.current_occupancy}/${z.capacity}`
                      : 'Capacity not set'}
                  </p>
                  <a
                    href={googleNavUrl(z.latitude, z.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-600 px-3 py-3 text-center text-sm font-extrabold text-white touch-manipulation hover:bg-emerald-700"
                  >
                    🧭 Navigate in 3D →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

        {selectedRoute ? (
          <Polyline
            positions={selectedRoute.geometry}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '2 6', lineCap: 'round' }}
          />
        ) : null}
        {routeZone ? (
          <Circle
            center={[routeZone.latitude, routeZone.longitude]}
            radius={120}
            pathOptions={{ color: '#16a34a', weight: 2, fillColor: '#16a34a', fillOpacity: 0.25 }}
          />
        ) : null}

        {reports.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={severityIcon(r.severity)}
            ref={(m) => {
              markers.set(r.id, m);
            }}
          >
            <Popup className="rg-popup" maxWidth={280} minWidth={220}>
              <div className="min-w-48">
                <p className="text-sm font-bold text-slate-900">{DISASTER_TYPE_META[r.disaster_type].label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{r.address}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
                      SEVERITY_META[r.severity].badge,
                    )}
                  >
                    {SEVERITY_META[r.severity].label}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset',
                      STATUS_META[r.status].badge,
                    )}
                  >
                    {STATUS_META[r.status].label}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{timeAgo(r.created_at)}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {onViewDetails ? (
                    <button
                      type="button"
                      onClick={() => onViewDetails(r.id)}
                      className="flex min-h-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200"
                    >
                      View details →
                    </button>
                  ) : (
                    <Link
                      to={`/track/${r.id}`}
                      className="flex min-h-[44px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-800 touch-manipulation hover:bg-slate-200"
                    >
                      View details →
                    </Link>
                  )}
                  {onEvacuate ? (
                    <button
                      type="button"
                      onClick={() => onEvacuate(r)}
                      className="flex min-h-[48px] cursor-pointer touch-manipulation items-center justify-center rounded-lg bg-emerald-600 px-3 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
                    >
                      🧭 Evacuate safely →
                    </button>
                  ) : (
                    <Link
                      to={`/evacuate/${r.id}`}
                      className="flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-600 px-3 py-3 text-sm font-extrabold text-white touch-manipulation hover:bg-emerald-700"
                    >
                      🧭 Evacuate safely →
                    </Link>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
