create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nama text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null,
  activity_category_id uuid references public.activity_categories(id) on delete set null,
  kegiatan text not null,
  kendala text,
  solusi text,
  status text not null default 'belum_selesai' check (status in ('selesai', 'belum_selesai')),
  dokumentasi_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null default 'https://api.openai.com/v1',
  model text not null,
  api_key_encrypted text not null,
  is_active boolean not null default false,
  enabled_features jsonb not null default '["polish","summarize","draft","suggest_solution","categorize"]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_user_date_idx on public.reports(user_id, tanggal desc);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists ai_providers_active_idx on public.ai_providers(is_active);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

drop trigger if exists ai_providers_touch_updated_at on public.ai_providers;
create trigger ai_providers_touch_updated_at
before update on public.ai_providers
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nama, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1), ''),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.activity_categories enable row level security;
alter table public.reports enable row level security;
alter table public.ai_providers enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "categories_read_authenticated" on public.activity_categories;
create policy "categories_read_authenticated"
on public.activity_categories for select
to authenticated
using (true);

drop policy if exists "categories_admin_all" on public.activity_categories;
create policy "categories_admin_all"
on public.activity_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reports_select_owner_or_admin" on public.reports;
create policy "reports_select_owner_or_admin"
on public.reports for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports_insert_owner_or_admin" on public.reports;
create policy "reports_insert_owner_or_admin"
on public.reports for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports_update_owner_or_admin" on public.reports;
create policy "reports_update_owner_or_admin"
on public.reports for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports_delete_owner_or_admin" on public.reports;
create policy "reports_delete_owner_or_admin"
on public.reports for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_providers_admin_all" on public.ai_providers;
create policy "ai_providers_admin_all"
on public.ai_providers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.activity_categories (name)
values
  ('Coding'),
  ('Desain'),
  ('Input Data'),
  ('Dokumentasi'),
  ('Meeting'),
  ('Testing'),
  ('Riset'),
  ('Administrasi')
on conflict (name) do nothing;

insert into storage.buckets (id, name, public)
values ('report-documentation', 'report-documentation', false)
on conflict (id) do nothing;

drop policy if exists "documentation_owner_upload" on storage.objects;
create policy "documentation_owner_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'report-documentation'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "documentation_owner_read" on storage.objects;
create policy "documentation_owner_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'report-documentation'
  and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
);

drop policy if exists "documentation_owner_update" on storage.objects;
create policy "documentation_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'report-documentation'
  and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
)
with check (
  bucket_id = 'report-documentation'
  and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
);

drop policy if exists "documentation_owner_delete" on storage.objects;
create policy "documentation_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'report-documentation'
  and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
);
