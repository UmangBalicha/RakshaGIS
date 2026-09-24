/* Unit tests for src/lib/routing.js — OSRM parsing + offline fallbacks. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearRouteCache, getEvacuationRoutes } from './routing.js';

const realFetch = globalThis.fetch;
const realWindow = globalThis.window;

function stubWindow() {
  globalThis.window = {
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (...args) => clearTimeout(...args),
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realWindow === undefined) delete globalThis.window;
  else globalThis.window = realWindow;
  delete globalThis.localStorage;
});

// Road-route cache is process-wide: isolate every test.
beforeEach(() => {
  clearRouteCache();
});

function zone(id, lat, lng, active = true) {
  return {
    id,
    name: `Zone ${id}`,
    type: 'shelter',
    latitude: lat,
    longitude: lng,
    address: `${id} address`,
    capacity: 100,
    current_occupancy: 10,
    amenities: [],
    is_active: active,
  };
}

function osrmResponse(distance = 2100, duration = 480) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        code: 'Ok',
        routes: [
          {
            distance,
            duration,
            geometry: {
              coordinates: [
                [77.0, 28.0],
                [77.01, 28.01],
              ],
            },
            legs: [
              {
                steps: [
                  { name: 'MG Road', maneuver: { type: 'depart' }, distance: 100, duration: 30 },
                  { name: '', maneuver: { type: 'arrive' }, distance: 0, duration: 0 },
                ],
              },
            ],
          },
        ],
      }),
  };
}

describe('getEvacuationRoutes', () => {
  it('returns [] when there are no zones or none are active', async () => {
    stubWindow();
    await expect(getEvacuationRoutes(28.6, 77.2, [], 'driving')).resolves.toEqual([]);
    await expect(
      getEvacuationRoutes(28.6, 77.2, [zone('z1', 28.61, 77.21, false)], 'driving'),
    ).resolves.toEqual([]);
  });

  it('falls back to straight-line estimates when OSRM is unreachable', async () => {
    stubWindow();
    globalThis.fetch = () => Promise.reject(new Error('offline'));
    const zones = [zone('far', 28.8, 77.2), zone('near', 28.61, 77.21), zone('off', 28.601, 77.201, false)];
    const routes = await getEvacuationRoutes(28.6, 77.2, zones, 'driving', 3);

    expect(routes).toHaveLength(2);
    // Inactive zone filtered out; nearest first.
    expect(routes.map((r) => r.safe_zone_id)).toEqual(['near', 'far']);
    for (const r of routes) {
      expect(r.is_estimate).toBe(true);
      expect(r.geometry).toHaveLength(2);
      expect(r.steps).toHaveLength(2);
      expect(r.distance_meters).toBeGreaterThan(0);
      expect(r.duration_seconds).toBeGreaterThan(0);
    }
    // Sorted by duration ascending.
    expect(routes[0].duration_seconds).toBeLessThanOrEqual(routes[1].duration_seconds);
  });

  it('respects the limit parameter', async () => {
    stubWindow();
    globalThis.fetch = () => Promise.reject(new Error('offline'));
    const zones = [zone('a', 28.61, 77.21), zone('b', 28.62, 77.22), zone('c', 28.63, 77.23)];
    const routes = await getEvacuationRoutes(28.6, 77.2, zones, 'driving', 2);
    expect(routes).toHaveLength(2);
  });

  it('parses live OSRM responses into road routes with turn-by-turn steps', async () => {
    stubWindow();
    globalThis.fetch = () => Promise.resolve(osrmResponse());
    const routes = await getEvacuationRoutes(28.6, 77.2, [zone('z1', 28.61, 77.21)], 'driving');

    expect(routes).toHaveLength(1);
    const [r] = routes;
    expect(r.is_estimate).toBe(false);
    expect(r.distance_meters).toBe(2100);
    expect(r.duration_seconds).toBe(480);
    // GeoJSON [lng,lat] mapped to Leaflet [lat,lng].
    expect(r.geometry).toEqual([
      [28.0, 77.0],
      [28.01, 77.01],
    ]);
    expect(r.steps[0].instruction).toBe('Head out onto MG Road');
    expect(r.steps[1].instruction).toBe('Arrive at the safe zone');
  });

  it('re-times driving geometry for walking when foot routing is unavailable', async () => {
    stubWindow();
    globalThis.fetch = (url) =>
      String(url).includes('/foot/')
        ? Promise.reject(new Error('no foot data'))
        : Promise.resolve(osrmResponse(2000, 600));
    const routes = await getEvacuationRoutes(28.6, 77.2, [zone('z1', 28.61, 77.21)], 'walking');

    expect(routes).toHaveLength(1);
    expect(routes[0].is_estimate).toBe(true);
    expect(routes[0].profile).toBe('walking');
    expect(routes[0].duration_seconds).toBe(600 * 3.5);
  });

  it('serves repeated identical requests from cache without refetching', async () => {
    stubWindow();
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
    let fetchCount = 0;
    globalThis.fetch = () => {
      fetchCount += 1;
      return Promise.resolve(osrmResponse());
    };
    const zones = [zone('z1', 28.61, 77.21)];
    const first = await getEvacuationRoutes(28.6, 77.2, zones, 'driving');
    const second = await getEvacuationRoutes(28.6, 77.2, zones, 'driving');
    expect(fetchCount).toBe(1);
    expect(second).toEqual(first);
    expect(second[0].is_estimate).toBe(false);
  });

  it('retries throttled OSRM responses with backoff, then succeeds', async () => {
    stubWindow();
    let calls = 0;
    globalThis.fetch = () => {
      calls += 1;
      return calls === 1
        ? Promise.resolve({ ok: false, status: 429 })
        : Promise.resolve(osrmResponse());
    };
    const routes = await getEvacuationRoutes(28.62, 77.22, [zone('z1', 28.63, 77.23)], 'driving');
    expect(calls).toBe(2);
    expect(routes).toHaveLength(1);
    expect(routes[0].is_estimate).toBe(false);
  });
});
