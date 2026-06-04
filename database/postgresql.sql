create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  nama text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activity_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tanggal date not null,
  activity_category_id uuid references activity_categories(id) on delete set null,
  kegiatan text not null,
  kendala text,
  solusi text,
  status text not null default 'belum_selesai' check (status in ('selesai', 'belum_selesai')),
  dokumentasi_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null default 'https://api.openai.com/v1',
  model text not null,
  api_key_encrypted text not null,
  is_active boolean not null default false,
  enabled_features jsonb not null default '["polish","summarize","draft","suggest_solution","categorize"]'::jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_user_date_idx on reports(user_id, tanggal desc);
create index if not exists reports_status_idx on reports(status);
create index if not exists ai_providers_active_idx on ai_providers(is_active);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on profiles;
create trigger profiles_touch_updated_at
before update on profiles
for each row execute function touch_updated_at();

drop trigger if exists reports_touch_updated_at on reports;
create trigger reports_touch_updated_at
before update on reports
for each row execute function touch_updated_at();

drop trigger if exists ai_providers_touch_updated_at on ai_providers;
create trigger ai_providers_touch_updated_at
before update on ai_providers
for each row execute function touch_updated_at();

insert into activity_categories (name)
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
