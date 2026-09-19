/* Unified data layer: real Supabase when configured, demo-mode mock otherwise. */
import { isSupabaseEnabled, supabase } from './supabase';
import {
  mockCreateReport,
  mockCreateZone,
  mockDeleteZone,
  mockGetReport,
  mockListAlerts,
  mockListNotifications,
  mockListProfiles,
  mockListReports,
  mockListZones,
  mockMarkNotificationRead,
  mockSetRole,
  mockSubscribe,
  mockUpdateReport,
  mockUpdateZone,
} from './mock';
import type {
  AlertLog,
  AppNotification,
  DisasterReport,
  NewReportInput,
  NewSafeZoneInput,
  Profile,
  Role,
  SafeZone,
  Severity,
} from './types';

export const isDemoMode = !isSupabaseEnabled;

function mustDb() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

type DbReportRow = {
  id: string;
  reporter_id: string | null;
  latitude: number;
  longitude: number;
  address: string;
  disaster_type: DisasterReport['disaster_type'];
  severity: Severity;
  status: DisasterReport['status'];
  description: string;
  has_injuries: boolean;
  injury_count: number;
  images: string[];
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | { full_name: string }[] | null;
};

function toReport(row: DbReportRow): DisasterReport {
  const prof = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    reporter_name: prof?.full_name ?? 'Citizen Reporter',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    disaster_type: row.disaster_type,
    severity: row.severity,
    status: row.status,
    description: row.description ?? '',
    has_injuries: Boolean(row.has_injuries),
    injury_count: Number(row.injury_count ?? 0),
    images: row.images ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* ---------------- Reports ---------------- */

export async function listReports(): Promise<DisasterReport[]> {
  if (isDemoMode) return mockListReports();
  const { data, error } = await mustDb()
    .from('disaster_reports')
    .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as DbReportRow[]).map(toReport);
}

export async function getReport(id: string): Promise<DisasterReport | null> {
  if (isDemoMode) return mockGetReport(id);
  const { data, error } = await mustDb()
    .from('disaster_reports')
    .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toReport(data as DbReportRow) : null;
}

export async function createReport(
  input: NewReportInput,
  reporter: Profile | null,
  severity: Severity,
): Promise<DisasterReport> {
  if (isDemoMode) return mockCreateReport(input, reporter, severity);
  const db = mustDb();
  const { data, error } = await db
    .from('disaster_reports')
    .insert({
      reporter_id: reporter?.id ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      disaster_type: input.disaster_type,
      severity,
      status: 'pending',
      description: input.description,
      has_injuries: input.has_injuries,
      injury_count: input.injury_count,
      images: input.images,
    })
    .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
    .single();
  if (error) throw error;
  const report = toReport(data as DbReportRow);
  // Best-effort alert log (RLS may restrict for public role; never blocks the report).
  await db
    .from('alert_logs')
    .insert({
      report_id: report.id,
      severity,
      message: `New ${severity} ${report.disaster_type.replace(/_/g, ' ')} incident — ${report.address}`,
    })
    .then(() => undefined, () => undefined);
  return report;
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<DisasterReport, 'severity' | 'status'>>,
): Promise<DisasterReport> {
  if (isDemoMode) return mockUpdateReport(id, patch);
  const { data, error } = await mustDb()
    .from('disaster_reports')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
    .single();
  if (error) throw error;
  return toReport(data as DbReportRow);
}

/* ---------------- Safe zones ---------------- */

export async function listSafeZones(): Promise<SafeZone[]> {
  if (isDemoMode) return mockListZones();
  const { data, error } = await mustDb()
    .from('safe_zones')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SafeZone[];
}

export async function createSafeZone(input: NewSafeZoneInput): Promise<SafeZone> {
  if (isDemoMode) return mockCreateZone(input);
  const { data, error } = await mustDb().from('safe_zones').insert(input).select('*').single();
  if (error) throw error;
  return data as SafeZone;
}

export async function updateSafeZone(
  id: string,
  patch: Partial<Omit<SafeZone, 'id' | 'created_at'>>,
): Promise<SafeZone> {
  if (isDemoMode) return mockUpdateZone(id, patch);
  const { data, error } = await mustDb()
    .from('safe_zones')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as SafeZone;
}

export async function deleteSafeZone(id: string): Promise<void> {
  if (isDemoMode) return mockDeleteZone(id);
  const { error } = await mustDb().from('safe_zones').delete().eq('id', id);
  if (error) throw error;
}

/* ---------------- Image uploads ---------------- */

export async function uploadReportImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  if (files.length > 5) throw new Error('You can attach up to 5 photos.');
  for (const f of files) {
    if (!f.type.startsWith('image/')) throw new Error('Only image files are allowed.');
    if (f.size > 4 * 1024 * 1024) throw new Error(`"${f.name}" exceeds 4 MB.`);
  }
  if (isDemoMode || !supabase) {
    return Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Could not read a photo.'));
            reader.readAsDataURL(f);
          }),
      ),
    );
  }
  const urls: string[] = [];
  for (const f of files) {
    const safe = f.name.replace(/[^a-zA-Z0-9.()_-]/g, '_');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
    const { error } = await supabase.storage
      .from('report-images')
      .upload(name, f, { contentType: f.type });
    if (error) throw error;
    const { data } = supabase.storage.from('report-images').getPublicUrl(name);
    urls.push(data.publicUrl);
  }
  return urls;
}

/* ---------------- Alerts / notifications ---------------- */

export async function listAlerts(limit = 50): Promise<AlertLog[]> {
  if (isDemoMode) return mockListAlerts(limit);
  const { data, error } = await mustDb()
    .from('alert_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AlertLog[];
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  if (isDemoMode) return mockListNotifications(userId);
  const { data, error } = await mustDb()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isDemoMode) return mockMarkNotificationRead(id);
  const { error } = await mustDb().from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

/* ---------------- Admin: users ---------------- */

export async function listProfiles(): Promise<Profile[]> {
  if (isDemoMode) return mockListProfiles();
  const { data, error } = await mustDb()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function setUserRole(id: string, role: Role): Promise<void> {
  if (isDemoMode) {
    await mockSetRole(id, role);
    return;
  }
  const { error } = await mustDb().from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

/* ---------------- Realtime ---------------- */

export function subscribeToReports(cb: () => void): () => void {
  if (isDemoMode || !supabase) return mockSubscribe(cb);
  const channel = supabase
    .channel('disaster-reports-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'disaster_reports' }, () => cb())
    .subscribe();
  return () => {
    void supabase?.removeChannel(channel);
  };
}

export function subscribeToZones(cb: () => void): () => void {
  if (isDemoMode || !supabase) return mockSubscribe(cb);
  const channel = supabase
    .channel('safe-zones-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'safe_zones' }, () => cb())
    .subscribe();
  return () => {
    void supabase?.removeChannel(channel);
  };
}
