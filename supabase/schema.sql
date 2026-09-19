-- =============================================================
-- RakshaGIS — Supabase schema (Postgres + PostGIS optional)
-- All-hazards edition: disaster_reports + safe_zones.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- The app works WITHOUT this too (built-in demo mode), but running
-- it enables the live multi-user backend.
--
-- Upgrading from the old fire-only schema? Run:
--   alter table if exists public.fire_reports rename to disaster_reports;
--   alter table disaster_reports rename column fire_type to disaster_type;
-- then run this file (all statements are IF NOT EXISTS / idempotent).
-- =============================================================

-- Optional: PostGIS for future geo-radius queries.
create extension if not exists postgis;

-- ---------------- Profiles (extends auth.users) ----------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default 'Citizen Reporter',
  phone text,
  role text not null default 'public' check (role in ('public', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row on signup (reads metadata from signUp options).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Citizen Reporter'),
    new.raw_user_meta_data ->> 'phone',
    'public'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------- Disaster reports (all hazards) ----------------
create table if not exists public.disaster_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text not null default '',
  disaster_type text not null default 'other'
    check (disaster_type in (
      'earthquake', 'flood', 'wildfire', 'cyclone', 'landslide',
      'tsunami', 'building_fire', 'industrial', 'chemical',
      'volcanic', 'other'
    )),
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'pending'
    check (status in ('pending', 'investigating', 'contained', 'resolved', 'false_alarm')),
  description text not null default '',
  has_injuries boolean not null default false,
  injury_count integer not null default 0 check (injury_count >= 0),
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disaster_reports_created_idx on public.disaster_reports (created_at desc);
create index if not exists disaster_reports_status_idx on public.disaster_reports (status);
create index if not exists disaster_reports_severity_idx on public.disaster_reports (severity);
create index if not exists disaster_reports_type_idx on public.disaster_reports (disaster_type);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_disaster_reports_touch on public.disaster_reports;
create trigger trg_disaster_reports_touch
  before update on public.disaster_reports
  for each row execute function public.touch_updated_at();

-- ---------------- Safe zones (evacuation destinations) ----------------
create table if not exists public.safe_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'shelter'
    check (type in ('shelter', 'hospital', 'open_ground', 'relief_camp', 'school', 'other')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text not null default '',
  capacity integer check (capacity is null or capacity >= 0),
  current_occupancy integer not null default 0 check (current_occupancy >= 0),
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists safe_zones_active_idx on public.safe_zones (is_active);

drop trigger if exists trg_safe_zones_touch on public.safe_zones;
create trigger trg_safe_zones_touch
  before update on public.safe_zones
  for each row execute function public.touch_updated_at();

-- ---------------- Alert log ----------------
create table if not exists public.alert_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.disaster_reports(id) on delete set null,
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists alert_logs_created_idx on public.alert_logs (created_at desc);

-- ---------------- Notifications ----------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  report_id uuid references public.disaster_reports(id) on delete set null,
  title text not null,
  message text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- Fan out a notification to every admin when a report is filed.
create or replace function public.notify_admins_on_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  type_label text := replace(new.disaster_type, '_', ' ');
begin
  insert into public.alert_logs (report_id, severity, message)
  values (
    new.id, new.severity,
    'New ' || new.severity || ' ' || type_label || ' incident — ' || coalesce(new.address, '')
  );

  insert into public.notifications (user_id, report_id, title, message)
  select
    p.id, new.id,
    case when new.severity = 'critical' then 'Critical ' || type_label || ' incident' else 'New ' || type_label || ' incident' end,
    type_label || ' at ' || coalesce(new.address, 'unknown location')
  from public.profiles p
  where p.role = 'admin';

  return new;
end;
$$;

drop trigger if exists trg_notify_admins on public.disaster_reports;
create trigger trg_notify_admins
  after insert on public.disaster_reports
  for each row execute function public.notify_admins_on_report();

-- ---------------- Row Level Security ----------------
alter table public.profiles enable row level security;
alter table public.disaster_reports enable row level security;
alter table public.safe_zones enable row level security;
alter table public.alert_logs enable row level security;
alter table public.notifications enable row level security;

-- Helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: anyone can read (needed to resolve reporter names);
-- users can update only their own row; admins can update any row.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile" on public.profiles
  for update using (public.is_admin());

-- disaster_reports: public read (community map); anyone (incl. anonymous
-- guests reporting incidents) can insert; only admins can update triage.
drop policy if exists "reports readable" on public.disaster_reports;
create policy "reports readable" on public.disaster_reports for select using (true);

drop policy if exists "anyone can file a report" on public.disaster_reports;
create policy "anyone can file a report" on public.disaster_reports
  for insert with check (true);

drop policy if exists "admins triage reports" on public.disaster_reports;
create policy "admins triage reports" on public.disaster_reports
  for update using (public.is_admin());

-- safe_zones: public read (citizens need them for evacuation);
-- only admins can insert/update/delete.
drop policy if exists "zones readable" on public.safe_zones;
create policy "zones readable" on public.safe_zones for select using (true);

drop policy if exists "admins manage zones" on public.safe_zones;
create policy "admins manage zones" on public.safe_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- alert_logs: admins read; inserts happen via the trigger (security definer).
drop policy if exists "admins read alerts" on public.alert_logs;
create policy "admins read alerts" on public.alert_logs
  for select using (public.is_admin());

-- notifications: users read/update only their own.
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- ---------------- Storage: report photos ----------------
-- Create via Dashboard as well: Storage > New bucket > "report-images" (public).
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

drop policy if exists "public read report images" on storage.objects;
create policy "public read report images" on storage.objects
  for select using (bucket_id = 'report-images');

drop policy if exists "anyone can upload report images" on storage.objects;
create policy "anyone can upload report images" on storage.objects
  for insert with check (bucket_id = 'report-images');

-- ---------------- Realtime ----------------
-- Dashboard > Database > Replication: enable replication for
-- public.disaster_reports and public.safe_zones so the live map
-- updates instantly. (Supabase Realtime uses Postgres logical
-- replication; no extra infra.)
