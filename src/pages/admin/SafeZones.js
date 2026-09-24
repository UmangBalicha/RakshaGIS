import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { createSafeZone, deleteSafeZone, updateSafeZone } from '../../lib/api';
import { AMENITY_LABELS, SAFE_ZONE_TYPE_META, cn, formatDateTime } from '../../lib/utils';
import { SAFE_ZONE_TYPES } from '../../lib/types';
import { useReportStore } from '../../stores/reportStore';
import { useLiveReports, useWideScreen } from '../../lib/hooks';
import { Badge, Button, Card, CardContent, EmptyState, Input, Label, Modal, Select, Spinner } from '../../components/ui';
import { getMapTiles } from '../../lib/maptiles';
import { MapAutoResize } from '../../components/map/IncidentMap';

const tiles = getMapTiles();
const AMENITIES = Object.keys(AMENITY_LABELS);
const zonePin = L.divIcon({
    className: '',
    html: '<div class="rg-marker" style="width:24px;height:24px;background:#16a34a"><div style="width:9px;height:9px;border-radius:9999px;background:#fff"></div></div>',
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
    type: 'shelter',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    amenities: ['water'],
    is_active: true,
};
function ZoneForm({ initial, saving, onSubmit, }) {
    const [form, setForm] = useState(initial);
    // Desktop wheel over the map traps page scrolling — match the public maps.
    const allowZoom = useWideScreen();
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const validCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const toggleAmenity = (a) => {
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx(Label, { htmlFor: "zone-name", required: true, children: "Name" }), _jsx(Input, { id: "zone-name", placeholder: "e.g. Nehru Stadium Relief Camp", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "zone-type", children: "Type" }), _jsx(Select, { id: "zone-type", value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }), children: SAFE_ZONE_TYPES.map((t) => (_jsx("option", { value: t, children: SAFE_ZONE_TYPE_META[t].label }, t))) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "zone-cap", children: "Capacity (people, optional)" }), _jsx(Input, { id: "zone-cap", type: "number", min: 0, placeholder: "e.g. 500", value: form.capacity, onChange: (e) => setForm({ ...form, capacity: e.target.value }) })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx(Label, { htmlFor: "zone-addr", children: "Address / landmark" }), _jsx(Input, { id: "zone-addr", placeholder: "Road, area, city", value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })] })] }), _jsxs("div", { children: [_jsx(Label, { required: true, children: "Location \u2014 tap the map to place the pin" }), _jsx("div", { className: "overflow-hidden rounded-xl border border-slate-200", style: { height: '260px' }, children: _jsxs(MapContainer, { center: validCoords ? [lat, lng] : [26.5, 79.5], zoom: validCoords ? 13 : 5, scrollWheelZoom: allowZoom, style: { height: '100%', width: '100%' }, children: [_jsx(MapAutoResize, {}), _jsx(TileLayer, { attribution: tiles.attribution, url: tiles.url }), _jsx(ZoneClickPicker, { onPick: (la, ln) => setForm((f) => ({ ...f, latitude: String(la.toFixed(6)), longitude: String(ln.toFixed(6)) })) }), validCoords ? _jsx(Marker, { position: [lat, lng], icon: zonePin }) : null] }) }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [_jsx(Input, { placeholder: "Latitude", inputMode: "decimal", value: form.latitude, onChange: (e) => setForm({ ...form, latitude: e.target.value }), "aria-label": "Latitude" }), _jsx(Input, { placeholder: "Longitude", inputMode: "decimal", value: form.longitude, onChange: (e) => setForm({ ...form, longitude: e.target.value }), "aria-label": "Longitude" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amenities available" }), _jsx("div", { className: "flex flex-wrap gap-2", children: AMENITIES.map((a) => (_jsx("button", { type: "button", onClick: () => toggleAmenity(a), className: cn('cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold', form.amenities.includes(a)
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                : 'border-slate-300 text-slate-500 hover:bg-slate-50'), children: AMENITY_LABELS[a] }, a))) })] }), _jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700", children: [_jsx("input", { type: "checkbox", checked: form.is_active, onChange: (e) => setForm({ ...form, is_active: e.target.checked }), className: "h-4 w-4 accent-emerald-600" }), "Active \u2014 visible to citizens for evacuation"] }), _jsx(Button, { className: "w-full", size: "lg", disabled: saving, onClick: submit, children: saving ? 'Saving…' : 'Save safe zone' })] }));
}
export default function AdminSafeZones() {
    useLiveReports();
    const allowZoom = useWideScreen();
    const zones = useReportStore((s) => s.zones);
    const loading = useReportStore((s) => s.loading);
    const loadError = useReportStore((s) => s.error);
    const refresh = useReportStore((s) => s.refresh);
    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleAdd = async (input) => {
        setSaving(true);
        try {
            await createSafeZone(input);
            toast.success('Safe zone added.');
            setModal(null);
            await refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not save.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleEdit = async (id, input) => {
        setSaving(true);
        try {
            await updateSafeZone(id, input);
            toast.success('Safe zone updated.');
            setModal(null);
            await refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not save.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!confirmDelete)
            return;
        try {
            await deleteSafeZone(confirmDelete.id);
            toast.success('Safe zone deleted.');
            setConfirmDelete(null);
            await refresh();
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not delete.');
        }
    };
    const toggleActive = async (z) => {
        try {
            await updateSafeZone(z.id, { is_active: !z.is_active });
            await refresh();
            toast.success(z.is_active ? 'Zone hidden from citizens.' : 'Zone is live for citizens.');
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not update.');
        }
    };
    const editInitial = (z) => ({
        name: z.name,
        type: z.type,
        address: z.address,
        latitude: String(z.latitude),
        longitude: String(z.longitude),
        capacity: z.capacity === null ? '' : String(z.capacity),
        amenities: z.amenities,
        is_active: z.is_active,
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-extrabold text-slate-900", children: ["Safe zones (", zones.length, ")"] }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: "Shelters, hospitals and grounds citizens are routed to during evacuation." })] }), _jsx(Button, { onClick: () => setModal({ mode: 'add' }), children: "+ Add safe zone" })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-5", children: loading && zones.length === 0 ? (_jsx("div", { className: "flex justify-center py-12", children: _jsx(Spinner, {}) })) : loadError && zones.length === 0 ? (_jsxs("div", { role: "alert", className: "rounded-xl border border-red-200 bg-red-50 p-4 text-center", children: [_jsx("p", { className: "text-sm font-bold text-red-800", children: "Couldn\u2019t load safe zones \u2014 check your connection." }), _jsx(Button, { size: "sm", className: "mt-3", onClick: () => void refresh(), children: "Retry" })] })) : zones.length === 0 ? (_jsx(EmptyState, { title: "No safe zones yet", hint: "Add the first shelter, hospital or open ground to enable evacuation routing." })) : (_jsx("div", { className: "overflow-hidden rounded-xl border border-slate-200", style: { height: '380px' }, children: _jsxs(MapContainer, { center: [28.5, 79.5], zoom: 6, scrollWheelZoom: allowZoom, style: { height: '100%', width: '100%' }, children: [_jsx(MapAutoResize, {}), _jsx(TileLayer, { attribution: tiles.attribution, url: tiles.url }), zones.map((z) => (_jsx(Marker, { position: [z.latitude, z.longitude], icon: zonePin, opacity: z.is_active ? 1 : 0.45 }, z.id)))] }) })) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "rg-scroll overflow-x-auto p-0", children: zones.length === 0 ? null : (_jsxs("table", { className: "w-full min-w-220 text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase", children: [_jsx("th", { className: "px-4 py-3", children: "Name" }), _jsx("th", { className: "px-4 py-3", children: "Type" }), _jsx("th", { className: "px-4 py-3", children: "Capacity" }), _jsx("th", { className: "px-4 py-3", children: "Occupancy" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Updated" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { children: zones.map((z) => {
                                    const pct = z.capacity ? Math.min(100, Math.round((z.current_occupancy / z.capacity) * 100)) : null;
                                    return (_jsxs("tr", { className: "border-b border-slate-50 last:border-0 hover:bg-slate-50/70", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsx("p", { className: "font-bold text-slate-900", children: z.name }), _jsx("p", { className: "max-w-56 truncate text-[11px] text-slate-500", children: z.address })] }), _jsx("td", { className: "px-4 py-3 text-xs font-semibold text-slate-600", children: SAFE_ZONE_TYPE_META[z.type].label }), _jsx("td", { className: "px-4 py-3 text-xs text-slate-600 tabular-nums", children: z.capacity ?? '—' }), _jsxs("td", { className: "px-4 py-3 text-xs text-slate-600 tabular-nums", children: [z.current_occupancy, pct !== null ? ` (${pct}%)` : ''] }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { className: z.is_active ? 'bg-emerald-100 text-emerald-800 ring-emerald-200' : 'bg-slate-200 text-slate-600 ring-slate-300', children: z.is_active ? 'Active' : 'Hidden' }) }), _jsx("td", { className: "px-4 py-3 text-xs whitespace-nowrap text-slate-500", children: formatDateTime(z.updated_at) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex justify-end gap-1", children: [_jsx("button", { type: "button", onClick: () => setModal({ mode: 'edit', zone: z }), className: "inline-flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50", children: "Edit" }), _jsx("button", { type: "button", onClick: () => void toggleActive(z), className: "inline-flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50", children: z.is_active ? 'Hide' : 'Show' }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(z), className: "inline-flex min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation items-center justify-center rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50", children: "Delete" })] }) })] }, z.id));
                                }) })] })) }) }), _jsx(Modal, { open: modal !== null, onClose: () => setModal(null), title: modal?.mode === 'edit' ? 'Edit safe zone' : 'Add safe zone', wide: true, children: modal?.mode === 'add' ? (_jsx(ZoneForm, { initial: EMPTY_FORM, saving: saving, onSubmit: (i) => void handleAdd(i) })) : modal?.mode === 'edit' ? (_jsx(ZoneForm, { initial: editInitial(modal.zone), saving: saving, onSubmit: (i) => void handleEdit(modal.zone.id, i) }, modal.zone.id)) : null }), _jsxs(Modal, { open: confirmDelete !== null, onClose: () => setConfirmDelete(null), title: "Delete safe zone?", children: [_jsxs("p", { className: "text-sm text-slate-600", children: ["This permanently removes ", _jsx("strong", { children: confirmDelete?.name }), ". Evacuation routes pointing here will fall back to the next-nearest zone."] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setConfirmDelete(null), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: () => void handleDelete(), children: "Delete" })] })] })] }));
}
