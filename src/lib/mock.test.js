/* Tests for the demo-mode backend (src/lib/mock.js) — the exact code path the
   deployed site uses when Supabase env vars are unset. */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_OTP_CODE,
  mockCreateReport,
  mockCreateZone,
  mockDeleteZone,
  mockGetReport,
  mockListAlerts,
  mockListNotifications,
  mockListProfiles,
  mockListReports,
  mockListZones,
  mockMarkNotificationRead,
  mockResetDemo,
  mockUpdateReport,
  mockUpdateZone,
} from './mock.js';
import { DISASTER_TYPES, SAFE_ZONE_TYPES } from './types.js';

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
  };
}

beforeEach(() => {
  globalThis.localStorage = makeStorage();
  globalThis.window = { dispatchEvent: () => true };
  mockResetDemo();
});

describe('seed dataset', () => {
  it('seeds a stable set of reports, zones, profiles and alerts', async () => {
    const reports = await mockListReports();
    const zones = await mockListZones();
    const profiles = await mockListProfiles();
    const alerts = await mockListAlerts();
    expect(reports.length).toBe(17);
    expect(zones.length).toBe(30);
    expect(profiles.length).toBe(2);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('every seeded report uses valid domain values', async () => {
    const reports = await mockListReports();
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['pending', 'investigating', 'contained', 'resolved', 'false_alarm'];
    for (const r of reports) {
      expect(DISASTER_TYPES).toContain(r.disaster_type);
      expect(severities).toContain(r.severity);
      expect(statuses).toContain(r.status);
      expect(typeof r.latitude).toBe('number');
      expect(typeof r.longitude).toBe('number');
    }
  });

  it('every seeded zone is active with coordinates and capacity', async () => {
    const zones = await mockListZones();
    for (const z of zones) {
      expect(SAFE_ZONE_TYPES).toContain(z.type);
      expect(typeof z.latitude).toBe('number');
      expect(typeof z.longitude).toBe('number');
      expect(z.is_active).toBe(true);
      expect(z.capacity).toBeGreaterThan(0);
    }
  });

  it('contains the well-known seed incidents', async () => {
    expect((await mockGetReport('seed-01'))?.disaster_type).toBe('wildfire');
    expect((await mockGetReport('seed-09'))?.disaster_type).toBe('earthquake');
    expect((await mockGetReport('seed-17'))?.disaster_type).toBe('industrial');
  });
});

describe('report CRUD', () => {
  it('creates, reads and triages a report, and notifies admins', async () => {
    const created = await mockCreateReport(
      {
        latitude: 28.6,
        longitude: 77.2,
        address: 'Test Street',
        disaster_type: 'flood',
        description: 'test',
        has_injuries: false,
        injury_count: 0,
        images: [],
      },
      null,
      'high',
    );
    expect(created.id).toMatch(/^rpt-/);
    expect(created.status).toBe('pending');
    expect(created.reporter_name).toBe('Anonymous citizen');

    const fetched = await mockGetReport(created.id);
    expect(fetched?.address).toBe('Test Street');

    const updated = await mockUpdateReport(created.id, { status: 'investigating' });
    expect(updated.status).toBe('investigating');

    const adminNotifs = await mockListNotifications('user-admin-01');
    expect(adminNotifs.some((n) => n.report_id === created.id)).toBe(true);

    // Unknown ids throw synchronously (not a rejected promise).
    expect(() => mockUpdateReport('missing-id', { status: 'resolved' })).toThrow(
      'Report not found.',
    );
  });
});

describe('safe-zone CRUD', () => {
  it('creates, updates and deletes a zone', async () => {
    const created = await mockCreateZone({
      name: 'Test Shelter',
      type: 'shelter',
      latitude: 28.61,
      longitude: 77.21,
      address: 'Test addr',
      capacity: 200,
      amenities: ['water'],
      is_active: true,
    });
    expect(created.current_occupancy).toBe(0);

    const updated = await mockUpdateZone(created.id, { current_occupancy: 50 });
    expect(updated.current_occupancy).toBe(50);

    await mockDeleteZone(created.id);
    const zones = await mockListZones();
    expect(zones.find((z) => z.id === created.id)).toBeUndefined();
  });
});

describe('notifications', () => {
  it('marks notifications read', async () => {
    const before = await mockListNotifications('user-admin-01');
    const unread = before.find((n) => !n.is_read);
    expect(unread).toBeDefined();
    await mockMarkNotificationRead(unread.id);
    const after = await mockListNotifications('user-admin-01');
    expect(after.find((n) => n.id === unread.id)?.is_read).toBe(true);
  });
});

describe('auth constants', () => {
  it('demo OTP code is stable', () => {
    expect(DEMO_OTP_CODE).toBe('123456');
  });
});
