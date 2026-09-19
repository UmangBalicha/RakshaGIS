import { create } from 'zustand';
import { listAlerts, listHabitations, listRedZones, listReports, listSafeZones } from '../lib/api';
import { subscribeToHabitations, subscribeToRedZones, subscribeToReports, subscribeToZones } from '../lib/api';
export const DEFAULT_FILTERS = {
    query: '',
    severity: 'all',
    status: 'all',
    disasterType: 'all',
};
export const useReportStore = create()((set, get) => ({
    reports: [],
    alerts: [],
    zones: [],
    redZones: [],
    habitations: [],
    loading: false,
    error: null,
    filters: DEFAULT_FILTERS,
    setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
    resetFilters: () => set({ filters: DEFAULT_FILTERS }),
    refresh: async () => {
        set({ loading: true, error: null });
        try {
            const [reports, alerts, zones, redZones, habitations] = await Promise.all([
                listReports(),
                listAlerts(60),
                listSafeZones(),
                listRedZones(),
                listHabitations(),
            ]);
            set({ reports, alerts, zones, redZones, habitations, loading: false });
        }
        catch (e) {
            set({
                loading: false,
                error: e instanceof Error ? e.message : 'Failed to load reports.',
            });
        }
    },
    subscribeLive: () => {
        const refresh = () => void get().refresh();
        const offReports = subscribeToReports(refresh);
        const offZones = subscribeToZones(refresh);
        const offRed = subscribeToRedZones(refresh);
        const offHab = subscribeToHabitations(refresh);
        return () => {
            offReports();
            offZones();
            offRed();
            offHab();
        };
    },
}));
export function applyFilters(reports, f) {
    const q = f.query.trim().toLowerCase();
    return reports.filter((r) => {
        if (f.severity !== 'all' && r.severity !== f.severity)
            return false;
        if (f.status !== 'all' && r.status !== f.status)
            return false;
        if (f.disasterType !== 'all' && r.disaster_type !== f.disasterType)
            return false;
        if (q) {
            const hay = `${r.address} ${r.reporter_name} ${r.description} ${r.id}`.toLowerCase();
            if (!hay.includes(q))
                return false;
        }
        return true;
    });
}
