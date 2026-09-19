/* Map tile providers.
 * Default: OpenStreetMap (free, no key, works offline-first demo).
 * With VITE_MAPMYINDIA_KEY set: loads the MapmyIndia/Mappls SDK, which
 * serves official Government of India map boundaries (correct J&K, Ladakh,
 * Arunachal Pradesh) as required for digital maps published in India.
 * Free for dev/testing — sign up at https://www.mapmyindia.com/api/signup
 */

export interface TileProvider {
  url: string;
  attribution: string;
  isIndian: boolean;
}

const OSM: TileProvider = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  isIndian: false,
};

const MAPPLS: TileProvider = {
  // Served through the Mappls advanced-maps gateway (requires the SDK key).
  url: 'https://api.mappls.com/advancedmaps/v1/{key}/tile/{z}/{x}/{y}',
  attribution: '&copy; <a href="https://about.mappls.com/">MapmyIndia</a>',
  isIndian: true,
};

export function mapmyIndiaKey(): string | null {
  const raw = import.meta.env.VITE_MAPMYINDIA_KEY;
  const key = typeof raw === 'string' ? raw.trim() : '';
  return key.length > 0 ? key : null;
}

/** Concrete tile layer config for the current environment (key or fallback). */
export function getMapTiles(): TileProvider {
  const key = mapmyIndiaKey();
  if (!key) return OSM;
  return { ...MAPPLS, url: MAPPLS.url.replace('{key}', key) };
}

/**
 * Dynamically load the Mappls advanced-maps SDK once. After it loads,
 * `L.MapmyIndia.tiles()` becomes available for fully official rendering.
 * Resolves true on success, false on failure (caller keeps OSM fallback).
 */
export function loadMapmyIndiaSDK(key: string): Promise<boolean> {
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
    } catch {
      resolve(false);
    }
  });
}
