# RakshaGIS — All-Hazards Incident Reporting, Monitoring & Evacuation

> Built by **Umang Balicha**.

Public citizens file geo-tagged incident reports for any disaster — natural or
man-made — in under a minute; authority staff triage them on a live map
console. Every incident shows nearby safe zones with live OSRM road routing
and turn-by-turn evacuation directions. Light theme throughout, mobile-first
public site, desktop-first admin console.

**Stack:** React 19 + Vite + JavaScript · Tailwind CSS v4 · Leaflet + OpenStreetMap ·
Supabase (Postgres, Auth, Storage, Realtime) · Zustand · Recharts · Vercel-ready.

## Zero-setup demo mode

No backend keys? The app runs anyway with seeded local data:

```bash
npm install
npm run dev
```

Demo accounts (demo mode only):

| Role   | Email              | Password |
| ------ | ------------------ | -------- |
| Admin  | admin@rakshagis.in | admin123 |
| Public | user@rakshagis.in  | user123  |

Phone OTP in demo mode accepts any 10-digit number with code `123456`.

## Disaster coverage (11 types)

Earthquake · Flood · Wildfire · Cyclone/Storm · Landslide · Tsunami ·
Building Fire · Industrial Accident · Chemical Leak · Volcanic Activity · Other

## Evacuation routing

- Safe zones (shelters, hospitals, open grounds, relief camps, schools) are
  managed by admins at `/admin/safe-zones` (map picker + capacity + amenities).
- Citizens tap **Evacuate →** on any incident to see the 3 nearest safe zones
  ranked by live road time, with turn-by-turn directions (OSRM, driving/walking)
  and an "Open live navigation" deep link. Works offline with straight-line
  fallback when the routing server is unreachable.

## Red zones & relocation intelligence

The decision-support layer for proactive SDMA planning (see
`src/lib/intelligence.js` — deterministic, explainable scoring, no black box):

- **Red zones** (`/admin/red-zones`): persistent multi-hazard areas unfit for
  permanent habitation, drawn as dashed red circles on every map. Admins declare
  them manually or via **Auto-detect**, which clusters live incident reports
  (2+ within 5 km) into candidates. Each zone carries an evidence score
  (history 40 + severity 30 + recency 20 + exposure 10) mapped to
  Low / Moderate / High / Extreme, plus an exposed-population count.
- **Relocation planner** (`/admin/relocation`): habitations (villages, towns,
  wards with population, vulnerable groups and kutcha-housing share) are scored
  on exposure × vulnerability × history and phased into **Immediate (≥70) /
  Short-term (≥45) / Medium-term (≥25) / Monitoring**, each with audit reasons.
- **Carrying capacity**: safe zones flagged as relocation sites are graded
  A–D on amenities, infrastructure access, spare capacity and red-zone
  separation; the planner tracks `capacity − sheltered − allocated` per site
  and flags over-capacity in red. Allocations are edited inline.
- Covered by `src/lib/intelligence.test.js` (13 tests) and demo seed data
  (6 red zones, 10 habitations, 4 relocation sites).

## Going live with Supabase

1. Create a project at https://supabase.com, then run `supabase/schema.sql`
   once in the SQL editor (creates tables, RLS, triggers, storage policies).
   Then run `supabase/relocation_schema.sql` for the red-zone, habitation and
   site-assessment tables.
2. Storage: the schema creates a public `report-images` bucket automatically.
3. Auth: enable **Email** and **Phone (SMS)** providers as needed.
4. Realtime: Database → Replication → enable `disaster_reports`, `safe_zones`,
   `red_zones` and `habitations`.
5. Copy `.env.example` to `.env` and fill in:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. (Optional) Deploy `supabase/functions/send-notification` for SMS/webhook
   paging on critical reports.

## Deploy to Vercel

```bash
npm run build
```

Push to GitHub → Import in Vercel → add the two `VITE_SUPABASE_*` env vars.
No server needed — the frontend talks to Supabase directly.

## Project layout

```
src/
  app/router.js             # all routes (public + /admin)
  components/
    ui.js                   # shadcn-style primitives (light theme)
    layout/                 # PublicLayout, AdminLayout, RequireAuth/Admin
    map/                    # IncidentMap (live markers, danger zones, routes), LocationPicker
    evacuation/             # EvacuationPanel (nearest zones + turn-by-turn)
    reports/                # filters bar, detail + triage + evacuation modal
  lib/
    routing.js              # OSRM evacuation routing (free, no key, offline fallback)
    api.js                  # unified data layer (Supabase ↔ demo mock)
    auth.js                 # email/password + phone OTP (both backends)
    mock.js                 # demo-mode backend (localStorage + seed)
    supabase.js             # client (null when unconfigured)
  stores/                   # zustand: auth, reports
  pages/                    # Home, ReportDisaster, TrackReport, auth, admin/*
supabase/
  schema.sql                # full backend in one file
  functions/send-notification/
```

## Key behaviours

- **Guest reporting allowed** — no account needed to file an incident report.
- **Severity** is suggested from the report (injuries → critical; quake/tsunami/cyclone → critical) and can be overridden by an admin during triage.
- **Statuses:** pending → investigating → contained → resolved (+ false_alarm).
- **Realtime:** Supabase Realtime when live; local event fan-out in demo mode.
- **Maps:** 100% OpenStreetMap — no paid tile/API keys anywhere.
