/* Evacuation routing via the free OSRM public demo server.
 * No API key needed. Falls back to straight-line estimates when OFFLINE.
 */
import { formatDistance, haversineMeters } from './utils';
import type { EvacuationRoute, RouteStep, SafeZone, TravelProfile } from './types';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

interface OsrmStep {
  maneuver: { type: string; modifier?: string };
  name: string;
  distance: number;
  duration: number;
}

interface OsrmResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: Array<[number, number]> }; // [lng, lat]
    legs: Array<{ steps: OsrmStep[] }>;
  }>;
}

function humanizeStep(step: OsrmStep): string {
  const name = step.name ? ` onto ${step.name}` : '';
  const type = step.maneuver.type;
  const mod = step.maneuver.modifier ?? '';
  switch (type) {
    case 'depart':
      return `Head out${name}`;
    case 'arrive':
      return 'Arrive at the safe zone';
    case 'turn':
      return `Turn ${mod}${name}`;
    case 'continue':
      return `Continue${mod ? ` ${mod}` : ''}${name}`;
    case 'roundabout':
    case 'rotary':
      return `At the roundabout, take the exit${name}`;
    case 'merge':
      return `Merge${name}`;
    case 'on ramp':
      return `Take the ramp${mod ? ` ${mod}` : ''}${name}`;
    case 'off ramp':
      return `Take the exit${mod ? ` ${mod}` : ''}${name}`;
    case 'fork':
      return `Keep ${mod} at the fork${name}`;
    case 'end of road':
      return `At the end of the road, turn ${mod}${name}`;
    case 'notification':
      return `Continue${name}`;
    case 'roundabout turn':
      return `At the roundabout, turn ${mod}${name}`;
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)}${mod ? ` ${mod}` : ''}${name}`;
  }
}

async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: TravelProfile,
): Promise<{ distance: number; duration: number; geometry: Array<[number, number]>; steps: RouteStep[] } | null> {
  const osrmProfile = profile === 'walking' ? 'foot' : 'driving';
  const url =
    `${OSRM_BASE}/${osrmProfile}/${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true`;
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;
    const r = data.routes[0];
    const geometry = r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    const steps: RouteStep[] = (r.legs[0]?.steps ?? []).map((s) => ({
      instruction: humanizeStep(s),
      distance_meters: s.distance,
      duration_seconds: s.duration,
    }));
    return { distance: r.distance, duration: r.duration, geometry, steps };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function straightLineRoute(
  to: SafeZone,
  fromLat: number,
  fromLng: number,
  profile: TravelProfile,
): EvacuationRoute {
  const dist = haversineMeters(fromLat, fromLng, to.latitude, to.longitude);
  // Conservative on-foot / congested-driving speed estimate.
  const speedMps = profile === 'walking' ? 1.1 : 8;
  return {
    safe_zone_id: to.id,
    safe_zone_name: to.name,
    distance_meters: dist,
    duration_seconds: dist / speedMps,
    geometry: [
      [fromLat, fromLng],
      [to.latitude, to.longitude],
    ],
    steps: [
      {
        instruction: `Leave the incident area and head toward ${to.name}`,
        distance_meters: dist,
        duration_seconds: dist / speedMps,
      },
      {
        instruction: `Arrive at ${to.name} — ${formatDistance(dist)} direct (live road route unavailable, follow local guidance)`,
        distance_meters: 0,
        duration_seconds: 0,
      },
    ],
    profile,
    is_estimate: true,
  };
}

/**
 * Rank active safe zones by road distance and return the nearest `limit`
 * with full turn-by-turn geometry. Never throws — degrades to
 * straight-line estimates when OSRM is unreachable.
 */
export async function getEvacuationRoutes(
  fromLat: number,
  fromLng: number,
  zones: SafeZone[],
  profile: TravelProfile = 'driving',
  limit = 3,
): Promise<EvacuationRoute[]> {
  const active = zones.filter((z) => z.is_active);
  if (active.length === 0) return [];

  const ranked = active
    .map((z) => ({ zone: z, straight: haversineMeters(fromLat, fromLng, z.latitude, z.longitude) }))
    .sort((a, b) => a.straight - b.straight)
    .slice(0, Math.max(1, limit));

  const results = await Promise.all(
    ranked.map(async ({ zone }) => {
      const road = await fetchRoute(fromLat, fromLng, zone.latitude, zone.longitude, profile);
      if (road) {
        return {
          safe_zone_id: zone.id,
          safe_zone_name: zone.name,
          distance_meters: road.distance,
          duration_seconds: road.duration,
          geometry: road.geometry,
          steps: road.steps,
          profile,
          is_estimate: false,
        } satisfies EvacuationRoute;
      }
      // Foot routing data is patchy — fall back to the driving road geometry
      // re-timed for walking rather than showing nothing.
      if (profile === 'walking') {
        const drv = await fetchRoute(fromLat, fromLng, zone.latitude, zone.longitude, 'driving');
        if (drv) {
          return {
            safe_zone_id: zone.id,
            safe_zone_name: zone.name,
            distance_meters: drv.distance,
            duration_seconds: drv.duration * 3.5,
            geometry: drv.geometry,
            steps: drv.steps,
            profile,
            is_estimate: true,
          } satisfies EvacuationRoute;
        }
      }
      return straightLineRoute(zone, fromLat, fromLng, profile);
    }),
  );

  return results.sort((a, b) => a.duration_seconds - b.duration_seconds);
}
