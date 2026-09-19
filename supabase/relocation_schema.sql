-- RakshaGIS relocation extension (PS: red zones, habitations, site capacity).
-- Run AFTER supabase/schema.sql. All statements are idempotent.

-- ---------------- Red zones ----------------
create table if not exists public.red_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hazard_types text[] not null default '{}',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_meters integer not null default 3000 check (radius_meters >= 0),
  intensity text not null default 'moderate'
    check (intensity in ('low', 'moderate', 'high', 'extreme')),
  status text not null default 'active'
    check (status in ('active', 'monitoring', 'denotified')),
  incident_count integer not null default 0 check (incident_count >= 0),
  last_incident_at timestamptz,
  population_exposed integer not null default 0 check (population_exposed >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists red_zones_status_idx on public.red_zones (status);

drop trigger if exists trg_red_zones_touch on public.red_zones;
create trigger trg_red_zones_touch
  before update on public.red_zones
  for each row execute function public.touch_updated_at();

-- ---------------- Habitations ----------------
create table if not exists public.habitations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  habitation_type text not null default 'village'
    check (habitation_type in ('village', 'town', 'ward')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text not null default '',
  population integer not null default 0 check (population >= 0),
  households integer not null default 0 check (households >= 0),
  vulnerable_count integer not null default 0 check (vulnerable_count >= 0),
  kutcha_share integer not null default 0 check (kutcha_share between 0 and 100),
  red_zone_id uuid references public.red_zones(id) on delete set null,
  past_incidents integer not null default 0 check (past_incidents >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habitations_zone_idx on public.habitations (red_zone_id);

drop trigger if exists trg_habitations_touch on public.habitations;
create trigger trg_habitations_touch
  before update on public.habitations
  for each row execute function public.touch_updated_at();

-- ---------------- Safe-zone relocation assessment ----------------
alter table public.safe_zones
  add column if not exists is_relocation_site boolean not null default false,
  add column if not exists water_access boolean not null default false,
  add column if not exists road_access boolean not null default false,
  add column if not exists health_access boolean not null default false,
  add column if not exists school_access boolean not null default false,
  add column if not exists allocated_population integer not null default 0
    check (allocated_population >= 0);

-- ---------------- Row Level Security ----------------
alter table public.red_zones enable row level security;
alter table public.habitations enable row level security;

-- Public read (citizens see red zones on the map); only admins write.
drop policy if exists "red zones readable" on public.red_zones;
create policy "red zones readable" on public.red_zones for select using (true);

drop policy if exists "admins manage red zones" on public.red_zones;
create policy "admins manage red zones" on public.red_zones
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "habitations readable" on public.habitations;
create policy "habitations readable" on public.habitations for select using (true);

drop policy if exists "admins manage habitations" on public.habitations;
create policy "admins manage habitations" on public.habitations
  for all using (public.is_admin()) with check (public.is_admin());
