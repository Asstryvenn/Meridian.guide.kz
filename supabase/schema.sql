create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  country text,
  school text,
  grade smallint,
  graduation_year smallint,
  age smallint,
  fields text[] not null default '{}',
  interests_note text,
  annual_budget_usd integer,
  tuition_min_usd integer,
  tuition_max_usd integer,
  needs_aid boolean not null default false,
  scholarship_required boolean not null default false,
  preferred_countries text[] not null default '{}',
  preferred_regions text[] not null default '{}',
  campus_type text not null default 'any',
  institution_type text not null default 'any',
  size text not null default 'any',
  career_goal text,
  grad_school text not null default 'undecided',
  archetype text,
  pomodoro_minutes integer default 0,
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  grading_system text not null default 'gpa4',
  gpa numeric(5, 2),
  sat smallint,
  act smallint,
  ib smallint,
  a_levels text,
  ap_courses text,
  ielts numeric(3, 1),
  toefl smallint,
  duolingo smallint,
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  title text not null,
  role text,
  level text not null,
  impact text,
  evidence text,
  link text,
  hours_per_week smallint not null default 0,
  primary key (user_id, id)
);

create table if not exists public.universities (
  slug text primary key,
  name text not null,
  country text not null,
  region text not null,
  data jsonb not null,
  source_url text,
  source_name text,
  last_verified date,
  confidence text check (confidence in ('high', 'medium', 'low'))
);

create table if not exists public.scholarships (
  id text primary key,
  name text not null,
  provider text not null,
  data jsonb not null,
  source_url text,
  source_name text,
  last_verified date,
  confidence text check (confidence in ('high', 'medium', 'low'))
);

create table if not exists public.professors (
  id text primary key,
  name text not null,
  university_slug text references public.universities (slug),
  department text,
  areas text[] not null default '{}',
  source_url text,
  source_name text,
  last_verified date,
  confidence text check (confidence in ('high', 'medium', 'low'))
);

create table if not exists public.applications (
  user_id uuid not null references auth.users (id) on delete cascade,
  university_slug text not null,
  status text not null default 'researching',
  documents jsonb not null default '[]',
  essays jsonb not null default '[]',
  scholarship_ids text[] not null default '{}',
  notes text,
  added_at timestamptz not null default now(),
  primary key (user_id, university_slug)
);

create table if not exists public.tasks (
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

create table if not exists public.documents (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  name text not null,
  file_name text,
  file_size text,
  status text not null default 'missing',
  uploaded_at timestamptz default now(),
  notes text,
  primary key (user_id, id)
);

create table if not exists public.roadmap_tasks (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  detail text not null default '',
  kind text not null default 'activity',
  level smallint not null default 1,
  xp smallint not null default 100,
  due_date date,
  university_slug text,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.profiles enable row level security;
alter table public.academic_records enable row level security;
alter table public.activities enable row level security;
alter table public.applications enable row level security;
alter table public.tasks enable row level security;
alter table public.universities enable row level security;
alter table public.scholarships enable row level security;
alter table public.professors enable row level security;
alter table public.documents enable row level security;
alter table public.roadmap_tasks enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own academic record" on public.academic_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activities" on public.activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own applications" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own documents" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own roadmap_tasks" on public.roadmap_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public universities" on public.universities for select using (true);
create policy "public scholarships" on public.scholarships for select using (true);
create policy "public professors" on public.professors for select using (true);
