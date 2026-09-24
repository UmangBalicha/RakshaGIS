/* Map tile providers.
 * Default: CARTO basemaps (same OpenStreetMap data, served over a CDN built
 * for apps). tile.openstreetmap.org is donation-funded and its usage policy
 * forbids heavy application traffic, so it must NOT be the default for a
 * production user base — CARTO's free tier exists precisely for this.
 * With VITE_MAPMYINDIA_KEY set: loads the MapmyIndia/Mappls SDK, which
 * serves official Government of India map boundaries (correct J&K, Ladakh,
 * Arunachal Pradesh) as required for digital maps published in India.
 * Free for dev/testing — sign up at https://www.mapmyindia.com/api/signup
 */
const CARTO = {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    isIndian: false,
};
const MAPPLS = {
    // Served through the Mappls advanced-maps gateway (requires the SDK key).
    url: 'https://api.mappls.com/advancedmaps/v1/{key}/tile/{z}/{x}/{y}',
    attribution: '&copy; <a href="https://about.mappls.com/">MapmyIndia</a>',
    isIndian: true,
};
export function mapmyIndiaKey() {
    const raw = import.meta.env.VITE_MAPMYINDIA_KEY;
    const key = typeof raw === 'string' ? raw.trim() : '';
    return key.length > 0 ? key : null;
}
/** Concrete tile layer config for the current environment (key or fallback). */
export function getMapTiles() {
    const key = mapmyIndiaKey();
    if (!key)
        return CARTO;
    return { ...MAPPLS, url: MAPPLS.url.replace('{key}', key) };
}
/**
 * Dynamically load the Mappls advanced-maps SDK once. After it loads,
 * `L.MapmyIndia.tiles()` becomes available for fully official rendering.
 * Resolves true on success, false on failure (caller keeps CARTO fallback).
 */
export function loadMapmyIndiaSDK(key) {
    return new Promise((resolve) => {
        try {
            if (document.querySelector('script[data-mappls]')) {
                resolve(true);
                return;
            }
            const s = document.createElement('script');
            s.src = `https://apis.mapmyindia.com/advancedmaps/v1/${encodeURIComponent(key)}/map_load?v=1.5`;
            s.async = true;
            s.setAttribute('data-mappls', '1');
            s.onload = () => resolve(true);
            s.onerror = () => resolve(false);
            document.head.appendChild(s);
            // Safety timeout — don't hang the map on a blocked CDN.
            window.setTimeout(() => resolve(false), 8000);
        }
        catch {
            resolve(false);
        }
    });
}
