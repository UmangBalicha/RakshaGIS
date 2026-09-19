# RakshaGIS — All-Hazards Incident Reporting, Monitoring & Evacuation

Public citizens file geo-tagged incident reports for any disaster — natural or
man-made — in under a minute; authority staff triage them on a live map
console. Every incident shows nearby safe zones with live OSRM road routing
and turn-by-turn evacuation directions. Light theme throughout, mobile-first
public site, desktop-first admin console.

**Stack:** React 19 + Vite + TypeScript · Tailwind CSS v4 · Leaflet + OpenStreetMap ·
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

## Going live with Supabase

1. Create a project at https://supabase.com, then run `supabase/schema.sql`
   once in the SQL editor (creates tables, RLS, triggers, storage policies).
2. Storage: the schema creates a public `report-images` bucket automatically.
3. Auth: enable **Email** and **Phone (SMS)** providers as needed.
4. Realtime: Database → Replication → enable `disaster_reports` and `safe_zones`.
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
  app/router.tsx            # all routes (public + /admin)
  components/
    ui.tsx                  # shadcn-style primitives (light theme)
    layout/                 # PublicLayout, AdminLayout, RequireAuth/Admin
    map/                    # IncidentMap (live markers, danger zones, routes), LocationPicker
    evacuation/             # EvacuationPanel (nearest zones + turn-by-turn)
    reports/                # filters bar, detail + triage + evacuation modal
  lib/
    routing.ts              # OSRM evacuation routing (free, no key, offline fallback)
    api.ts                  # unified data layer (Supabase ↔ demo mock)
    auth.ts                 # email/password + phone OTP (both backends)
    mock.ts                 # demo-mode backend (localStorage + seed)
    supabase.ts             # client (null when unconfigured)
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
