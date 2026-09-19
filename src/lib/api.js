/* Unified data layer: real Supabase when configured, demo-mode mock otherwise. */
import { isSupabaseEnabled, supabase } from './supabase';
import { mockCreateReport, mockCreateZone, mockDeleteZone, mockGetReport, mockListAlerts, mockListNotifications, mockListProfiles, mockListReports, mockListZones, mockMarkNotificationRead, mockSetRole, mockSubscribe, mockUpdateReport, mockUpdateZone, } from './mock';
export const isDemoMode = !isSupabaseEnabled;
function mustDb() {
    if (!supabase)
        throw new Error('Supabase is not configured.');
    return supabase;
}
function toReport(row) {
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
export async function listReports() {
    if (isDemoMode)
        return mockListReports();
    const { data, error } = await mustDb()
        .from('disaster_reports')
        .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(500);
    if (error)
        throw error;
    return data.map(toReport);
}
export async function getReport(id) {
    if (isDemoMode)
        return mockGetReport(id);
    const { data, error } = await mustDb()
        .from('disaster_reports')
        .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data ? toReport(data) : null;
}
export async function createReport(input, reporter, severity) {
    if (isDemoMode)
        return mockCreateReport(input, reporter, severity);
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
    if (error)
        throw error;
    const report = toReport(data);
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
export async function updateReport(id, patch) {
    if (isDemoMode)
        return mockUpdateReport(id, patch);
    const { data, error } = await mustDb()
        .from('disaster_reports')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, profiles!disaster_reports_reporter_id_fkey(full_name)')
        .single();
    if (error)
        throw error;
    return toReport(data);
}
/* ---------------- Safe zones ---------------- */
export async function listSafeZones() {
    if (isDemoMode)
        return mockListZones();
    const { data, error } = await mustDb()
        .from('safe_zones')
        .select('*')
        .order('name', { ascending: true });
    if (error)
        throw error;
    return (data ?? []);
}
export async function createSafeZone(input) {
    if (isDemoMode)
        return mockCreateZone(input);
    const { data, error } = await mustDb().from('safe_zones').insert(input).select('*').single();
    if (error)
        throw error;
    return data;
}
export async function updateSafeZone(id, patch) {
    if (isDemoMode)
        return mockUpdateZone(id, patch);
    const { data, error } = await mustDb()
        .from('safe_zones')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteSafeZone(id) {
    if (isDemoMode)
        return mockDeleteZone(id);
    const { error } = await mustDb().from('safe_zones').delete().eq('id', id);
    if (error)
        throw error;
}
/* ---------------- Image uploads ---------------- */
export async function uploadReportImages(files) {
    if (files.length === 0)
        return [];
    if (files.length > 5)
        throw new Error('You can attach up to 5 photos.');
    for (const f of files) {
        if (!f.type.startsWith('image/'))
            throw new Error('Only image files are allowed.');
        if (f.size > 4 * 1024 * 1024)
            throw new Error(`"${f.name}" exceeds 4 MB.`);
    }
    if (isDemoMode || !supabase) {
        return Promise.all(files.map((f) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('Could not read a photo.'));
            reader.readAsDataURL(f);
        })));
    }
    const urls = [];
    for (const f of files) {
        const safe = f.name.replace(/[^a-zA-Z0-9.()_-]/g, '_');
        const name = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`;
        const { error } = await supabase.storage
            .from('report-images')
            .upload(name, f, { contentType: f.type });
        if (error)
            throw error;
        const { data } = supabase.storage.from('report-images').getPublicUrl(name);
        urls.push(data.publicUrl);
    }
    return urls;
}
/* ---------------- Alerts / notifications ---------------- */
export async function listAlerts(limit = 50) {
    if (isDemoMode)
        return mockListAlerts(limit);
    const { data, error } = await mustDb()
        .from('alert_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return (data ?? []);
}
export async function listNotifications(userId) {
    if (isDemoMode)
        return mockListNotifications(userId);
    const { data, error } = await mustDb()
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
    if (error)
        throw error;
    return (data ?? []);
}
export async function markNotificationRead(id) {
    if (isDemoMode)
        return mockMarkNotificationRead(id);
    const { error } = await mustDb().from('notifications').update({ is_read: true }).eq('id', id);
    if (error)
        throw error;
}
/* ---------------- Admin: users ---------------- */
export async function listProfiles() {
    if (isDemoMode)
        return mockListProfiles();
    const { data, error } = await mustDb()
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return (data ?? []);
}
export async function setUserRole(id, role) {
    if (isDemoMode) {
        await mockSetRole(id, role);
        return;
    }
    const { error } = await mustDb().from('profiles').update({ role }).eq('id', id);
    if (error)
        throw error;
}
/* ---------------- Realtime ---------------- */
export function subscribeToReports(cb) {
    if (isDemoMode || !supabase)
        return mockSubscribe(cb);
    const channel = supabase
        .channel('disaster-reports-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'disaster_reports' }, () => cb())
        .subscribe();
    return () => {
        void supabase?.removeChannel(channel);
    };
}
export function subscribeToZones(cb) {
    if (isDemoMode || !supabase)
        return mockSubscribe(cb);
    const channel = supabase
        .channel('safe-zones-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'safe_zones' }, () => cb())
        .subscribe();
    return () => {
        void supabase?.removeChannel(channel);
    };
}
