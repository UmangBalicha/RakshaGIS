/* Shared domain types for RakshaGIS (all-hazards disaster platform). */
export const DISASTER_TYPES = [
    'earthquake',
    'flood',
    'wildfire',
    'cyclone',
    'landslide',
    'tsunami',
    'building_fire',
    'industrial',
    'chemical',
    'volcanic',
    'other',
];
export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];
export const SAFE_ZONE_TYPES = [
    'shelter',
    'hospital',
    'open_ground',
    'relief_camp',
    'school',
    'other',
];

/* ---- Red zones & relocation (PS: hazard-based red zones, carrying capacity,
   phased relocation of vulnerable habitations) ---- */

/** Hazard intensity bands for red zones (ordered low → extreme). */
export const RED_ZONE_INTENSITIES = ['low', 'moderate', 'high', 'extreme'];

/** Lifecycle of a red zone: active (no habitation) → monitoring → denotified. */
export const RED_ZONE_STATUSES = ['active', 'monitoring', 'denotified'];

/** Settlement kinds tracked for relocation planning. */
export const HABITATION_TYPES = ['village', 'town', 'ward'];

/** Relocation urgency phases, ordered most → least urgent. */
export const RELOCATION_PHASES = ['immediate', 'short_term', 'medium_term', 'monitoring'];
