import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ArrowRight, Home } from 'lucide-react';
import {
  createHabitation,
  deleteHabitation,
  updateHabitation,
  updateSafeZone,
} from '../../lib/api';
import {
  assessSiteSuitability,
  carryingGap,
  prioritizeHabitations,
} from '../../lib/intelligence';
import {
  RELOCATION_PHASE_META,
  SUITABILITY_GRADE_META,
  cn,
} from '../../lib/utils';
import { HABITATION_TYPES } from '../../lib/types';
import { useReportStore } from '../../stores/reportStore';
import { useLiveReports } from '../../lib/hooks';
import { getMapTiles } from '../../lib/maptiles';
import { Badge, Button, Card, CardContent, EmptyState, Input, Label, Modal, Select, Spinner, Stat, Textarea } from '../../components/ui';

const habPin = L.divIcon({
  className: '',
  html: '<div class="rg-marker" style="width:24px;height:24px;background:#7c3aed"><div style="width:9px;height:9px;border-radius:9999px;background:#fff"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function HabClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const PHASE_ORDER = ['immediate', 'short_term', 'medium_term', 'monitoring'];

const tiles = getMapTiles();

const EMPTY_HAB = {
  name: '',
  habitation_type: 'village',
  latitude: '',
  longitude: '',
  address: '',
  population: '',
  households: '',
  vulnerable_count: '',
  kutcha_share: '',
  red_zone_id: '',
  past_incidents: '',
  notes: '',
};

function HabitationForm({ initial, saving, redZones, onSubmit }) {
  const [form, setForm] = useState(initial);
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const validCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('Please name the habitation.');
      return;
    }
    if (!validCoords) {
      toast.error('Tap the map to set a valid location.');
      return;
    }
    const pop = Math.max(0, Number(form.population) || 0);
    if (pop <= 0) {
      toast.error('Enter the resident population.');
      return;
    }
    onSubmit({
      name: form.name.trim(),
      habitation_type: form.habitation_type,
      latitude: lat,
      longitude: lng,
      address: form.address.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      population: pop,
      households: Math.max(0, Number(form.households) || 0),
      vulnerable_count: Math.min(pop, Math.max(0, Number(form.vulnerable_count) || 0)),
      kutcha_share: Math.min(100, Math.max(0, Number(form.kutcha_share) || 0)),
      red_zone_id: form.red_zone_id || null,
      past_incidents: Math.max(0, Number(form.past_incidents) || 0),
      notes: form.notes.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="hab-name" required>Name</Label>
          <Input id="hab-name" placeholder="e.g. Rajpur Village" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-type">Settlement type</Label>
          <Select id="hab-type" value={form.habitation_type} onChange={(e) => setForm({ ...form, habitation_type: e.target.value })}>
            {HABITATION_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="hab-zone">Exposed red zone</Label>
          <Select id="hab-zone" value={form.red_zone_id} onChange={(e) => setForm({ ...form, red_zone_id: e.target.value })}>
            <option value="">None — assess by proximity</option>
            {redZones.filter((z) => z.status === 'active').map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="hab-addr">Address / landmark</Label>
          <Input id="hab-addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-past">Past incidents on record</Label>
          <Input id="hab-past" type="number" min={0} value={form.past_incidents} onChange={(e) => setForm({ ...form, past_incidents: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-pop" required>Population</Label>
          <Input id="hab-pop" type="number" min={1} value={form.population} onChange={(e) => setForm({ ...form, population: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-hh">Households</Label>
          <Input id="hab-hh" type="number" min={0} value={form.households} onChange={(e) => setForm({ ...form, households: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-vuln">Elderly / children / disabled</Label>
          <Input id="hab-vuln" type="number" min={0} value={form.vulnerable_count} onChange={(e) => setForm({ ...form, vulnerable_count: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="hab-kutcha">Kutcha housing (%)</Label>
          <Input id="hab-kutcha" type="number" min={0} max={100} value={form.kutcha_share} onChange={(e) => setForm({ ...form, kutcha_share: e.target.value })} />
        </div>
      </div>
      <div>
        <Label required>Location — tap the map</Label>
        <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height: '260px' }}>
          <MapContainer center={validCoords ? [lat, lng] : [26.5, 79.5]} zoom={validCoords ? 13 : 5} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution={tiles.attribution} url={tiles.url} />
            {tiles.overlayUrl ? <TileLayer url={tiles.overlayUrl} /> : null}
            <HabClickPicker onPick={(la, ln) => setForm((f) => ({ ...f, latitude: String(la.toFixed(6)), longitude: String(ln.toFixed(6)) }))} />
            {validCoords ? <Marker position={[lat, lng]} icon={habPin} /> : null}
          </MapContainer>
        </div>
      </div>
      <div>
        <Label htmlFor="hab-notes">Planner notes (optional)</Label>
        <Textarea id="hab-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button className="w-full" size="lg" disabled={saving} onClick={submit}>
        {saving ? 'Saving…' : 'Save habitation'}
      </Button>
    </div>
  );
}

function SiteCard({ site, redZones, onAllocate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { score, grade, factors } = useMemo(() => assessSiteSuitability(site, redZones), [site, redZones]);
  const gap = carryingGap(site);
  const gapPct = site.capacity ? Math.min(100, Math.max(0, Math.round(((site.capacity - (gap ?? 0)) / site.capacity) * 100))) : null;

  const openEdit = () => {
    setForm({
      is_relocation_site: site.is_relocation_site,
      water_access: site.water_access,
      road_access: site.road_access,
      health_access: site.health_access,
      school_access: site.school_access,
      allocated_population: String(site.allocated_population ?? 0),
    });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSafeZone(site.id, {
        is_relocation_site: form.is_relocation_site,
        water_access: form.water_access,
        road_access: form.road_access,
        health_access: form.health_access,
        school_access: form.school_access,
        allocated_population: Math.max(0, Number(form.allocated_population) || 0),
      });
      toast.success('Site assessment saved.');
      setEditing(false);
      onAllocate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{site.name}</p>
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{site.address}</p>
          </div>
          <Badge className={SUITABILITY_GRADE_META[grade].badge}>Suitability {grade} · {score}</Badge>
        </div>
        <div className="mt-3 space-y-1.5">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">{f.label}</span>
              <span className="font-bold text-slate-700 tabular-nums">{f.points}/{f.max}</span>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Carrying load</span>
            <span className="tabular-nums">
              {gap === null ? 'capacity unknown' : gap < 0 ? `OVER by ${(-gap).toLocaleString('en-IN')}` : `${gap.toLocaleString('en-IN')} places left`}
            </span>
          </div>
          {gapPct !== null ? (
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={cn('h-full rounded-full', gap !== null && gap < 0 ? 'bg-red-500' : gapPct >= 85 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${gapPct}%` }} />
            </div>
          ) : null}
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            Capacity {site.capacity?.toLocaleString('en-IN') ?? '—'} · sheltered {(site.current_occupancy ?? 0).toLocaleString('en-IN')} · allocated {(site.allocated_population ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        {editing && form ? (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.is_relocation_site} onChange={(e) => setForm({ ...form, is_relocation_site: e.target.checked })} className="h-5 w-5 accent-emerald-600" />
              Designated relocation site
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[['water_access', 'Water'], ['road_access', 'Road'], ['health_access', 'Health'], ['school_access', 'School']].map(([k, label]) => (
                <label key={k} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="h-5 w-5 accent-emerald-600" />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <Label htmlFor={`alloc-${site.id}`}>Population allocated for relocation</Label>
              <Input id={`alloc-${site.id}`} type="number" min={0} value={form.allocated_population} onChange={(e) => setForm({ ...form, allocated_population: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" className="flex-1" disabled={saving} onClick={() => void save()}>
                {saving ? 'Saving…' : 'Save assessment'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={openEdit}>
            Edit suitability & allocation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminRelocation() {
  useLiveReports();
  const habitations = useReportStore((s) => s.habitations);
  const redZones = useReportStore((s) => s.redZones);
  const zones = useReportStore((s) => s.zones);
  const reports = useReportStore((s) => s.reports);
  const loading = useReportStore((s) => s.loading);
  const refresh = useReportStore((s) => s.refresh);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queue = useMemo(
    () => prioritizeHabitations(habitations, redZones, reports),
    [habitations, redZones, reports],
  );
  const byPhase = useMemo(() => {
    const m = { immediate: [], short_term: [], medium_term: [], monitoring: [] };
    queue.forEach((q) => m[q.phase].push(q));
    return m;
  }, [queue]);
  const exposedPop = useMemo(
    () => queue.filter((q) => q.phase === 'immediate' || q.phase === 'short_term').reduce((s, q) => s + q.habitation.population, 0),
    [queue],
  );
  const sites = useMemo(() => zones.filter((z) => z.is_relocation_site), [zones]);

  const saveHab = async (input, id) => {
    setSaving(true);
    try {
      if (id) {
        await updateHabitation(id, input);
        toast.success('Habitation updated.');
      } else {
        await createHabitation(input);
        toast.success('Habitation added to watchlist.');
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
      await deleteHabitation(confirmDelete.id);
      toast.success('Habitation removed.');
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Relocation planner</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Phased relocation queue from live exposure, vulnerability and history — with carrying-capacity-checked destination sites.
          </p>
        </div>
        <Button onClick={() => setModal({ mode: 'add' })}>+ Add habitation</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Immediate" value={byPhase.immediate.length} accent="bg-red-600" sub="relocate now" />
        <Stat label="Short-term" value={byPhase.short_term.length} accent="bg-orange-500" sub="this season" />
        <Stat label="Medium-term" value={byPhase.medium_term.length} accent="bg-amber-500" sub="this year" />
        <Stat label="Monitoring" value={byPhase.monitoring.length} accent="bg-slate-400" sub="routine watch" />
        <Stat label="Priority population" value={exposedPop.toLocaleString('en-IN')} accent="bg-blue-500" sub="immediate + short-term" />
      </div>

      <Card>
        <CardContent className="pt-5">
          <h2 className="text-sm font-extrabold text-slate-900">Priority queue — highest risk first</h2>
          {loading && habitations.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : queue.length === 0 ? (
            <div className="mt-3"><EmptyState title="No habitations tracked" hint="Add villages, towns or wards to start the relocation queue." /></div>
          ) : (
            <ol className="mt-3 space-y-2">
              {queue.map(({ habitation: h, score, phase, reasons }, i) => (
                <li key={h.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-extrabold text-white">{i + 1}</span>
                        {h.name}
                        <span className="ml-2 text-xs font-semibold text-slate-400">{h.habitation_type} · {h.population.toLocaleString('en-IN')} people</span>
                      </p>
                      <ul className="mt-1 space-y-0.5 pl-8">
                        {reasons.map((r) => (
                          <li key={r} className="text-xs text-slate-500">• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge className={RELOCATION_PHASE_META[phase].badge}>{RELOCATION_PHASE_META[phase].label}</Badge>
                      <span className="text-xs font-bold text-slate-500 tabular-nums">score {score}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-8">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full rounded-full', phase === 'immediate' ? 'bg-red-500' : phase === 'short_term' ? 'bg-orange-500' : phase === 'medium_term' ? 'bg-amber-500' : 'bg-slate-300')} style={{ width: `${score}%` }} />
                    </div>
                    <button type="button" onClick={() => setModal({ mode: 'edit', hab: h })} className="min-h-[44px] cursor-pointer touch-manipulation rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">Edit</button>
                    <button type="button" onClick={() => setConfirmDelete(h)} className="min-h-[44px] cursor-pointer touch-manipulation rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Remove</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
            {PHASE_ORDER.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <Badge className={RELOCATION_PHASE_META[p].badge}>{RELOCATION_PHASE_META[p].label}</Badge>
                {p === 'immediate' ? 'score ≥ 70' : p === 'short_term' ? 'score ≥ 45' : p === 'medium_term' ? 'score ≥ 25' : 'below 25'}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900">
          <Home className="h-5 w-5 text-emerald-600" /> Destination sites ({sites.length})
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Safe zones designated for relocation, graded by suitability with live carrying-capacity checks.
          Manage the full list under <Link to="/admin/safe-zones" className="font-bold text-brand-600 underline">Safe Zones</Link>.
        </p>
        {sites.length === 0 ? (
          <div className="mt-3"><EmptyState title="No relocation sites yet" hint="Open any safe zone and mark it as a relocation site to assess it here." /></div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {sites.map((s) => (
              <SiteCard key={s.id} site={s} redZones={redZones} onAllocate={() => void refresh()} />
            ))}
          </div>
        )}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal?.mode === 'edit' ? 'Edit habitation' : 'Add habitation'} wide>
        {modal ? (
          <HabitationForm
            key={modal.mode === 'edit' ? modal.hab.id : 'new'}
            initial={
              modal.mode === 'edit'
                ? {
                    name: modal.hab.name,
                    habitation_type: modal.hab.habitation_type,
                    latitude: String(modal.hab.latitude),
                    longitude: String(modal.hab.longitude),
                    address: modal.hab.address ?? '',
                    population: String(modal.hab.population),
                    households: String(modal.hab.households ?? 0),
                    vulnerable_count: String(modal.hab.vulnerable_count ?? 0),
                    kutcha_share: String(modal.hab.kutcha_share ?? 0),
                    red_zone_id: modal.hab.red_zone_id ?? '',
                    past_incidents: String(modal.hab.past_incidents ?? 0),
                    notes: modal.hab.notes ?? '',
                  }
                : EMPTY_HAB
            }
            saving={saving}
            redZones={redZones}
            onSubmit={(i) => void saveHab(i, modal.mode === 'edit' ? modal.hab.id : null)}
          />
        ) : null}
      </Modal>

      <Modal open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Remove habitation?">
        <p className="text-sm text-slate-600">
          This drops <strong>{confirmDelete?.name}</strong> from the relocation watchlist. Its reports stay on record.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => void handleDelete()}>Remove <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </Modal>
    </div>
  );
}
