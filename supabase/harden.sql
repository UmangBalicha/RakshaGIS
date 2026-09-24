-- =============================================================
-- RakshaGIS — SECURITY HARDENING (run once in Supabase SQL editor,
-- AFTER schema.sql + relocation_schema.sql; safe to re-run).
--
-- Fixes, without breaking the app:
--  1. profiles SELECT was `using (true)` -> anonymous PII dump of every
--     user's email + phone. Now: own row, or admin sees all. Public map
--     gracefully falls back to "Citizen Reporter" (api.js toReport()).
--  2. profiles UPDATE had no WITH CHECK -> any signup could
--     `update profiles set role='admin'`. Now: column-level grants plus a
--     trigger that rejects role changes by non-admins. Admin console
--     role management (Users page) keeps working via the admin policy.
--  3. profiles INSERT was missing -> phone-OTP first login failed RLS.
--     Now: users may insert only their own row with role 'public'.
--  4. disaster_reports INSERT was `with check (true)` -> reporter_id
--     spoofing, pre-triaged status, admin-notification spam. Now: guests
--     file with reporter_id NULL, signed-in users only as themselves,
--     status is always 'pending'. (Client sends exactly this today.)
--  5. Value guardrails the UI previously enforced browser-only:
--     description/address length, max 5 photos, sane injury counts.
--  6. Storage bucket: 4 MB + image-only MIME caps (enforced server-side
--     even for guest uploads) + an admin delete policy so abusive photos
--     can actually be taken down.
-- =============================================================

-- ---------------- 1. profiles: close the PII dump ----------------
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- ---------------- 2. profiles: kill role self-promotion ----------------
-- Table-level UPDATE off for client roles; back on only for safe columns.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url, role) on public.profiles to authenticated;

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Belt-and-braces: even if a policy ever misfires, only an admin can
-- change the role column.
create or replace function public.reject_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reject_role_escalation on public.profiles;
create trigger trg_reject_role_escalation
  before update on public.profiles
  for each row execute function public.reject_role_escalation();

-- ---------------- 3. profiles: allow first-login insert ----------------
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'public');

-- ---------------- 4. reports: no spoofing, always pending ----------------
drop policy if exists "anyone can file a report" on public.disaster_reports;
create policy "anyone can file a report" on public.disaster_reports
  for insert with check (
    (reporter_id is null or reporter_id = auth.uid())
    and status = 'pending'
  );

-- ---------------- 5. value guardrails (idempotent) ----------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'disaster_reports_description_len') then
    alter table public.disaster_reports
      add constraint disaster_reports_description_len check (char_length(description) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'disaster_reports_address_len') then
    alter table public.disaster_reports
      add constraint disaster_reports_address_len check (char_length(address) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'disaster_reports_images_cap') then
    alter table public.disaster_reports
      add constraint disaster_reports_images_cap check (coalesce(array_length(images, 1), 0) <= 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'disaster_reports_injury_cap') then
    alter table public.disaster_reports
      add constraint disaster_reports_injury_cap check (injury_count <= 100000);
  end if;
end $$;

-- ---------------- 6. storage: server-side caps + takedown path ----------------
update storage.buckets
set file_size_limit = 4194304,
    allowed_mime_types = '{image/jpeg,image/png,image/webp,image/gif}'
where id = 'report-images';

drop policy if exists "admins remove report images" on storage.objects;
create policy "admins remove report images" on storage.objects
  for delete using (bucket_id = 'report-images' and public.is_admin());
