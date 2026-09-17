create extension if not exists pg_trgm;

create table if not exists public.university_directory (
  id bigint generated always as identity primary key,
  name text not null,
  country text not null,
  country_code text,
  state_province text,
  domains text[] not null default '{}',
  web_pages text[] not null default '{}',
  source_name text not null,
  source_url text not null,
  last_synced timestamptz not null default now(),
  unique (name, country)
);

create index if not exists university_directory_name_trgm on public.university_directory using gin (name gin_trgm_ops);
create index if not exists university_directory_country on public.university_directory (country);
create index if not exists university_directory_name_order on public.university_directory (name);

alter table public.university_directory enable row level security;

drop policy if exists "public university directory" on public.university_directory;
create policy "public university directory" on public.university_directory for select using (true);

create or replace function public.university_directory_countries()
returns table (country text)
language sql
stable
as $$
  select distinct country from public.university_directory order by country;
$$;

grant execute on function public.university_directory_countries() to anon, authenticated;
