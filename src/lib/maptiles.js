/* Map tile providers.
 * Default: Esri World Light Gray (base + reference overlay). Keyless,
 * served over Esri's high-capacity CDN, muted light style that keeps
 * incident markers legible. tile.openstreetmap.org is donation-funded and
 * its usage policy forbids heavy application traffic; CARTO's anonymous
 * basemaps now render an "API KEY REQUIRED" watermark — so neither is a
 * valid default for a production user base.
 * With VITE_MAPMYINDIA_KEY set: loads the MapmyIndia/Mappls SDK, which
 * serves official Government of India map boundaries (correct J&K, Ladakh,
 * Arunachal Pradesh) as required for digital maps published in India.
 * Free for dev/testing — sign up at https://www.mapmyindia.com/api/signup
 */
const ESRI_GRAY = {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
        return ESRI_GRAY;
    return { ...MAPPLS, url: MAPPLS.url.replace('{key}', key) };
}
/**
 * Dynamically load the Mappls advanced-maps SDK once. After it loads,
 * `L.MapmyIndia.tiles()` becomes available for fully official rendering.
 * Resolves true on success, false on failure (caller keeps Esri fallback).
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
