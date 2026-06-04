# PKL Report System

Next.js + Supabase app untuk laporan harian PKL, rekap, export, dan AI tools.

## Setup

1. Salin `.env.example` menjadi `.env.local`.
2. Isi Supabase URL, publishable/anon key, secret/service-role key, `DATABASE_URL`, dan `AI_CONFIG_SECRET`.
3. Jalankan SQL di `supabase/schema.sql` lewat Supabase SQL Editor.
4. Install dan jalankan app:

```bash
npm install
npm run dev
```

## Admin Pertama

Setelah user pertama register, jadikan admin lewat Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'email-admin@example.com';
```

## AI Provider

Admin mengelola provider AI di `/admin/ai`. API key disimpan terenkripsi dan hanya dipakai di server.

## PostgreSQL

Supabase sudah memakai PostgreSQL. Untuk Supabase, gunakan `supabase/schema.sql`.

Kalau ingin schema PostgreSQL standalone tanpa fitur Supabase Auth/Storage, gunakan:

```bash
psql "$DATABASE_URL" -f database/postgresql.sql
```
