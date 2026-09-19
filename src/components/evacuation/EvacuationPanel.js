import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Footprints, Car, Navigation } from 'lucide-react';
import { getEvacuationRoutes } from '../../lib/routing';
import { AMENITY_LABELS, SAFE_ZONE_TYPE_META, cn, formatDistance, formatDuration, googleNavUrl, } from '../../lib/utils';
import { useReportStore } from '../../stores/reportStore';
import { Spinner } from '../ui';
export default function EvacuationPanel({ origin, zones, onRouteSelect, autoSelectFirst = true, }) {
    const storeZones = useReportStore((s) => s.zones);
    const list = zones ?? storeZones;
    const [profile, setProfile] = useState('driving');
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [slow, setSlow] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const activeZones = useMemo(() => list.filter((z) => z.is_active), [list]);
    useEffect(() => {
        let cancelled = false;
        if (activeZones.length === 0) {
            setRoutes([]);
            setSelectedId(null);
            onRouteSelect?.(null);
            return;
        }
        setLoading(true);
        setSlow(false);
        const slowTimer = window.setTimeout(() => {
            if (!cancelled)
                setSlow(true);
        }, 8000);
        getEvacuationRoutes(origin.lat, origin.lng, activeZones, profile, 3)
            .then((r) => {
            if (cancelled)
                return;
            setRoutes(r);
            const first = autoSelectFirst ? (r[0] ?? null) : null;
            setSelectedId(first?.safe_zone_id ?? null);
            onRouteSelect?.(first);
        })
            .catch(() => {
            if (!cancelled)
                setRoutes([]);
        })
            .finally(() => {
            window.clearTimeout(slowTimer);
            if (!cancelled) {
                setLoading(false);
                setSlow(false);
            }
        });
        return () => {
            cancelled = true;
            window.clearTimeout(slowTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [origin.lat, origin.lng, profile, activeZones]);
    const selected = routes.find((r) => r.safe_zone_id === selectedId) ?? null;
    const selectedZone = selected
        ? (activeZones.find((z) => z.id === selected.safe_zone_id) ?? null)
        : null;
    const pick = (r) => {
        setSelectedId(r.safe_zone_id);
        onRouteSelect?.(r);
    };
    return (_jsxs("div", { className: "rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-base font-extrabold text-slate-900", children: "Evacuate to safety" }), _jsxs("p", { className: "text-sm text-slate-500", children: ["From ", _jsx("strong", { children: origin.label }), " \u2014 nearest safe zones by road, live."] })] }), _jsxs("div", { className: "flex overflow-hidden rounded-xl border border-slate-300 bg-white", role: "group", "aria-label": "Travel mode", children: [_jsxs("button", { type: "button", onClick: () => setProfile('driving'), "aria-pressed": profile === 'driving', className: cn('flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-1.5 px-4 py-3 text-sm font-bold', profile === 'driving' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'), children: [_jsx(Car, { className: "h-4 w-4" }), " Drive"] }), _jsxs("button", { type: "button", onClick: () => setProfile('walking'), "aria-pressed": profile === 'walking', className: cn('flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-1.5 px-4 py-3 text-sm font-bold', profile === 'walking' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'), children: [_jsx(Footprints, { className: "h-4 w-4" }), " Walk"] })] })] }), activeZones.length === 0 ? (_jsx("p", { className: "mt-3 rounded-lg bg-white p-3 text-sm text-slate-500", children: "No active safe zones are registered yet. An authority admin can add shelters, hospitals and grounds under Admin \u2192 Safe Zones." })) : loading && routes.length === 0 ? (_jsxs("div", { className: "mt-3 rounded-lg bg-white p-4 text-sm font-semibold text-slate-500", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Spinner, {}), " Computing road routes via OSRM\u2026"] }), slow ? (_jsx("p", { className: "mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset", children: "Taking longer than expected \u2014 road data may be slow here. Try Walk mode for a direct route, or use the 3D navigation button once a route appears." })) : null] })) : (_jsx("div", { className: "mt-3 space-y-2", children: routes.map((r, i) => {
                    const z = activeZones.find((x) => x.id === r.safe_zone_id);
                    const isSel = r.safe_zone_id === selectedId;
                    const occPct = z?.capacity ? Math.min(100, Math.round((z.current_occupancy / z.capacity) * 100)) : null;
                    return (_jsxs("button", { type: "button", onClick: () => pick(r), "aria-expanded": isSel, className: cn('block w-full cursor-pointer touch-manipulation rounded-xl border-2 bg-white p-3 text-left transition-colors', isSel ? 'border-emerald-600 shadow-sm' : 'border-slate-200 hover:border-emerald-300'), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "text-sm font-bold text-slate-900", children: [_jsx("span", { className: "mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-extrabold text-white", children: i + 1 }), r.safe_zone_name] }), _jsxs("p", { className: "mt-0.5 pl-8 text-xs font-semibold text-slate-500", children: [z ? SAFE_ZONE_TYPE_META[z.type].label : '', z?.amenities?.length
                                                        ? ` · ${z.amenities.map((a) => AMENITY_LABELS[a] ?? a).slice(0, 3).join(', ')}`
                                                        : ''] })] }), _jsxs("div", { className: "shrink-0 text-right", children: [_jsx("p", { className: "text-sm font-extrabold text-emerald-700", children: formatDuration(r.duration_seconds) }), _jsx("p", { className: "text-xs font-semibold text-slate-500", children: formatDistance(r.distance_meters) }), r.is_estimate ? (_jsx("p", { className: "mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-800", children: "est." })) : null] })] }), isSel && occPct !== null && z ? (_jsxs("div", { className: "mt-2 pl-8", children: [_jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-500", children: [_jsx("span", { children: "Occupancy" }), _jsxs("span", { className: "tabular-nums", children: [z.current_occupancy, "/", z.capacity, " (", occPct, "%)"] })] }), _jsx("div", { className: "mt-1 h-2 overflow-hidden rounded-full bg-slate-100", children: _jsx("div", { className: cn('h-full rounded-full', occPct >= 90 ? 'bg-red-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'), style: { width: `${occPct}%` } }) })] })) : null] }, r.safe_zone_id));
                }) })), selected && selectedZone ? (_jsxs("div", { className: "mt-3 rounded-xl bg-white p-3", children: [_jsxs("p", { className: "text-sm font-extrabold text-slate-900", children: ["Turn-by-turn \u2192 ", selected.safe_zone_name] }), _jsxs("a", { href: googleNavUrl(selectedZone.latitude, selectedZone.longitude, { lat: origin.lat, lng: origin.lng }, profile), target: "_blank", rel: "noreferrer", className: "mt-2 flex min-h-[56px] touch-manipulation items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-extrabold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98]", children: [_jsx(Navigation, { className: "h-5 w-5" }), " Start 3D navigation \u2192"] }), selected.is_estimate ? (_jsx("p", { className: "mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset", children: "Live road routing is unavailable \u2014 showing an estimated path. Follow police / local volunteer guidance on the ground." })) : null, _jsx("ol", { className: "rg-scroll mt-2 max-h-64 space-y-2 overflow-y-auto", children: selected.steps.map((s, i) => (_jsxs("li", { className: "flex gap-2 text-sm text-slate-600", children: [_jsx("span", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600", children: i + 1 }), _jsxs("span", { children: [_jsx("span", { className: "font-semibold text-slate-800", children: s.instruction }), ' ', _jsxs("span", { className: "font-semibold whitespace-nowrap text-slate-400", children: ["(", formatDistance(s.distance_meters), s.duration_seconds >= 60 ? ` · ${formatDuration(s.duration_seconds)}` : '', ")"] })] })] }, i))) })] })) : null] }));
}
