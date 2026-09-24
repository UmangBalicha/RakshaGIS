/* Unit tests for src/lib/utils.js — pure helpers used across the whole app. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AMENITY_LABELS,
  DISASTER_TYPE_META,
  SAFE_ZONE_TYPE_META,
  SEVERITY_META,
  STATUS_META,
  clearGeocodeCache,
  cn,
  dangerRadiusMeters,
  formatDateTime,
  formatDistance,
  formatDuration,
  googleNavUrl,
  haversineMeters,
  reverseGeocode,
  suggestSeverity,
  timeAgo,
} from './utils.js';
import { DISASTER_TYPES, SAFE_ZONE_TYPES, SEVERITY_ORDER } from './types.js';

describe('cn', () => {
  it('joins truthy parts and skips falsy ones', () => {
    expect(cn('a', false, 'b', undefined, '', null, 'c')).toBe('a b c');
  });
});

describe('metadata tables cover every domain value', () => {
  it('every disaster type has a label, hint and icon', () => {
    for (const t of DISASTER_TYPES) {
      expect(DISASTER_TYPE_META[t]?.label, t).toBeTruthy();
      expect(DISASTER_TYPE_META[t]?.hint, t).toBeTruthy();
      expect(DISASTER_TYPE_META[t]?.Icon, t).toBeTruthy();
    }
  });
  it('every severity has meta', () => {
    for (const s of SEVERITY_ORDER) {
      expect(SEVERITY_META[s]?.label, s).toBeTruthy();
    }
  });
  it('every safe-zone type has meta', () => {
    for (const z of SAFE_ZONE_TYPES) {
      expect(SAFE_ZONE_TYPE_META[z]?.label, z).toBeTruthy();
    }
  });
  it('every status has meta', () => {
    for (const s of ['pending', 'investigating', 'contained', 'resolved', 'false_alarm']) {
      expect(STATUS_META[s]?.label, s).toBeTruthy();
    }
  });
  it('amenity labels exist', () => {
    expect(AMENITY_LABELS.water).toBe('Drinking water');
  });
});

describe('suggestSeverity', () => {
  it('injuries always escalate to critical', () => {
    expect(suggestSeverity({ disaster_type: 'other', has_injuries: true })).toBe('critical');
    expect(suggestSeverity({ disaster_type: 'building_fire', has_injuries: true })).toBe('critical');
  });
  it('quake / tsunami / cyclone default to critical', () => {
    for (const t of ['earthquake', 'tsunami', 'cyclone']) {
      expect(suggestSeverity({ disaster_type: t, has_injuries: false })).toBe('critical');
    }
  });
  it('flood / landslide / wildfire / industrial / chemical default to high', () => {
    for (const t of ['flood', 'landslide', 'wildfire', 'industrial', 'chemical']) {
      expect(suggestSeverity({ disaster_type: t, has_injuries: false })).toBe('high');
    }
  });
  it('building fire / volcanic default to medium, other to low', () => {
    expect(suggestSeverity({ disaster_type: 'building_fire', has_injuries: false })).toBe('medium');
    expect(suggestSeverity({ disaster_type: 'volcanic', has_injuries: false })).toBe('medium');
    expect(suggestSeverity({ disaster_type: 'other', has_injuries: false })).toBe('low');
  });
});

describe('dangerRadiusMeters', () => {
  it('returns severity-driven radii', () => {
    expect(dangerRadiusMeters('critical')).toBe(2000);
    expect(dangerRadiusMeters('high')).toBe(1500);
    expect(dangerRadiusMeters('medium')).toBe(1000);
    expect(dangerRadiusMeters('low')).toBe(500);
    expect(dangerRadiusMeters('bogus')).toBe(500);
  });
});

describe('haversineMeters', () => {  it('is zero for identical points and symmetric', () => {
    expect(haversineMeters(28.6, 77.2, 28.6, 77.2)).toBe(0);
    const a = haversineMeters(28.6139, 77.209, 19.076, 72.8777);
    const b = haversineMeters(19.076, 72.8777, 28.6139, 77.209);
    expect(a).toBe(b);
  });
  it('matches known distances', () => {
    // 1 degree of latitude ≈ 111.2 km.
    const oneDegree = haversineMeters(0, 0, 1, 0);
    expect(oneDegree).toBeGreaterThan(111000);
    expect(oneDegree).toBeLessThan(111400);
    // Delhi → Mumbai ≈ 1150 km.
    const delhiMumbai = haversineMeters(28.6139, 77.209, 19.076, 72.8777);
    expect(delhiMumbai).toBeGreaterThan(1100000);
    expect(delhiMumbai).toBeLessThan(1200000);
  });
  it('never returns NaN for near-antipodal points', () => {
    // Floating point pushes the haversine term a hair past 1 here; the
    // result must stay finite so every radius comparison keeps working.
    const d = haversineMeters(0, 0, 0.0001, 180);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeGreaterThan(19000000);
  });
});

describe('formatDistance / formatDuration', () => {
  it('formats meters and kilometers', () => {
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });
  it('guards non-finite input instead of printing "NaN km"', () => {
    expect(formatDistance(NaN)).toBe('—');
    expect(formatDistance(Infinity)).toBe('—');
  });
});

describe('formatDistance / formatDuration', () => {
  it('formats meters and kilometers', () => {
    expect(formatDistance(999)).toBe('999 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });
  it('formats minutes and hours', () => {
    expect(formatDuration(300)).toBe('5 min');
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});

describe('googleNavUrl', () => {
  it('builds a driving URL by default', () => {
    const url = googleNavUrl(30.3, 78.0);
    expect(url).toContain('https://www.google.com/maps/dir/?api=1');
    expect(url).toContain(`destination=${encodeURIComponent('30.3,78')}`);
    expect(url).toContain('travelmode=driving');
  });
  it('adds origin and walking mode when given', () => {
    const url = googleNavUrl(30.3, 78.0, { lat: 28.6, lng: 77.2 }, 'walking');
    expect(url).toContain(`origin=${encodeURIComponent('28.6,77.2')}`);
    expect(url).toContain('travelmode=walking');
    // Known origin => real turn-by-turn handoff, not a passive preview.
    expect(url).toContain('dir_action=navigate');
  });
  it('omits dir_action without an origin (device GPS decides)', () => {
    const url = googleNavUrl(30.3, 78.0);
    expect(url).not.toContain('dir_action');
  });
});

describe('formatDateTime / timeAgo', () => {
  it('passes invalid input through / returns empty', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date');
    expect(timeAgo('not-a-date')).toBe('');
  });
  it('formats valid dates and relative times', () => {
    expect(formatDateTime('2026-09-19T10:05:00')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(timeAgo(new Date().toISOString())).toBe('just now');
    expect(timeAgo(new Date(Date.now() - 5 * 60000).toISOString())).toBe('5m ago');
    expect(timeAgo(new Date(Date.now() - 3 * 3600000).toISOString())).toBe('3h ago');
    expect(timeAgo(new Date(Date.now() - 10 * 86400000).toISOString())).toBe('10d ago');
  });
});

describe('reverseGeocode', () => {
  const realFetch = globalThis.fetch;
  const realWindow = globalThis.window;
  afterEach(() => {
    globalThis.fetch = realFetch;
    if (realWindow === undefined) delete globalThis.window;
    else globalThis.window = realWindow;
    vi.unstubAllGlobals();
  });

  function stubWindow() {
    globalThis.window = {
      setTimeout: (...args) => setTimeout(...args),
      clearTimeout: (...args) => clearTimeout(...args),
    };
  }

  it('falls back to lat,lng when the network fails', async () => {
    stubWindow();
    globalThis.fetch = () => Promise.reject(new Error('offline'));
    await expect(reverseGeocode(28.6139, 77.209)).resolves.toBe('28.61390, 77.20900');
  });

  it('returns the first address parts on success', async () => {
    stubWindow();
    globalThis.fetch = () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ display_name: 'A, B, C, D, E' }) });
    await expect(reverseGeocode(28.6, 77.2)).resolves.toBe('A, B, C, D');
  });

  it('caches results per ~100m cell instead of re-querying', async () => {
    clearGeocodeCache();
    stubWindow();
    let calls = 0;
    globalThis.fetch = () => {
      calls += 1;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ display_name: 'X, Y' }) });
    };
    // Same spot twice + a neighbour in the same cell: one network call.
    await reverseGeocode(12.9716, 77.5944);
    await reverseGeocode(12.9716, 77.5944);
    await reverseGeocode(12.97165, 77.59445);
    expect(calls).toBe(1);
    // A far-away pin is a different cell: second call.
    await reverseGeocode(13.5, 78.0);
    expect(calls).toBe(2);
  });
});
