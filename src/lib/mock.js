const DB_KEY = 'rakshagis_mock_v3';
const SESSION_KEY = 'rakshagis_session_v1';
export const DEMO_OTP_CODE = '123456';
function hoursAgo(h) {
    return new Date(Date.now() - h * 3600_000).toISOString();
}
function seed() {
    const profiles = [
        {
            id: 'user-admin-01',
            email: 'admin@rakshagis.in',
            full_name: 'Aarav Sharma',
            phone: '+919810000001',
            role: 'admin',
            avatar_url: null,
            created_at: hoursAgo(24 * 90),
        },
        {
            id: 'user-public-01',
            email: 'user@rakshagis.in',
            full_name: 'Priya Nair',
            phone: '+919810000002',
            role: 'public',
            avatar_url: null,
            created_at: hoursAgo(24 * 40),
        },
    ];
    const R = (id, reporter, latitude, longitude, address, disaster_type, severity, status, description, ageHrs, extra) => ({
        id,
        reporter_id: reporter.id,
        reporter_name: reporter.full_name,
        latitude,
        longitude,
        address,
        disaster_type,
        severity,
        status,
        description,
        has_injuries: false,
        injury_count: 0,
        images: [],
        created_at: hoursAgo(ageHrs),
        updated_at: hoursAgo(Math.max(0, ageHrs - 2)),
        ...extra,
    });
    const admin = profiles[0];
    const citizen = profiles[1];
    const reports = [
        R('seed-01', citizen, 30.3165, 78.0322, 'Rajpur Road, Dehradun, Uttarakhand', 'wildfire', 'high', 'investigating', 'Pine forest edge near Rajpur showing active flame front spreading uphill. Smoke visible from the main road.', 3),
        R('seed-02', citizen, 29.3919, 79.4542, 'Mallital, Nainital, Uttarakhand', 'landslide', 'critical', 'pending', 'Hillside collapse above Mallital after overnight rain. Debris blocking the road; two houses nearby may be at risk.', 5, { has_injuries: true, injury_count: 1 }),
        R('seed-03', admin, 31.1048, 77.1734, 'Sanjauli, Shimla, Himachal Pradesh', 'wildfire', 'medium', 'investigating', 'Undergrowth fire reported by patrol team. Fire line being cut on the eastern flank.', 9),
        R('seed-04', citizen, 30.7297, 78.4434, 'NH-108 near Uttarkashi, Uttarakhand', 'landslide', 'critical', 'investigating', 'Major slope failure close to the highway. Traffic halted, visibility poor, more debris expected.', 14),
        R('seed-05', citizen, 30.0869, 78.2676, 'Tapovan, Rishikesh, Uttarakhand', 'building_fire', 'low', 'resolved', 'Kitchen fire in a guest house. Extinguished by staff before brigade arrival.', 26),
        R('seed-06', citizen, 29.9457, 78.1642, 'SIDCUL industrial area, Haridwar, Uttarakhand', 'industrial', 'medium', 'contained', 'Boiler-room mishap in a packaging unit. Two tenders on site, no spread to adjacent sheds.', 31),
        R('seed-07', citizen, 28.6139, 77.209, 'Karol Bagh, New Delhi', 'building_fire', 'high', 'investigating', 'Fire on the second floor of a commercial market building. Evacuation in progress.', 8),
        R('seed-08', citizen, 19.076, 72.8777, 'Andheri East, Mumbai, Maharashtra', 'building_fire', 'low', 'resolved', 'Short-circuit fire in an office pantry. No casualties.', 50),
        R('seed-09', citizen, 30.3752, 78.4744, 'Dhanaulti Road, Tehri Garhwal, Uttarakhand', 'earthquake', 'critical', 'pending', 'Magnitude ~5.8 tremor felt strongly. Reports of wall cracks in two villages; assessment teams requested.', 2),
        R('seed-10', citizen, 29.5971, 79.6591, 'Mall Road, Almora, Uttarakhand', 'landslide', 'medium', 'pending', 'Loose debris on terraced slope below town. Currently away from houses, monitoring overnight.', 19),
        R('seed-11', citizen, 26.1445, 91.7362, 'Bharalumukh, Guwahati, Assam', 'flood', 'high', 'investigating', 'Brahmaputra rising; low-lying lanes waterlogged up to knee level. Boats requested for elderly residents.', 6),
        R('seed-12', citizen, 30.4229, 79.328, 'Gopeshwar, Chamoli, Uttarakhand', 'earthquake', 'high', 'contained', 'Aftershock caused a rockfall on the approach road. One lane cleared, single-file traffic only.', 44),
        R('seed-13', citizen, 19.8135, 85.8314, 'Puri Marine Drive, Odisha', 'cyclone', 'high', 'contained', 'Cyclonic winds uprooted hoardings along Marine Drive. Power lines down in two sectors.', 20),
        R('seed-14', citizen, 13.0827, 80.2707, 'Besant Nagar beach, Chennai, Tamil Nadu', 'tsunami', 'low', 'false_alarm', 'Unusual wave surge reported by morning walkers; buoy data normal, no threat confirmed.', 55),
        R('seed-15', citizen, 28.7041, 77.1025, 'Wazirpur industrial area, Delhi', 'chemical', 'high', 'pending', 'Suspected gas leak from a cold-storage unit. Burning smell reported across two blocks; residents advised to stay indoors.', 4),
        R('seed-16', citizen, 12.2786, 93.8574, 'Barren Island, Andaman & Nicobar', 'volcanic', 'medium', 'investigating', 'Ash plume observed by coast guard patrol. Exclusion advisory issued for nearby waters.', 60),
        R('seed-17', citizen, 23.0225, 72.5714, 'Naroda GIDC, Ahmedabad, Gujarat', 'industrial', 'critical', 'investigating', 'Blast in a chemical storage godown with fire spreading to adjacent units. Multiple injuries reported.', 11, { has_injuries: true, injury_count: 4 }),
    ];
    const Z = (id, name, type, latitude, longitude, address, capacity, occupancy, amenities, ageHrs) => ({
        id,
        name,
        type,
        latitude,
        longitude,
        address,
        capacity,
        current_occupancy: occupancy,
        amenities,
        is_active: true,
        created_at: hoursAgo(ageHrs),
        updated_at: hoursAgo(Math.max(0, ageHrs - 5)),
    });
    const zones = [
        Z('zone-01', 'Doon Govt. Inter College Shelter', 'school', 30.3254, 78.0412, 'Race Course, Dehradun', 800, 120, ['water', 'food', 'medical', 'bedding', 'power'], 200),
        Z('zone-02', 'District Hospital Relief Point', 'hospital', 30.3091, 78.0285, 'Haridwar Road, Dehradun', 300, 45, ['medical', 'water', 'power'], 200),
        Z('zone-03', 'Rangers Ground Open Shelter', 'open_ground', 30.3322, 78.0551, 'Clement Town, Dehradun', 2000, 0, ['water', 'comms'], 180),
        Z('zone-04', 'Tapovan Community Hall Camp', 'relief_camp', 30.0912, 78.2744, 'Tapovan, Rishikesh', 500, 310, ['water', 'food', 'bedding'], 150),
        Z('zone-05', 'AIIMS Rishikesh Triage Point', 'hospital', 30.0777, 78.2872, 'Virbhadra Road, Rishikesh', 400, 60, ['medical', 'water', 'power', 'comms'], 150),
        Z('zone-06', 'Nainital Stadium Shelter', 'shelter', 29.3851, 79.4589, 'Flats Ground, Mallital, Nainital', 1200, 200, ['water', 'food', 'medical', 'bedding', 'power'], 120),
        Z('zone-07', 'BD Pandey Hospital Point', 'hospital', 29.3889, 79.4488, 'Mall Road, Nainital', 250, 30, ['medical', 'water'], 120),
        Z('zone-08', 'Uttarkashi Bus Stand Ground', 'open_ground', 30.7312, 78.4512, 'NH-108, Uttarkashi', 900, 0, ['water', 'comms'], 100),
        Z('zone-09', 'Tehri Lake View Camp', 'relief_camp', 30.3812, 78.4822, 'New Tehri Town', 700, 90, ['water', 'food', 'bedding', 'power'], 90),
        Z('zone-10', 'Chamoli Polytechnic Shelter', 'school', 30.4189, 79.3351, 'Gopeshwar, Chamoli', 600, 40, ['water', 'food', 'bedding'], 80),
        Z('zone-11', 'Haridwar Ramlila Ground', 'open_ground', 29.9512, 78.1592, 'Near Har Ki Pauri, Haridwar', 2500, 150, ['water', 'food', 'comms'], 70),
        Z('zone-12', 'Almora Army Ground Shelter', 'open_ground', 29.6012, 79.6644, 'Cantonment, Almora', 1500, 0, ['water', 'medical', 'comms'], 60),
        Z('zone-13', 'Guwahati Nehru Stadium Camp', 'relief_camp', 26.1522, 91.7633, 'Nehru Stadium, Guwahati', 3000, 1450, ['water', 'food', 'medical', 'bedding', 'power'], 40),
        Z('zone-14', 'Puri Town Hall Shelter', 'shelter', 19.8044, 85.8255, 'Grand Road, Puri', 1000, 320, ['water', 'food', 'bedding', 'power'], 30),
        // Delhi NCR — serves Karol Bagh (seed-07) + Wazirpur (seed-15)
        Z('zone-15', 'Ajmal Khan Park Shelter', 'shelter', 28.6219, 77.2015, 'Ajmal Khan Park, Karol Bagh, New Delhi', 900, 140, ['water', 'food', 'bedding'], 28),
        Z('zone-16', 'RML Hospital Triage Point', 'hospital', 28.6245, 77.2093, 'Ram Manohar Lohia Hospital, New Delhi', 350, 80, ['medical', 'water', 'power'], 26),
        Z('zone-17', 'Ashok Vihar Govt School Shelter', 'school', 28.6955, 77.1132, 'Ashok Vihar Phase 1, Delhi', 600, 45, ['water', 'food', 'bedding', 'power'], 24),
        // Mumbai — serves Andheri East (seed-08)
        Z('zone-18', 'Andheri Sports Complex Shelter', 'shelter', 19.0892, 72.8721, 'Veera Desai Road, Andheri West, Mumbai', 1200, 90, ['water', 'food', 'medical', 'bedding', 'power'], 22),
        Z('zone-19', 'Cooper Hospital Triage Point', 'hospital', 19.0633, 72.8847, 'JVPD Scheme, Juhu, Mumbai', 400, 120, ['medical', 'water', 'power'], 22),
        Z('zone-20', 'Gilbert Hill Open Ground', 'open_ground', 19.0689, 72.8644, 'Sagar City, Andheri West, Mumbai', 1800, 0, ['water', 'comms'], 20),
        // Chennai — serves Besant Nagar (seed-14)
        Z('zone-21', 'Olcott School Shelter', 'school', 13.0889, 80.2744, 'Besant Avenue, Adyar, Chennai', 700, 60, ['water', 'food', 'bedding'], 18),
        Z('zone-22', 'Island Grounds Relief Camp', 'relief_camp', 13.0677, 80.2745, 'Island Grounds, Marina Beach Road, Chennai', 2500, 300, ['water', 'food', 'medical', 'bedding', 'power', 'comms'], 18),
        // Ahmedabad — serves Naroda GIDC (seed-17)
        Z('zone-23', 'Naroda Fire Station Ground', 'open_ground', 23.0301, 72.5633, 'Naroda GIDC Phase 2, Ahmedabad', 1000, 0, ['water', 'comms'], 16),
        Z('zone-24', 'Civil Hospital Asarwa Point', 'hospital', 23.0522, 72.6033, 'Civil Hospital Campus, Asarwa, Ahmedabad', 500, 150, ['medical', 'water', 'power'], 16),
        // Guwahati top-up (seed-11) + Puri top-up (seed-13)
        Z('zone-25', 'Judges Field Open Shelter', 'open_ground', 26.1566, 91.7455, 'Judges Field, Guwahati, Assam', 1500, 200, ['water', 'food', 'comms'], 14),
        Z('zone-26', 'District HQ Hospital Point', 'hospital', 19.8089, 85.8366, 'Vip Road, Puri, Odisha', 300, 70, ['medical', 'water', 'power'], 12),
        // Shimla — serves Sanjauli (seed-03)
        Z('zone-27', 'IGMC Hospital Triage Point', 'hospital', 31.1089, 77.1801, 'IGMC Campus, Shimla, Himachal Pradesh', 350, 95, ['medical', 'water', 'power', 'comms'], 10),
        Z('zone-28', 'Chaura Maidan Open Shelter', 'open_ground', 31.0966, 77.1644, 'Chaura Maidan, Shimla', 1200, 0, ['water', 'comms'], 10),
        // Haridwar top-up (seed-06)
        Z('zone-29', 'District Hospital Haridwar Point', 'hospital', 29.9399, 78.1522, 'Upper Road, Haridwar, Uttarakhand', 300, 55, ['medical', 'water', 'power'], 8),
        // Andaman staging post for Barren Island waters (seed-16)
        Z('zone-30', 'Port Blair Staging Camp', 'relief_camp', 11.6644, 92.7412, 'Corbyns Cove Road, Port Blair, Andaman & Nicobar', 800, 20, ['water', 'food', 'medical', 'bedding', 'power', 'comms'], 6),
    ];
    const alerts = reports
        .filter((r) => r.severity === 'critical' || r.severity === 'high' || r.status === 'pending')
        .slice(0, 12)
        .map((r, i) => ({
        id: `alert-seed-${String(i + 1).padStart(2, '0')}`,
        report_id: r.id,
        severity: r.severity,
        message: r.status === 'pending'
            ? `New ${r.severity} ${r.disaster_type.replace(/_/g, ' ')} incident awaiting triage — ${r.address}`
            : `${r.severity.toUpperCase()} ${r.disaster_type.replace(/_/g, ' ')} incident ${r.status} — ${r.address}`,
        created_at: r.created_at,
    }));
    const notifications = [
        {
            id: 'notif-seed-01',
            user_id: admin.id,
            report_id: 'seed-09',
            title: 'Critical earthquake near Tehri Garhwal',
            message: 'Strong tremor reported on Dhanaulti Road. Damage assessment requested.',
            is_read: false,
            created_at: hoursAgo(2),
        },
        {
            id: 'notif-seed-02',
            user_id: admin.id,
            report_id: 'seed-17',
            title: 'Blast in Naroda industrial area',
            message: 'Chemical godown blast with injuries. Immediate triage required.',
            is_read: false,
            created_at: hoursAgo(5),
        },
        {
            id: 'notif-seed-03',
            user_id: admin.id,
            report_id: 'seed-01',
            title: 'Report moved to Investigating',
            message: 'Dehradun wildfire report assigned to ground team Alpha.',
            is_read: true,
            created_at: hoursAgo(6),
        },
    ];
    return { version: 3, profiles, reports, alerts, notifications, zones };
}
function load() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.version === 3 && Array.isArray(parsed.reports))
                return parsed;
        }
        // Migrate: drop older mock databases (zones dataset changed).
        localStorage.removeItem('rakshagis_mock_v1');
        localStorage.removeItem('rakshagis_mock_v2');
    }
    catch {
        /* corrupted storage -> reseed */
    }
    const fresh = seed();
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    }
    catch {
        /* storage unavailable -> keep in memory only */
    }
    return fresh;
}
let mem = null;
function db() {
    if (!mem)
        mem = load();
    return mem;
}
function save() {
    if (!mem)
        return;
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(mem));
    }
    catch {
        /* ignore quota errors */
    }
    window.dispatchEvent(new CustomEvent('rakshagis:reports-changed'));
}
function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
const asyncWrap = async (v) => v;
/* ---------------- Session ---------------- */
export function mockGetSessionId() {
    try {
        return localStorage.getItem(SESSION_KEY);
    }
    catch {
        return null;
    }
}
export function mockSetSessionId(id) {
    try {
        if (id)
            localStorage.setItem(SESSION_KEY, id);
        else
            localStorage.removeItem(SESSION_KEY);
    }
    catch {
        /* ignore */
    }
}
export function mockGetSessionProfile() {
    const id = mockGetSessionId();
    if (!id)
        return asyncWrap(null);
    const found = db().profiles.find((p) => p.id === id) ?? null;
    return asyncWrap(found);
}
/* ---------------- Auth ---------------- */
export async function mockSignUp(input) {
    const store = db();
    const email = input.email.trim().toLowerCase();
    if (store.profiles.some((p) => p.email === email)) {
        throw new Error('An account with this email already exists. Please sign in.');
    }
    const profile = {
        id: uid('user'),
        email,
        full_name: input.full_name.trim(),
        phone: input.phone?.trim() || null,
        role: store.profiles.length === 0 ? 'admin' : 'public',
        avatar_url: null,
        created_at: new Date().toISOString(),
    };
    // NOTE: demo mode only — passwords are not stored/checked here.
    void input.password;
    store.profiles.push(profile);
    mockSetSessionId(profile.id);
    save();
    return profile;
}
export async function mockSignIn(email, password) {
    void password; // demo mode: any password works for seeded demo accounts
    const store = db();
    const found = store.profiles.find((p) => p.email === email.trim().toLowerCase());
    if (!found)
        throw new Error('No account found for this email. Please register first.');
    mockSetSessionId(found.id);
    return found;
}
const otpStore = new Map();
export async function mockSendOtp(phone) {
    otpStore.set(phone.trim(), DEMO_OTP_CODE);
}
export async function mockVerifyOtp(input) {
    const phone = input.phone.trim();
    const expected = otpStore.get(phone) ?? DEMO_OTP_CODE;
    if (input.code.trim() !== expected)
        throw new Error('Incorrect code. Hint: demo code is 123456.');
    const store = db();
    let profile = store.profiles.find((p) => p.phone === phone) ?? null;
    if (!profile) {
        profile = {
            id: uid('user'),
            email: null,
            full_name: input.full_name?.trim() || 'Citizen Reporter',
            phone,
            role: 'public',
            avatar_url: null,
            created_at: new Date().toISOString(),
        };
        store.profiles.push(profile);
    }
    otpStore.delete(phone);
    mockSetSessionId(profile.id);
    save();
    return profile;
}
export async function mockSignOut() {
    mockSetSessionId(null);
}
/* ---------------- Reports ---------------- */
export function mockListReports() {
    const rows = [...db().reports].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return asyncWrap(rows);
}
export function mockGetReport(id) {
    return asyncWrap(db().reports.find((r) => r.id === id) ?? null);
}
export function mockCreateReport(input, reporter, severity) {
    const store = db();
    const now = new Date().toISOString();
    const report = {
        id: uid('rpt'),
        reporter_id: reporter?.id ?? null,
        reporter_name: reporter?.full_name ?? 'Anonymous citizen',
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
        created_at: now,
        updated_at: now,
    };
    store.reports.unshift(report);
    const typeLabel = report.disaster_type.replace(/_/g, ' ');
    store.alerts.unshift({
        id: uid('alert'),
        report_id: report.id,
        severity,
        message: `New ${severity} ${typeLabel} incident — ${report.address}`,
        created_at: now,
    });
    // Notify all admins
    for (const admin of store.profiles.filter((p) => p.role === 'admin')) {
        store.notifications.unshift({
            id: uid('notif'),
            user_id: admin.id,
            report_id: report.id,
            title: `${severity === 'critical' ? 'Critical' : 'New'} ${typeLabel} incident`,
            message: `${typeLabel} at ${report.address}`,
            is_read: false,
            created_at: now,
        });
    }
    save();
    return asyncWrap(report);
}
export function mockUpdateReport(id, patch) {
    const store = db();
    const report = store.reports.find((r) => r.id === id);
    if (!report)
        throw new Error('Report not found.');
    if (patch.severity)
        report.severity = patch.severity;
    if (patch.status)
        report.status = patch.status;
    report.updated_at = new Date().toISOString();
    store.alerts.unshift({
        id: uid('alert'),
        report_id: report.id,
        severity: report.severity,
        message: `Report ${report.id.slice(0, 8)} updated → ${report.status} (${report.severity})`,
        created_at: report.updated_at,
    });
    save();
    return asyncWrap(report);
}
/* ---------------- Safe zones ---------------- */
export function mockListZones() {
    const rows = [...db().zones].sort((a, b) => a.name.localeCompare(b.name));
    return asyncWrap(rows);
}
export function mockCreateZone(input) {
    const store = db();
    const now = new Date().toISOString();
    const zone = {
        id: uid('zone'),
        ...input,
        current_occupancy: 0,
        created_at: now,
        updated_at: now,
    };
    store.zones.push(zone);
    save();
    return asyncWrap(zone);
}
export function mockUpdateZone(id, patch) {
    const store = db();
    const zone = store.zones.find((z) => z.id === id);
    if (!zone)
        throw new Error('Safe zone not found.');
    Object.assign(zone, patch, { updated_at: new Date().toISOString() });
    save();
    return asyncWrap(zone);
}
export function mockDeleteZone(id) {
    const store = db();
    store.zones = store.zones.filter((z) => z.id !== id);
    save();
    return asyncWrap(undefined);
}
/* ---------------- Alerts / notifications ---------------- */
export function mockListAlerts(limit = 50) {
    return asyncWrap([...db().alerts].slice(0, limit));
}
export function mockListNotifications(userId) {
    const rows = db()
        .notifications.filter((n) => n.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 30);
    return asyncWrap(rows);
}
export function mockMarkNotificationRead(id) {
    const n = db().notifications.find((x) => x.id === id);
    if (n) {
        n.is_read = true;
        save();
    }
    return asyncWrap(undefined);
}
/* ---------------- Admin: users ---------------- */
export function mockListProfiles() {
    return asyncWrap([...db().profiles]);
}
export function mockSetRole(id, role) {
    const store = db();
    const p = store.profiles.find((x) => x.id === id);
    if (!p)
        throw new Error('User not found.');
    const adminCount = store.profiles.filter((x) => x.role === 'admin').length;
    if (p.role === 'admin' && role !== 'admin' && adminCount <= 1) {
        throw new Error('Cannot demote the last remaining admin.');
    }
    p.role = role;
    save();
    return asyncWrap(p);
}
/* ---------------- Realtime (demo) ---------------- */
export function mockSubscribe(cb) {
    const handler = () => cb();
    window.addEventListener('rakshagis:reports-changed', handler);
    return () => window.removeEventListener('rakshagis:reports-changed', handler);
}
export function mockResetDemo() {
    mem = seed();
    save();
}
