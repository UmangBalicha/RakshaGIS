import { Activity, Building2, Droplets, Factory, Flame, FlaskConical, GraduationCap, HeartPulse, Home, MapPin, Mountain, MountainSnow, Siren, Tent, Trees, Waves, Wind, } from 'lucide-react';
/** Minimal classnames joiner (no external dep). */
export function cn(...parts) {
    return parts.filter(Boolean).join(' ');
}
export const SEVERITY_META = {
    low: {
        label: 'Low',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
        soft: 'bg-emerald-50 text-emerald-700',
    },
    medium: {
        label: 'Medium',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800 ring-amber-200',
        soft: 'bg-amber-50 text-amber-700',
    },
    high: {
        label: 'High',
        dot: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-800 ring-orange-200',
        soft: 'bg-orange-50 text-orange-700',
    },
    critical: {
        label: 'Critical',
        dot: 'bg-red-600',
        badge: 'bg-red-100 text-red-800 ring-red-200',
        soft: 'bg-red-50 text-red-700',
    },
};
export const STATUS_META = {
    pending: { label: 'Pending', badge: 'bg-slate-200 text-slate-800 ring-slate-300' },
    investigating: { label: 'Investigating', badge: 'bg-blue-100 text-blue-800 ring-blue-200' },
    contained: { label: 'Contained', badge: 'bg-violet-100 text-violet-800 ring-violet-200' },
    resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
    false_alarm: { label: 'False alarm', badge: 'bg-slate-100 text-slate-500 ring-slate-200' },
};
export const DISASTER_TYPE_META = {
    earthquake: { label: 'Earthquake', hint: 'Tremors / building damage', Icon: Activity },
    flood: { label: 'Flood', hint: 'Waterlogging / overflowing rivers', Icon: Droplets },
    wildfire: { label: 'Wildfire', hint: 'Forest / hillside fire', Icon: Flame },
    cyclone: { label: 'Cyclone / Storm', hint: 'High winds / heavy rain', Icon: Wind },
    landslide: { label: 'Landslide', hint: 'Slope failure / debris', Icon: Mountain },
    tsunami: { label: 'Tsunami', hint: 'Coastal wave threat', Icon: Waves },
    building_fire: { label: 'Building Fire', hint: 'Home / shop / office', Icon: Building2 },
    industrial: { label: 'Industrial Accident', hint: 'Factory / plant mishap', Icon: Factory },
    chemical: { label: 'Chemical Leak', hint: 'Hazmat / gas leak', Icon: FlaskConical },
    volcanic: { label: 'Volcanic Activity', hint: 'Ash / lava threat', Icon: MountainSnow },
    other: { label: 'Other Emergency', hint: 'Collapse, accident, etc.', Icon: Siren },
};
export const SAFE_ZONE_TYPE_META = {
    shelter: { label: 'Shelter', Icon: Home },
    hospital: { label: 'Hospital', Icon: HeartPulse },
    open_ground: { label: 'Open Ground', Icon: Trees },
    relief_camp: { label: 'Relief Camp', Icon: Tent },
    school: { label: 'School Shelter', Icon: GraduationCap },
    other: { label: 'Other Safe Point', Icon: MapPin },
};
export const AMENITY_LABELS = {
    water: 'Drinking water',
    food: 'Food',
    medical: 'Medical aid',
    bedding: 'Bedding',
    power: 'Power / charging',
    comms: 'Comms / helpline',
};
export const RED_ZONE_INTENSITY_META = {
    low: { label: 'Low', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
    moderate: { label: 'Moderate', badge: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
    high: { label: 'High', badge: 'bg-orange-100 text-orange-800 ring-orange-200', dot: 'bg-orange-500' },
    extreme: { label: 'Extreme', badge: 'bg-red-100 text-red-800 ring-red-200', dot: 'bg-red-600' },
};
export const RED_ZONE_STATUS_META = {
    active: { label: 'Active — no habitation', badge: 'bg-red-100 text-red-800 ring-red-200' },
    monitoring: { label: 'Monitoring', badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
    denotified: { label: 'Denotified', badge: 'bg-slate-200 text-slate-600 ring-slate-300' },
};
export const RELOCATION_PHASE_META = {
    immediate: { label: 'Immediate', badge: 'bg-red-600 text-white ring-red-700' },
    short_term: { label: 'Short-term', badge: 'bg-orange-100 text-orange-800 ring-orange-200' },
    medium_term: { label: 'Medium-term', badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
    monitoring: { label: 'Monitoring', badge: 'bg-slate-200 text-slate-600 ring-slate-300' },
};
export const SUITABILITY_GRADE_META = {
    A: { label: 'Grade A', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
    B: { label: 'Grade B', badge: 'bg-blue-100 text-blue-800 ring-blue-200' },
    C: { label: 'Grade C', badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
    D: { label: 'Grade D', badge: 'bg-red-100 text-red-800 ring-red-200' },
};
export function formatDateTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function timeAgo(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then))
        return '';
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)
        return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30)
        return `${days}d ago`;
    return formatDateTime(iso);
}
/**
 * Reverse-geocode via OpenStreetMap Nominatim. Never throws —
 * falls back to a lat/lng string when offline or rate-limited.
 */
export async function reverseGeocode(lat, lng) {
    try {
        const ctrl = new AbortController();
        const timer = window.setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        window.clearTimeout(timer);
        if (!res.ok)
            throw new Error('geocode failed');
        const data = (await res.json());
        if (data.display_name) {
            const parts = data.display_name.split(',').slice(0, 4).join(',').trim();
            return parts || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
        throw new Error('no address');
    }
    catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}
/** Suggest an initial severity from report fields (authority can override). */
export function suggestSeverity(input) {
    if (input.has_injuries)
        return 'critical';
    switch (input.disaster_type) {
        case 'earthquake':
        case 'tsunami':
        case 'cyclone':
            return 'critical';
        case 'flood':
        case 'landslide':
        case 'wildfire':
        case 'industrial':
        case 'chemical':
            return 'high';
        case 'building_fire':
        case 'volcanic':
            return 'medium';
        default:
            return 'low';
    }
}
/** Danger-zone radius drawn around an incident, driven by severity. */
export function dangerRadiusMeters(severity) {
    switch (severity) {
        case 'critical':
            return 2000;
        case 'high':
            return 1500;
        case 'medium':
            return 1000;
        default:
            return 500;
    }
}
/** Great-circle distance in meters (haversine). */
export function haversineMeters(aLat, aLng, bLat, bLng) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}
export function formatDistance(meters) {
    if (meters < 1000)
        return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}
export function formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 60)
        return `${mins} min`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
}
/**
 * Universal navigation URL. On mobile it opens the Google Maps app directly
 * in turn-by-turn navigation mode (3D perspective view); on desktop it opens
 * the route preview in the browser. No API key needed.
 * Omit the origin to navigate from the device's live GPS position.
 */
export function googleNavUrl(destLat, destLng, origin, mode = 'driving') {
    const dest = `${destLat},${destLng}`;
    const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=${mode}`;
    if (!origin)
        return base;
    return `${base}&origin=${encodeURIComponent(`${origin.lat},${origin.lng}`)}`;
}
