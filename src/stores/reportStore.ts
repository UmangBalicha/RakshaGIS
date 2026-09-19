import { create } from 'zustand';
import { listAlerts, listReports, listSafeZones } from '../lib/api';
import { subscribeToReports, subscribeToZones } from '../lib/api';
import type { AlertLog, DisasterReport, ReportFilters, SafeZone } from '../lib/types';

export const DEFAULT_FILTERS: ReportFilters = {
  query: '',
  severity: 'all',
  status: 'all',
  disasterType: 'all',
};

interface ReportState {
  reports: DisasterReport[];
  alerts: AlertLog[];
  zones: SafeZone[];
  loading: boolean;
  error: string | null;
  filters: ReportFilters;
  setFilters: (patch: Partial<ReportFilters>) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
  subscribeLive: () => () => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  reports: [],
  alerts: [],
  zones: [],
  loading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [reports, alerts, zones] = await Promise.all([
        listReports(),
        listAlerts(60),
        listSafeZones(),
      ]);
      set({ reports, alerts, zones, loading: false });
    } catch (e) {
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
    return () => {
      offReports();
      offZones();
    };
  },
}));

export function applyFilters(reports: DisasterReport[], f: ReportFilters): DisasterReport[] {
  const q = f.query.trim().toLowerCase();
  return reports.filter((r) => {
    if (f.severity !== 'all' && r.severity !== f.severity) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (f.disasterType !== 'all' && r.disaster_type !== f.disasterType) return false;
    if (q) {
      const hay = `${r.address} ${r.reporter_name} ${r.description} ${r.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
