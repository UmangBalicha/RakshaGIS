import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, MapPin, Plus, Sparkles } from 'lucide-react';
import { createRedZone, deleteRedZone, updateRedZone } from '../../lib/api';
import { identifyRedZoneCandidates, scoreRedZone } from '../../lib/intelligence';
import { DISASTER_TYPE_META, RED_ZONE_INTENSITY_META, RED_ZONE_STATUS_META, cn, formatDateTime } from '../../lib/utils';
import { DISASTER_TYPES, RED_ZONE_INTENSITIES, RED_ZONE_STATUSES } from '../../lib/types';
import { useReportStore } from '../../stores/reportStore';
import { useLiveReports } from '../../lib/hooks';
import { Badge, Button, Card, CardContent, EmptyState, Input, Label, Modal, Select, Spinner, Textarea } from '../../components/ui';
import IncidentMap from '../../components/map/IncidentMap';

const redPin = L.divIcon({
  className: '',
  html: '<div class="rg-marker" style="width:24px;height:24px;background:#b91c1c"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ZoneClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const EMPTY_FORM = {
  name: '',
  hazard_types: ['flood'],
  latitude: '',
  longitude: '',
  radius_meters: '3000',
  intensity: 'high',
  status: 'active',
  incident_count: '',
  population_exposed: '',
  notes: '',
};

function RedZoneForm({ initial, saving, reports, onSubmit }) {
  const [form, setForm] = useState(initial);
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const validCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const toggleHazard = (t) => {
    setForm((f) => ({
      ...f,
      hazard_types: f.hazard_types.includes(t)
        ? f.hazard_types.filter((x) => x !== t)
        : [...f.hazard_types, t],
    }));
  };

  // Evidence score from live reports inside the drawn radius.
  const evidence = useMemo(() => {
    if (!validCoords) return null;
    const radius = Math.max(0, Number(form.radius_meters) || 0);
    const inside = reports.filter(
      (r) =>
        r.status !== 'resolved' &&
        r.status !== 'false_alarm' &&
        Math.hypot(r.latitude - lat, r.longitude - lng) * 111000 <= radius,
    );
    if (inside.length === 0) return { score: 0, band: 'low', count: 0 };
    const rank = { low: 1, medium: 2, high: 3, critical: 4 };
    const worst = inside.map((r) => r.severity).sort((a, b) => (rank[b] ?? 0) - (rank[a] ?? 0))[0];
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = inside.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;
    const { score, band } = scoreRedZone({
      incidentCount: inside.length,
      maxSeverity: worst,
      recentCount: recent,
      populationExposed: Number(form.population_exposed) || 0,
    });
    return { score, band, count: inside.length };
  }, [form.radius_meters, form.population_exposed, reports, validCoords, lat, lng]);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('Please name the red zone.');
      return;
    }
    if (form.hazard_types.length === 0) {
      toast.error('Pick at least one hazard type.');
      return;
    }
    if (!validCoords) {
      toast.error('Tap the map to set a valid location.');
      return;
    }
    onSubmit({
      name: form.name.trim(),
      hazard_types: form.hazard_types,
      latitude: lat,
      longitude: lng,
      radius_meters: Math.max(500, Number(form.radius_meters) || 3000),
      intensity: form.intensity,
      status: form.status,
      incident_count: Math.max(0, Number(form.incident_count) || 0),
      last_incident_at: new Date().toISOString(),
      population_exposed: Math.max(0, Number(form.population_exposed) || 0),
      notes: form.notes.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rz-name" required>Name</Label>
        <Input
          id="rz-name"
          placeholder="e.g. Mallital Landslide Cradle"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <Label required>Hazards present in this zone</Label>
        <div className="flex flex-wrap gap-1.5">
          {DISASTER_TYPES.map((t) => {
            const on = form.hazard_types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleHazard(t)}
                aria-pressed={on}
                className={cn(
                  'min-h-[44px] cursor-pointer touch-manipulation rounded-lg border-2 px-3 py-2 text-xs font-bold',
                  on ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                )}
              >
                {DISASTER_TYPE_META[t].label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label required>Location — tap the map to place the centre</Label>
        <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height: '260px' }}>
          <MapContainer
            center={validCoords ? [lat, lng] : [26.5, 79.5]}
            zoom={validCoords ? 12 : 5}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoneClickPicker onPick={(la, ln) => setForm((f) => ({ ...f, latitude: String(la.toFixed(6)), longitude: String(ln.toFixed(6)) }))} />
            {validCoords ? <Marker position={[lat, lng]} icon={redPin} /> : null}
          </MapContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="rz-radius">Radius (metres)</Label>
          <Input
            id="rz-radius"
            type="number"
            min={500}
            value={form.radius_meters}
            onChange={(e) => setForm({ ...form, radius_meters: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="rz-intensity">Intensity</Label>
          <Select id="rz-intensity" value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}>
            {RED_ZONE_INTENSITIES.map((s) => (
              <option key={s} value={s}>{RED_ZONE_INTENSITY_META[s].label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="rz-status">Status</Label>
          <Select id="rz-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {RED_ZONE_STATUSES.map((s) => (
              <option key={s} value={s}>{RED_ZONE_STATUS_META[s].label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="rz-pop">Exposed population</Label>
          <Input
            id="rz-pop"
            type="number"
            min={0}
            placeholder="e.g. 4200"
            value={form.population_exposed}
            onChange={(e) => setForm({ ...form, population_exposed: e.target.value })}
          />
        </div>
      </div>
      {evidence ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm ring-1 ring-red-200 ring-inset">
          <p className="font-semibold text-slate-700">
            Evidence score <strong className="text-red-700">{evidence.score}/100 → {RED_ZONE_INTENSITY_META[evidence.band].label}</strong>
            {' '}({evidence.count} live report{evidence.count === 1 ? '' : 's'} in radius)
          </p>
          <Button variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, intensity: evidence.band, incident_count: String(evidence.count) }))}>
            <Sparkles className="h-4 w-4" /> Apply suggestion
          </Button>
        </div>
      ) : null}
      <div>
        <Label htmlFor="rz-notes">Planner notes (optional)</Label>
        <Textarea
          id="rz-notes"
          placeholder="Why this area is unfit for habitation, past losses, next review…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <Button className="w-full" size="lg" disabled={saving} onClick={submit}>
        {saving ? 'Saving…' : 'Save red zone'}
      </Button>
    </div>
  );
}

export default function AdminRedZones() {
  useLiveReports();
  const redZones = useReportStore((s) => s.redZones);
  const reports = useReportStore((s) => s.reports);
  const loading = useReportStore((s) => s.loading);
  const refresh = useReportStore((s) => s.refresh);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidates = useMemo(
    () => (showCandidates ? identifyRedZoneCandidates(reports) : []),
    [showCandidates, reports],
  );

  const saveZone = async (input, id) => {
    setSaving(true);
    try {
      if (id) {
        await updateRedZone(id, input);
        toast.success('Red zone updated.');
      } else {
        await createRedZone(input);
        toast.success('Red zone declared.');
      }
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
      await deleteRedZone(confirmDelete.id);
      toast.success('Red zone removed.');
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const prefillFromCandidate = (c) => {
    setModal({
      mode: 'add',
      initial: {
        ...EMPTY_FORM,
        hazard_types: c.hazard_types,
        latitude: String(c.latitude.toFixed(6)),
        longitude: String(c.longitude.toFixed(6)),
        radius_meters: String(c.radius_meters),
        intensity: scoreRedZone({ incidentCount: c.incident_count, maxSeverity: c.max_severity, recentCount: c.incident_count }).band,
        incident_count: String(c.incident_count),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Red zones ({redZones.length})</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Multi-hazard areas unfit for permanent habitation — identified from live evidence, updated as incidents evolve.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowCandidates((v) => !v)} aria-expanded={showCandidates}>
            <Sparkles className="h-4 w-4" /> {showCandidates ? 'Hide auto-detect' : 'Auto-detect from incidents'}
          </Button>
          <Button onClick={() => setModal({ mode: 'add', initial: EMPTY_FORM })}>
            <Plus className="h-4 w-4" /> Declare red zone
          </Button>
        </div>
      </div>

      {showCandidates ? (
        <Card>
          <CardContent>
            {candidates.length === 0 ? (
              <EmptyState
                title="No clusters found"
                hint="Auto-detect groups 2+ live reports within 5 km. File more reports or lower the bar in code."
              />
            ) : (
              <div className="space-y-2">
                {candidates.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Candidate {i + 1} — {c.hazard_types.join(', ').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.incident_count} reports · worst {c.max_severity} · radius {(c.radius_meters / 1000).toFixed(1)} km
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => prefillFromCandidate(c)}>
                      <MapPin className="h-4 w-4" /> Create red zone
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-5">
          {loading && redZones.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : redZones.length === 0 ? (
            <EmptyState title="No red zones declared" hint="Use auto-detect or declare the first hazard zone manually." />
          ) : (
            <IncidentMap reports={[]} zones={[]} redZones={redZones} height="380px" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {redZones.length === 0 ? null : (
            <table className="w-full min-w-220 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Intensity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Exposed</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {redZones.map((z) => (
                  <tr key={z.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{z.name}</p>
                      <p className="max-w-56 truncate text-xs text-slate-400">
                        {(z.hazard_types || []).join(', ').replace(/_/g, ' ')} · {(z.radius_meters / 1000).toFixed(1)} km radius
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={RED_ZONE_INTENSITY_META[z.intensity].badge}>
                        {RED_ZONE_INTENSITY_META[z.intensity].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={RED_ZONE_STATUS_META[z.status].badge}>
                        {RED_ZONE_STATUS_META[z.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{z.incident_count} incidents</td>
                    <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">
                      {(z.population_exposed ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(z.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setModal({ mode: 'edit', zone: z })} className="min-h-[44px] cursor-pointer touch-manipulation rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">
                          Edit
                        </button>
                        <button type="button" onClick={() => setConfirmDelete(z)} className="min-h-[44px] cursor-pointer touch-manipulation rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit red zone' : 'Declare red zone'}
        wide
      >
        {modal ? (
          <RedZoneForm
            key={modal.mode === 'edit' ? modal.zone.id : 'new'}
            initial={
              modal.mode === 'edit'
                ? {
                    name: modal.zone.name,
                    hazard_types: modal.zone.hazard_types,
                    latitude: String(modal.zone.latitude),
                    longitude: String(modal.zone.longitude),
                    radius_meters: String(modal.zone.radius_meters),
                    intensity: modal.zone.intensity,
                    status: modal.zone.status,
                    incident_count: String(modal.zone.incident_count ?? 0),
                    population_exposed: String(modal.zone.population_exposed ?? 0),
                    notes: modal.zone.notes ?? '',
                  }
                : modal.initial
            }
            saving={saving}
            reports={reports}
            onSubmit={(i) => void saveZone(i, modal.mode === 'edit' ? modal.zone.id : null)}
          />
        ) : null}
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Remove red zone?">
        <p className="text-sm text-slate-600">
          This lifts the habitation ban on <strong>{confirmDelete?.name}</strong>. Linked habitations keep
          their records but lose the exposure flag until re-linked.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => void handleDelete()}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
