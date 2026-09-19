import { useReportStore } from '../../stores/reportStore';
import { DISASTER_TYPES } from '../../lib/types';
import { DISASTER_TYPE_META } from '../../lib/utils';
import type { DisasterType, ReportStatus, Severity } from '../../lib/types';
import { Input, Select } from '../ui';

export default function ReportFiltersBar({ compact }: { compact?: boolean }) {
  const filters = useReportStore((s) => s.filters);
  const setFilters = useReportStore((s) => s.setFilters);
  const resetFilters = useReportStore((s) => s.resetFilters);

  return (
    <div className={`grid w-full gap-2 ${compact ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'}`}>
      <Input
        placeholder="Search address, reporter…"
        value={filters.query}
        onChange={(e) => setFilters({ query: e.target.value })}
        className="col-span-2 lg:col-span-2"
        aria-label="Search reports"
      />
      <Select
        value={filters.severity}
        onChange={(e) => setFilters({ severity: e.target.value as Severity | 'all' })}
        aria-label="Filter by severity"
      >
        <option value="all">All severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </Select>
      <Select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value as ReportStatus | 'all' })}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="investigating">Investigating</option>
        <option value="contained">Contained</option>
        <option value="resolved">Resolved</option>
        <option value="false_alarm">False alarm</option>
      </Select>
      <div className="col-span-2 flex gap-2 lg:col-span-1">
        <Select
          value={filters.disasterType}
          onChange={(e) => setFilters({ disasterType: e.target.value as DisasterType | 'all' })}
          aria-label="Filter by disaster type"
          className="flex-1"
        >
          <option value="all">All types</option>
          {DISASTER_TYPES.map((t) => (
            <option key={t} value={t}>
              {DISASTER_TYPE_META[t].label}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={resetFilters}
          className="min-h-[48px] cursor-pointer touch-manipulation rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
