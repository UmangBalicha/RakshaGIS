/* Shared domain types for RakshaGIS (all-hazards disaster platform). */

export type Role = 'public' | 'admin';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus =
  | 'pending'
  | 'investigating'
  | 'contained'
  | 'resolved'
  | 'false_alarm';

export type DisasterType =
  | 'earthquake'
  | 'flood'
  | 'wildfire'
  | 'cyclone'
  | 'landslide'
  | 'tsunami'
  | 'building_fire'
  | 'industrial'
  | 'chemical'
  | 'volcanic'
  | 'other';

export const DISASTER_TYPES: DisasterType[] = [
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

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface DisasterReport {
  id: string;
  reporter_id: string | null;
  reporter_name: string;
  latitude: number;
  longitude: number;
  address: string;
  disaster_type: DisasterType;
  severity: Severity;
  status: ReportStatus;
  description: string;
  has_injuries: boolean;
  injury_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface AlertLog {
  id: string;
  report_id: string | null;
  severity: Severity;
  message: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string | null;
  report_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NewReportInput {
  latitude: number;
  longitude: number;
  address: string;
  disaster_type: DisasterType;
  description: string;
  has_injuries: boolean;
  injury_count: number;
  images: string[];
}

export interface ReportFilters {
  query: string;
  severity: Severity | 'all';
  status: ReportStatus | 'all';
  disasterType: DisasterType | 'all';
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

/* ---------------- Safe zones (evacuation destinations) ---------------- */

export type SafeZoneType =
  | 'shelter'
  | 'hospital'
  | 'open_ground'
  | 'relief_camp'
  | 'school'
  | 'other';

export const SAFE_ZONE_TYPES: SafeZoneType[] = [
  'shelter',
  'hospital',
  'open_ground',
  'relief_camp',
  'school',
  'other',
];

export interface SafeZone {
  id: string;
  name: string;
  type: SafeZoneType;
  latitude: number;
  longitude: number;
  address: string;
  capacity: number | null;
  current_occupancy: number;
  amenities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewSafeZoneInput {
  name: string;
  type: SafeZoneType;
  latitude: number;
  longitude: number;
  address: string;
  capacity: number | null;
  amenities: string[];
  is_active: boolean;
}

/* ---------------- Evacuation routing ---------------- */

export type TravelProfile = 'driving' | 'walking';

export interface RouteStep {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
}

export interface EvacuationRoute {
  safe_zone_id: string;
  safe_zone_name: string;
  distance_meters: number;
  duration_seconds: number;
  geometry: Array<[number, number]>; // [lat, lng] pairs for the polyline
  steps: RouteStep[];
  profile: TravelProfile;
  /** True when this is a straight-line / estimated fallback, not a live OSRM road route. */
  is_estimate: boolean;
}
