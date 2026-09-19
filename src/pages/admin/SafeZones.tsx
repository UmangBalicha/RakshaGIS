import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { createSafeZone, deleteSafeZone, updateSafeZone } from '../../lib/api';
import { AMENITY_LABELS, SAFE_ZONE_TYPE_META, cn, formatDateTime } from '../../lib/utils';
import { SAFE_ZONE_TYPES } from '../../lib/types';
import type { NewSafeZoneInput, SafeZone, SafeZoneType } from '../../lib/types';
import { useReportStore } from '../../stores/reportStore';
import { useLiveReports } from '../../lib/hooks';
import { Badge, Button, Card, CardContent, EmptyState, Input, Label, Modal, Select, Spinner } from '../../components/ui';

const AMENITIES = Object.keys(AMENITY_LABELS);

const zonePin = L.divIcon({
  className: '',
  html: '<div class="rg-marker" style="width:24px;height:24px;background:#16a34a"><div style="width:9px;height:9px;border-radius:9999px;background:#fff"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ZoneClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface ZoneFormState {
  name: string;
  type: SafeZoneType;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  amenities: string[];
  is_active: boolean;
}

const EMPTY_FORM: ZoneFormState = {
  name: '',
  type: 'shelter',
  address: '',
  latitude: '',
  longitude: '',
  capacity: '',
  amenities: ['water'],
  is_active: true,
};

function ZoneForm({
  initial,
  saving,
  onSubmit,
}: {
  initial: ZoneFormState;
  saving: boolean;
  onSubmit: (input: NewSafeZoneInput) => void;
}) {
  const [form, setForm] = useState<ZoneFormState>(initial);
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const validCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name for the safe zone.');
      return;
    }
    if (!validCoords) {
      toast.error('Tap the map to set a valid location.');
      return;
    }
    const cap = form.capacity.trim() === '' ? null : Math.max(0, Number(form.capacity) || 0);
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      latitude: lat,
      longitude: lng,
      address: form.address.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      capacity: cap,
      amenities: form.amenities,
      is_active: form.is_active,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="zone-name" required>Name</Label>
          <Input
            id="zone-name"
            placeholder="e.g. Nehru Stadium Relief Camp"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="zone-type">Type</Label>
          <Select id="zone-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SafeZoneType })}>
            {SAFE_ZONE_TYPES.map((t) => (
              <option key={t} value={t}>{SAFE_ZONE_TYPE_META[t].label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="zone-cap">Capacity (people, optional)</Label>
          <Input
            id="zone-cap"
            type="number"
            min={0}
            placeholder="e.g. 500"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="zone-addr">Address / landmark</Label>
          <Input
            id="zone-addr"
            placeholder="Road, area, city"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label required>Location — tap the map to place the pin</Label>
        <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height: '260px' }}>
          <MapContainer
            center={validCoords ? [lat, lng] : [26.5, 79.5]}
            zoom={validCoords ? 13 : 5}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoneClickPicker
              onPick={(la, ln) => setForm((f) => ({ ...f, latitude: String(la.toFixed(6)), longitude: String(ln.toFixed(6)) }))}
            />
            {validCoords ? <Marker position={[lat, lng]} icon={zonePin} /> : null}
          </MapContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Input
            placeholder="Latitude"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            aria-label="Latitude"
          />
          <Input
            placeholder="Longitude"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            aria-label="Longitude"
          />
        </div>
      </div>

      <div>
        <Label>Amenities available</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold',
                form.amenities.includes(a)
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50',
              )}
            >
              {AMENITY_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="h-4 w-4 accent-emerald-600"
        />
        Active — visible to citizens for evacuation
      </label>

      <Button className="w-full" size="lg" disabled={saving} onClick={submit}>
        {saving ? 'Saving…' : 'Save safe zone'}
      </Button>
    </div>
  );
}

export default function AdminSafeZones() {
  useLiveReports();
  const zones = useReportStore((s) => s.zones);
  const loading = useReportStore((s) => s.loading);
  const refresh = useReportStore((s) => s.refresh);

  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; zone: SafeZone }>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SafeZone | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (input: NewSafeZoneInput) => {
    setSaving(true);
    try {
      await createSafeZone(input);
      toast.success('Safe zone added.');
      setModal(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string, input: NewSafeZoneInput) => {
    setSaving(true);
    try {
      await updateSafeZone(id, input);
      toast.success('Safe zone updated.');
      setModal(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSafeZone(confirmDelete.id);
      toast.success('Safe zone deleted.');
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const toggleActive = async (z: SafeZone) => {
    try {
      await updateSafeZone(z.id, { is_active: !z.is_active });
      await refresh();
      toast.success(z.is_active ? 'Zone hidden from citizens.' : 'Zone is live for citizens.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update.');
    }
  };

  const editInitial = (z: SafeZone): ZoneFormState => ({
    name: z.name,
    type: z.type,
    address: z.address,
    latitude: String(z.latitude),
    longitude: String(z.longitude),
    capacity: z.capacity === null ? '' : String(z.capacity),
    amenities: z.amenities,
    is_active: z.is_active,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Safe zones ({zones.length})</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Shelters, hospitals and grounds citizens are routed to during evacuation.
          </p>
        </div>
        <Button onClick={() => setModal({ mode: 'add' })}>+ Add safe zone</Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          {loading && zones.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : zones.length === 0 ? (
            <EmptyState title="No safe zones yet" hint="Add the first shelter, hospital or open ground to enable evacuation routing." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height: '380px' }}>
              <MapContainer center={[28.5, 79.5]} zoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {zones.map((z) => (
                  <Marker key={z.id} position={[z.latitude, z.longitude]} icon={zonePin} opacity={z.is_active ? 1 : 0.45} />
                ))}
              </MapContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {zones.length === 0 ? null : (
            <table className="w-full min-w-220 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Occupancy</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const pct = z.capacity ? Math.min(100, Math.round((z.current_occupancy / z.capacity) * 100)) : null;
                  return (
                    <tr key={z.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{z.name}</p>
                        <p className="max-w-56 truncate text-[11px] text-slate-400">{z.address}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600">{SAFE_ZONE_TYPE_META[z.type].label}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{z.capacity ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">
                        {z.current_occupancy}{pct !== null ? ` (${pct}%)` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={z.is_active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300'}>
                          {z.is_active ? 'Active' : 'Hidden'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(z.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setModal({ mode: 'edit', zone: z })} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50">Edit</button>
                          <button type="button" onClick={() => void toggleActive(z)} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50">
                            {z.is_active ? 'Hide' : 'Show'}
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(z)} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit safe zone' : 'Add safe zone'}
        wide
      >
        {modal?.mode === 'add' ? (
          <ZoneForm initial={EMPTY_FORM} saving={saving} onSubmit={(i) => void handleAdd(i)} />
        ) : modal?.mode === 'edit' ? (
          <ZoneForm
            key={modal.zone.id}
            initial={editInitial(modal.zone)}
            saving={saving}
            onSubmit={(i) => void handleEdit(modal.zone.id, i)}
          />
        ) : null}
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete safe zone?">
        <p className="text-sm text-slate-600">
          This permanently removes <strong>{confirmDelete?.name}</strong>. Evacuation routes
          pointing here will fall back to the next-nearest zone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => void handleDelete()}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
