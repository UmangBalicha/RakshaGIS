import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { toast } from 'sonner';
import { useWideScreen } from '../../lib/hooks';
import { Button } from '../ui';

export interface LatLng {
  lat: number;
  lng: number;
}

const DEFAULT_CENTER: LatLng = { lat: 22.5, lng: 79.0 }; // Central India fallback

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], Math.max(map.getZoom(), 13));
  }, [map, center]);
  return null;
}

/** Keep tiles correct across fold/unfold, rotation and toolbar changes. */
function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const el = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

const pinIcon = L.divIcon({
  className: '',
  html: '<div class="rg-marker" style="width:30px;height:30px;background:#dc2626"><div style="width:10px;height:10px;border-radius:9999px;background:#fff"></div></div>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  const [locating, setLocating] = useState(false);
  const autoTried = useRef(false);

  const locateMe = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error('Geolocation is not supported by this browser.');
      return;
    }
    if (!silent) toast.info('Fetching your GPS location…');
    else setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!silent) toast.success('Location pinned from GPS.');
      },
      () => {
        setLocating(false);
        if (!silent) toast.error('Could not get GPS location. Please tap the map instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Auto-detect GPS once on mount so reporting starts at the user's area.
  useEffect(() => {
    if (autoTried.current || value) return;
    autoTried.current = true;
    locateMe(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center = value ?? DEFAULT_CENTER;
  const allowScrollZoom = useWideScreen();

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-slate-200" style={{ height: '280px' }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 14 : 11}
          scrollWheelZoom={allowScrollZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <InvalidateOnResize />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value ? <Recenter center={value} /> : null}
          {value ? (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const m = e.target as L.Marker;
                  const ll = m.getLatLng();
                  onChange({ lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          ) : null}
        </MapContainer>
        {locating ? (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-label="Loading" />
              <p className="mt-2 px-4 text-sm font-bold text-slate-700">Finding your location…</p>
              <p className="mt-0.5 px-4 text-xs text-slate-500">Keep GPS on — or tap the map to drop a pin.</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="md" onClick={() => locateMe(false)} disabled={locating}>
          {locating ? 'Detecting your location…' : value ? 'Re-center on me' : 'Use my current location'}
        </Button>
        <p className="text-sm text-slate-500">
          {value
            ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)} — tap map or drag pin to adjust.`
            : 'Tap anywhere on the map to drop a pin at the incident location.'}
        </p>
      </div>
    </div>
  );
}
