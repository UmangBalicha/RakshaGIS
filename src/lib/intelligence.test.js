/* Tests for src/lib/intelligence.js — the PS scoring engine. */
import { describe, expect, it } from 'vitest';
import {
  assessSiteSuitability,
  carryingGap,
  identifyRedZoneCandidates,
  intensityBand,
  liveReports,
  nearestRedZone,
  prioritizeHabitations,
  scoreRedZone,
} from './intelligence.js';

function report(id, lat, lng, disaster_type = 'flood', severity = 'high', status = 'pending') {
  return { id, latitude: lat, longitude: lng, disaster_type, severity, status };
}

describe('intensityBand', () => {
  it('maps scores to bands at documented thresholds', () => {
    expect(intensityBand(100)).toBe('extreme');
    expect(intensityBand(75)).toBe('extreme');
    expect(intensityBand(74)).toBe('high');
    expect(intensityBand(55)).toBe('high');
    expect(intensityBand(54)).toBe('moderate');
    expect(intensityBand(35)).toBe('moderate');
    expect(intensityBand(34)).toBe('low');
    expect(intensityBand(0)).toBe('low');
  });
});

describe('scoreRedZone', () => {
  it('scores maximum evidence as extreme ~100', () => {
    const { score, band } = scoreRedZone({
      incidentCount: 12,
      maxSeverity: 'critical',
      recentCount: 5,
      populationExposed: 20000,
    });
    expect(score).toBe(100);
    expect(band).toBe('extreme');
  });
  it('scores empty evidence as low 0', () => {
    expect(scoreRedZone()).toEqual({ score: 0, band: 'low' });
  });
  it('clamps hostile inputs to the 0–100 contract', () => {
    expect(scoreRedZone({ incidentCount: -5, maxSeverity: 'critical', recentCount: -2, populationExposed: -100 })).toEqual({ score: 0, band: 'low' });
  });
  it('is monotonic in every evidence dimension', () => {
    const none = scoreRedZone({ incidentCount: 1, maxSeverity: 'low' }).score;
    const moreHistory = scoreRedZone({ incidentCount: 6, maxSeverity: 'low' }).score;
    const worseSeverity = scoreRedZone({ incidentCount: 6, maxSeverity: 'critical' }).score;
    const withRecency = scoreRedZone({ incidentCount: 6, maxSeverity: 'critical', recentCount: 3 }).score;
    const withExposure = scoreRedZone({
      incidentCount: 6,
      maxSeverity: 'critical',
      recentCount: 3,
      populationExposed: 5000,
    }).score;
    expect(moreHistory).toBeGreaterThan(none);
    expect(worseSeverity).toBeGreaterThan(moreHistory);
    expect(withRecency).toBeGreaterThan(worseSeverity);
    expect(withExposure).toBeGreaterThan(withRecency);
  });
});

describe('liveReports', () => {
  it('excludes resolved and false alarms', () => {
    const rows = [
      report('a', 0, 0, 'flood', 'high', 'pending'),
      report('b', 0, 0, 'flood', 'high', 'resolved'),
      report('c', 0, 0, 'flood', 'high', 'false_alarm'),
    ];
    expect(liveReports(rows).map((r) => r.id)).toEqual(['a']);
  });
});

describe('identifyRedZoneCandidates', () => {
  it('clusters nearby live reports into a candidate', () => {
    const rows = [
      report('a', 28.6, 77.2, 'flood', 'high'),
      report('b', 28.605, 77.205, 'flood', 'critical'),
      report('c', 19.0, 72.8, 'cyclone', 'high'),
    ];
    const out = identifyRedZoneCandidates(rows, { minIncidents: 2, clusterKm: 5 });
    expect(out).toHaveLength(1);
    expect(out[0].report_ids).toEqual(expect.arrayContaining(['a', 'b']));
    expect(out[0].incident_count).toBe(2);
    expect(out[0].max_severity).toBe('critical');
    expect(out[0].radius_meters).toBeGreaterThan(1000);
  });
  it('requires the minimum incident count and ignores dormant reports', () => {
    const rows = [
      report('a', 28.6, 77.2, 'flood', 'high'),
      report('b', 28.605, 77.205, 'flood', 'high'),
    ];
    expect(identifyRedZoneCandidates(rows, { minIncidents: 3 })).toHaveLength(0);
    const dormant = [report('a', 28.6, 77.2, 'flood', 'high', 'resolved')];
    expect(identifyRedZoneCandidates(dormant)).toHaveLength(0);
  });
});

describe('assessSiteSuitability + carryingGap', () => {
  const fullSite = {
    amenities: ['water', 'food', 'medical', 'bedding', 'power', 'comms'],
    water_access: true,
    road_access: true,
    health_access: true,
    school_access: true,
    capacity: 1000,
    current_occupancy: 100,
    allocated_population: 50,
    latitude: 28.0,
    longitude: 77.0,
  };
  it('grades a fully equipped isolated site as A', () => {
    const { score, grade } = assessSiteSuitability(fullSite, []);
    expect(grade).toBe('A');
    expect(score).toBeGreaterThanOrEqual(80);
  });
  it('penalises bare sites next to red zones', () => {
    const bare = {
      amenities: [],
      capacity: 100,
      current_occupancy: 100,
      allocated_population: 0,
      latitude: 28.6,
      longitude: 77.2,
    };
    const zones = [
      { id: 'rz', status: 'active', latitude: 28.605, longitude: 77.205, radius_meters: 2000 },
    ];
    const { score, grade, factors } = assessSiteSuitability(bare, zones);
    expect(grade).toBe('D');
    expect(score).toBeLessThan(40);
    expect(factors).toHaveLength(4);
  });
  it('computes carrying gaps, including over-capacity and unknown', () => {
    expect(carryingGap(fullSite)).toBe(850);
    expect(carryingGap({ capacity: 100, current_occupancy: 90, allocated_population: 30 })).toBe(-20);
    expect(carryingGap({ capacity: null })).toBeNull();
  });
  it('finds the nearest active red zone edge', () => {
    const zones = [
      { id: 'far', status: 'active', latitude: 29.0, longitude: 77.0, radius_meters: 1000 },
      { id: 'near', status: 'active', latitude: 28.61, longitude: 77.21, radius_meters: 500 },
      { id: 'off', status: 'denotified', latitude: 28.601, longitude: 77.201, radius_meters: 5000 },
    ];
    const near = nearestRedZone({ latitude: 28.6, longitude: 77.2 }, zones);
    expect(near.zone.id).toBe('near');
    expect(near.distance_meters).toBeGreaterThan(0);
    expect(nearestRedZone({ latitude: 0, longitude: 0 }, [])).toBeNull();
  });
});

describe('prioritizeHabitations', () => {
  const extreme = {
    id: 'rz1',
    name: 'Test Red Zone',
    status: 'active',
    intensity: 'extreme',
    latitude: 28.6,
    longitude: 77.2,
    radius_meters: 3000,
  };
  const exposed = {
    id: 'h1',
    name: 'Exposed Village',
    latitude: 28.605,
    longitude: 77.205,
    population: 1000,
    vulnerable_count: 400,
    kutcha_share: 70,
    red_zone_id: 'rz1',
    past_incidents: 6,
  };
  const safe = {
    id: 'h2',
    name: 'Safe Town',
    latitude: 20.0,
    longitude: 75.0,
    population: 5000,
    vulnerable_count: 200,
    kutcha_share: 5,
    red_zone_id: null,
    past_incidents: 0,
  };
  it('flags an exposed, vulnerable, repeatedly-hit village as immediate', () => {
    const [first, second] = prioritizeHabitations(
      [safe, exposed],
      [extreme],
      [report('r1', 28.606, 77.206, 'flood', 'critical')],
    );
    expect(first.habitation.id).toBe('h1');
    expect(first.phase).toBe('immediate');
    expect(first.score).toBeGreaterThanOrEqual(70);
    expect(first.reasons.length).toBeGreaterThan(0);
    expect(second.habitation.id).toBe('h2');
    expect(second.phase).toBe('monitoring');
  });
  it('assigns middle phases for partial risk', () => {
    const mid = { ...safe, id: 'h3', past_incidents: 4, kutcha_share: 60, vulnerable_count: 1500 };
    const [out] = prioritizeHabitations([mid], [], []);
    // Exact: vuln round(0.3*15 + 0.6*15)=14, history 12+0=12 -> 26.
    expect(out.score).toBe(26);
    expect(out.phase).toBe('medium_term');
  });
  it('pins the exact phase boundaries 70 / 45 / 25', () => {
    const zoneOf = (id) => ({ id, name: id, status: 'active', intensity: 'extreme', latitude: 28.6, longitude: 77.2, radius_meters: 3000 });
    // 70 = exposure 45 + vuln 15 + history 10 -> immediate.
    const seventy = { id: 'h70', name: 'H70', latitude: 28.6, longitude: 77.2, population: 100, vulnerable_count: 100, kutcha_share: 0, red_zone_id: 'z', past_incidents: 0 };
    const near70 = [0, 1, 2, 3].map((i) => report(`n70-${i}`, 28.601 + i * 0.001, 77.201));
    const [o70] = prioritizeHabitations([seventy], [zoneOf('z')], near70);
    expect(o70.score).toBe(70);
    expect(o70.phase).toBe('immediate');
    // 45 = exposure 45 alone -> short_term.
    const fortyFive = { ...seventy, id: 'h45', vulnerable_count: 0 };
    const [o45] = prioritizeHabitations([fortyFive], [zoneOf('z')], []);
    expect(o45.score).toBe(45);
    expect(o45.phase).toBe('short_term');
    // 25 = history 15 + 10 alone -> medium_term.
    const twentyFive = { id: 'h25', name: 'H25', latitude: 20.0, longitude: 75.0, population: 100, vulnerable_count: 0, kutcha_share: 0, red_zone_id: null, past_incidents: 5 };
    const near25 = [0, 1, 2, 3].map((i) => report(`n25-${i}`, 20.001 + i * 0.001, 75.001));
    const [o25] = prioritizeHabitations([twentyFive], [], near25);
    expect(o25.score).toBe(25);
    expect(o25.phase).toBe('medium_term');
  });
  it('floors edge distance at zero inside an unlinked active zone', () => {
    const big = { id: 'rz-big', name: 'Big Zone', status: 'active', intensity: 'high', latitude: 28.6, longitude: 77.2, radius_meters: 20000 };
    const inside = { id: 'h-in', name: 'Inside Hamlet', latitude: 28.6, longitude: 77.2, population: 100, vulnerable_count: 0, kutcha_share: 0, red_zone_id: null, past_incidents: 0 };
    const [out] = prioritizeHabitations([inside], [big], []);
    // Exposure caps at 30 for proximity; the reason never prints a negative.
    expect(out.score).toBe(30);
    expect(out.score).toBeLessThanOrEqual(100);
    expect(out.reasons.join(' ')).not.toMatch(/-\d/);
    expect(out.reasons.some((r) => r.includes('Within 0.0 km'))).toBe(true);
  });
  it('scores unknown population as zero vulnerability with a verify reason', () => {
    const unknown = { id: 'h-u', name: 'Unmapped', latitude: 20.0, longitude: 75.0, population: 0, vulnerable_count: 0, kutcha_share: 0, red_zone_id: null, past_incidents: 0 };
    const [out] = prioritizeHabitations([unknown], [], []);
    expect(out.score).toBe(0);
    expect(out.phase).toBe('monitoring');
    expect(out.reasons).toContain('Population unrecorded — verify on the ground');
  });
});
