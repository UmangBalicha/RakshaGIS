/* Relocation intelligence engine (PS: red-zone identification, carrying-capacity
 * assessment, phased relocation prioritisation).
 *
 * All functions are pure and deterministic: given the same reports, zones and
 * habitations they always return the same scores, and every score ships with
 * human-readable reasons so SDMA planners can audit each decision.
 */
import { haversineMeters } from './utils.js';

const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const INTENSITY_WEIGHT = { low: 10, moderate: 22, high: 34, extreme: 45 };
const KEY_AMENITIES = ['water', 'food', 'medical', 'bedding', 'power', 'comms'];

/** Reports that still signal live or recent threat (dormant history excluded). */
export function liveReports(reports) {
  return reports.filter((r) => r.status !== 'resolved' && r.status !== 'false_alarm');
}

/* ---------------- Red-zone scoring ---------------- */

/**
 * Score a red zone 0–100 from evidence. Weights: disaster history 40,
 * worst severity 30, recent activity 20, exposed population 10.
 */
export function scoreRedZone({ incidentCount = 0, maxSeverity = 'low', recentCount = 0, populationExposed = 0 } = {}) {
  const history = Math.min(1, incidentCount / 6) * 40;
  // Severity describes recorded incidents — with zero incidents it adds nothing.
  const severity = incidentCount > 0 ? ((SEVERITY_RANK[maxSeverity] ?? 1) / 4) * 30 : 0;
  const recency = Math.min(1, recentCount / 3) * 20;
  const exposure = Math.min(1, populationExposed / 5000) * 10;
  const score = Math.round(history + severity + recency + exposure);
  return { score, band: intensityBand(score) };
}

/** Map a 0–100 score to an intensity band. */
export function intensityBand(score) {
  if (score >= 75) return 'extreme';
  if (score >= 55) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

/**
 * Dynamically identify red-zone candidates by clustering live incident
 * reports: any group of >= minIncidents reports within clusterKm of each
 * other becomes a candidate centred on the group centroid.
 */
export function identifyRedZoneCandidates(reports, { minIncidents = 2, clusterKm = 5 } = {}) {
  const live = liveReports(reports);
  const radiusM = clusterKm * 1000;
  const assigned = new Set();
  const candidates = [];

  for (const seed of live) {
    if (assigned.has(seed.id)) continue;
    const group = live.filter(
      (r) => !assigned.has(r.id) && haversineMeters(seed.latitude, seed.longitude, r.latitude, r.longitude) <= radiusM,
    );
    if (group.length < minIncidents) continue;
    group.forEach((r) => assigned.add(r.id));

    const lat = group.reduce((s, r) => s + r.latitude, 0) / group.length;
    const lng = group.reduce((s, r) => s + r.longitude, 0) / group.length;
    const spread = Math.max(...group.map((r) => haversineMeters(lat, lng, r.latitude, r.longitude)));
    const hazards = [...new Set(group.map((r) => r.disaster_type))];
    const counts = new Map();
    group.forEach((r) => counts.set(r.disaster_type, (counts.get(r.disaster_type) ?? 0) + 1));
    const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const worst = group
      .map((r) => r.severity)
      .sort((a, b) => (SEVERITY_RANK[b] ?? 0) - (SEVERITY_RANK[a] ?? 0))[0];

    candidates.push({
      latitude: lat,
      longitude: lng,
      radius_meters: Math.round(spread + 1000),
      report_ids: group.map((r) => r.id),
      incident_count: group.length,
      hazard_types: hazards,
      dominant_hazard: dominant,
      max_severity: worst,
    });
  }
  return candidates.sort((a, b) => b.incident_count - a.incident_count);
}

/* ---------------- Site suitability & carrying capacity ---------------- */

/** Nearest active red zone to a site (edge-to-edge distance, metres). */
export function nearestRedZone(site, redZones = []) {
  let best = null;
  for (const z of redZones) {
    if (z.status !== 'active') continue;
    const d =
      haversineMeters(site.latitude, site.longitude, z.latitude, z.longitude) - (z.radius_meters ?? 0);
    if (!best || d < best.distance_meters) best = { zone: z, distance_meters: Math.max(0, Math.round(d)) };
  }
  return best;
}

/**
 * Assess a relocation site 0–100: amenities 40, infrastructure access 30,
 * capacity headroom 20, separation from red zones 10. Grade A (≥80) → D.
 */
export function assessSiteSuitability(site, redZones = []) {
  const factors = [];
  const amenities = site.amenities ?? [];
  const amenityPts = Math.round((KEY_AMENITIES.filter((a) => amenities.includes(a)).length / KEY_AMENITIES.length) * 40);
  factors.push({ label: 'Amenities on site', points: amenityPts, max: 40 });

  const accesses = [site.water_access, site.road_access, site.health_access, site.school_access].filter(Boolean).length;
  const accessPts = Math.round((accesses / 4) * 30);
  factors.push({ label: 'Water / road / health / school access', points: accessPts, max: 30 });

  let headroomPts;
  if (site.capacity == null) {
    headroomPts = 10;
    factors.push({ label: 'Capacity unknown — verify before allocating', points: headroomPts, max: 20 });
  } else {
    const ratio = site.capacity === 0 ? 0 : Math.max(0, carryingGap(site) / site.capacity);
    headroomPts = Math.round(Math.min(1, ratio) * 20);
    factors.push({ label: 'Spare carrying capacity', points: headroomPts, max: 20 });
  }

  const near = nearestRedZone(site, redZones);
  const sepPts = !near ? 10 : near.distance_meters >= 10000 ? 10 : near.distance_meters >= 5000 ? 7 : near.distance_meters >= 2000 ? 4 : 0;
  factors.push({
    label: near ? `Nearest red zone ${Math.round(near.distance_meters / 1000)} km away` : 'No active red zones nearby',
    points: sepPts,
    max: 10,
  });

  const score = amenityPts + accessPts + headroomPts + sepPts;
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  return { score, grade, factors };
}

/**
 * Remaining carrying capacity: capacity minus everyone already there
 * (sheltered + allocated for relocation). Null when capacity is unknown;
 * negative means the site is over capacity.
 */
export function carryingGap(site) {
  if (site.capacity == null) return null;
  return site.capacity - (site.current_occupancy ?? 0) - (site.allocated_population ?? 0);
}

/* ---------------- Habitation prioritisation ---------------- */

/**
 * Rank habitations for relocation. Score = exposure 45 + vulnerability 30 +
 * history 25. Phases: ≥70 immediate, ≥45 short-term, ≥25 medium-term,
 * otherwise monitoring. Every entry carries reasons for the file.
 */
export function prioritizeHabitations(habitations, redZones = [], reports = []) {
  const live = liveReports(reports);
  const active = redZones.filter((z) => z.status === 'active');

  const ranked = habitations.map((h) => {
    const reasons = [];

    // Exposure (45): inside / near an active red zone, else nearest distance.
    let exposure = 0;
    const linked = h.red_zone_id ? active.find((z) => z.id === h.red_zone_id) : null;
    const inZone = linked
      ? haversineMeters(h.latitude, h.longitude, linked.latitude, linked.longitude) <= (linked.radius_meters ?? 0)
      : false;
    if (linked && inZone) {
      exposure = INTENSITY_WEIGHT[linked.intensity] ?? 10;
      reasons.push(`Inside ${linked.intensity} red zone “${linked.name}”`);
    } else {
      let best = null;
      for (const z of active) {
        const d = haversineMeters(h.latitude, h.longitude, z.latitude, z.longitude) - (z.radius_meters ?? 0);
        if (best === null || d < best) best = d;
      }
      if (best !== null && best <= 10000) {
        exposure = Math.round(30 * (1 - best / 10000));
        reasons.push(`Within ${(best / 1000).toFixed(1)} km of an active red zone`);
      }
    }

    // Vulnerability (30): fragile residents + fragile housing.
    const pop = h.population > 0 ? h.population : 0;
    const vulnShare = pop > 0 ? Math.min(1, (h.vulnerable_count ?? 0) / pop) : 0.5;
    const kutcha = Math.min(100, Math.max(0, h.kutcha_share ?? 0)) / 100;
    const vulnerability = Math.round(vulnShare * 15 + kutcha * 15);
    if (vulnShare >= 0.25) reasons.push(`${Math.round(vulnShare * 100)}% elderly / children / disabled residents`);
    if (kutcha >= 0.4) reasons.push(`${Math.round(kutcha * 100)}% kutcha (fragile) housing`);

    // History (25): past incidents + nearby live reports.
    const nearby = live.filter((r) => haversineMeters(h.latitude, h.longitude, r.latitude, r.longitude) <= 8000).length;
    const history = Math.round(Math.min(1, (h.past_incidents ?? 0) / 5) * 15 + Math.min(1, nearby / 4) * 10);
    if ((h.past_incidents ?? 0) > 0) reasons.push(`${h.past_incidents} past incident(s) on record`);
    if (nearby > 0) reasons.push(`${nearby} live report(s) within 8 km`);

    const score = exposure + vulnerability + history;
    const phase = score >= 70 ? 'immediate' : score >= 45 ? 'short_term' : score >= 25 ? 'medium_term' : 'monitoring';
    if (reasons.length === 0) reasons.push('No acute risk factors — routine monitoring');
    return { habitation: h, score, phase, reasons };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
