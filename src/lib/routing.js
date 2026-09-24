/* Evacuation routing via OSRM (route server configurable).
 * Default: the free OSRM public demo server (no key). It rate-limits heavy
 * use, so: successful road routes are cached 15 min, 429/503 responses are
 * retried with backoff, and everything degrades to straight-line estimates.
 * For production fleets set VITE_OSRM_URL to a self-hosted OSRM instance.
 */
import { formatDistance, haversineMeters } from './utils';
/** Single calibrated walking speed every ETA in this file derives from. */
const WALK_MPS = 1.4; // ~5 km/h, brisk evacuation pace
/** OSRM urban driving is ~6x walking pace; the fallback re-times road geometry. */
const WALK_RETIIME_FACTOR = 6;
const OSRM_BASE = (import.meta.env.VITE_OSRM_URL ?? '').trim().replace(/\/$/, '') ||
    'https://router.project-osrm.org/route/v1';
const ROUTE_TTL_MS = 15 * 60 * 1000;
const ROUTE_STORE_KEY = 'rakshagis_routes_v1';
const ROUTE_STORE_MAX = 50;
function humanizeStep(step) {
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
function routeCacheKey(fromLat, fromLng, toLat, toLng, profile) {
    // ~1.1 m precision: toFixed(3) collided origins up to ~155 m apart and
    // served each other's geometry and first instruction.
    const r = (n) => Number(n).toFixed(5);
    return `${profile}:${r(fromLat)},${r(fromLng)}>${r(toLat)},${r(toLng)}`;
}
function readRouteCache() {
    try {
        if (typeof localStorage === 'undefined')
            return [];
        const raw = localStorage.getItem(ROUTE_STORE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list))
            return [];
        const fresh = list.filter((e) => e && Date.now() - e.at < ROUTE_TTL_MS);
        return fresh;
    }
    catch {
        return [];
    }
}
function writeRouteCache(list) {
    try {
        if (typeof localStorage === 'undefined')
            return;
        localStorage.setItem(ROUTE_STORE_KEY, JSON.stringify(list.slice(-ROUTE_STORE_MAX)));
    }
    catch {
        /* storage unavailable (private mode) — memory-only operation */
    }
}
function getCachedRoute(fromLat, fromLng, toLat, toLng, profile) {
    const key = routeCacheKey(fromLat, fromLng, toLat, toLng, profile);
    const hit = readRouteCache().find((e) => e && e.key === key);
    // Never trust a persisted entry blindly: a truncated/tampered record used
    // to surface as distance_meters: undefined -> "NaN km" in the UI.
    const r = hit?.route;
    if (r &&
        Number.isFinite(r.distance) &&
        Number.isFinite(r.duration) &&
        Array.isArray(r.geometry) &&
        r.geometry.every((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))) {
        return r;
    }
    return null;
}
function setCachedRoute(fromLat, fromLng, toLat, toLng, profile, route) {
    const key = routeCacheKey(fromLat, fromLng, toLat, toLng, profile);
    const list = readRouteCache().filter((e) => e.key !== key);
    list.push({ key, at: Date.now(), route });
    writeRouteCache(list);
}
/** Test hook: drop all cached road routes. */
export function clearRouteCache() {
    try {
        if (typeof localStorage !== 'undefined')
            localStorage.removeItem(ROUTE_STORE_KEY);
    }
    catch {
        /* ignore */
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchRoute(fromLat, fromLng, toLat, toLng, profile) {
    const cached = getCachedRoute(fromLat, fromLng, toLat, toLng, profile);
    if (cached)
        return cached;
    const osrmProfile = profile === 'walking' ? 'foot' : 'driving';
    const url = `${OSRM_BASE}/${osrmProfile}/${fromLng},${fromLat};${toLng},${toLat}` +
        `?overview=full&geometries=geojson&steps=true`;
    for (let attempt = 0; attempt < 3; attempt++) {
        // Fresh controller + timeout per attempt: the old single 12 s timer
        // spanned the whole retry loop, so attempt 2 inherited an aborted
        // signal and the 429/503 backoff below never actually ran.
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), 12000);
        let res;
        try {
            res = await fetch(url, { signal: ctrl.signal });
        }
        catch {
            window.clearTimeout(timer);
            // Network down / timed out — retrying won't help; fail fast.
            return null;
        }
        window.clearTimeout(timer);
        if (res.ok) {
            let data;
            try {
                data = (await res.json());
            }
            catch {
                return null;
            }
            if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0)
                return null;
            const r = data.routes[0];
            if (!r || !Array.isArray(r.geometry?.coordinates))
                return null;
            const geometry = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            const steps = (r.legs?.[0]?.steps ?? []).map((s) => ({
                instruction: humanizeStep(s),
                distance_meters: s.distance,
                duration_seconds: s.duration,
            }));
            const road = { distance: r.distance, duration: r.duration, geometry, steps };
            setCachedRoute(fromLat, fromLng, toLat, toLng, profile, road);
            return road;
        }
        // Throttled or warming up — back off, then retry. Anything else is final.
        if ((res.status === 429 || res.status === 503) && attempt < 2) {
            await sleep(500 * (attempt + 1));
            continue;
        }
        return null;
    }
    return null;
}
function straightLineRoute(to, fromLat, fromLng, profile) {
    const dist = haversineMeters(fromLat, fromLng, to.latitude, to.longitude);
    // Conservative on-foot / congested-driving speed estimate.
    const speedMps = profile === 'walking' ? WALK_MPS : 8;
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
export async function getEvacuationRoutes(fromLat, fromLng, zones, profile = 'driving', limit = 3) {
    const active = zones.filter((z) => z.is_active);
    if (active.length === 0)
        return [];
    const ranked = active
        .map((z) => ({ zone: z, straight: haversineMeters(fromLat, fromLng, z.latitude, z.longitude) }))
        .sort((a, b) => a.straight - b.straight)
        .slice(0, Math.max(1, limit));
    const results = await Promise.all(ranked.map(async ({ zone }) => {
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
            };
        }
        // Foot routing data is patchy — fall back to the driving road geometry
        // re-timed for walking (same WALK_MPS basis as straight-line ETAs)
        // rather than showing nothing.
        if (profile === 'walking') {
            const drv = await fetchRoute(fromLat, fromLng, zone.latitude, zone.longitude, 'driving');
            if (drv) {
                return {
                    safe_zone_id: zone.id,
                    safe_zone_name: zone.name,
                    distance_meters: drv.distance,
                    duration_seconds: drv.duration * WALK_RETIIME_FACTOR,
                    geometry: drv.geometry,
                    steps: drv.steps,
                    profile,
                    is_estimate: true,
                };
            }
        }
        return straightLineRoute(zone, fromLat, fromLng, profile);
    }));
    return results.sort((a, b) => a.duration_seconds - b.duration_seconds);
}
