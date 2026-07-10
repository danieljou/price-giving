-- PRICE GIVING prize classification: initial schema

create extension if not exists "pgcrypto";

create table students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date null,
  section text not null check (section in ('francophone', 'anglophone')),
  created_at timestamptz not null default now()
);

create table school_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_year int not null unique,
  created_at timestamptz not null default now()
);

create table niveaux (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('francophone', 'anglophone')),
  code text not null,
  progression_order int not null,
  unique (section, code)
);

create table criteria (
  id uuid primary key default gen_random_uuid(),
  prize_code text not null check (prize_code in ('SPECIAL', 'EXC', 'ENC')),
  section text not null check (section in ('francophone', 'anglophone')),
  niveau_depart text not null,
  niveau_admission text null,
  moyenne_min numeric(4, 2) null,
  moyenne_max numeric(4, 2) null,
  moyenne_max_inclusive boolean not null default true,
  rang_max int null,
  auto_qualify boolean not null default false,
  requires_manual_review boolean not null default false,
  condition_raw text not null,
  created_at timestamptz not null default now()
);

create index criteria_lookup_idx on criteria (section, niveau_depart, niveau_admission);

create table results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  school_year_id uuid not null references school_years (id) on delete cascade,
  section text not null check (section in ('francophone', 'anglophone')),
  niveau_depart text not null,
  niveau_admission text null,
  moyenne numeric(4, 2) null check (moyenne is null or (moyenne >= 0 and moyenne <= 20)),
  rang int null,
  awarded_prizes text[] not null default '{}',
  criteria_computed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, school_year_id)
);

create index results_school_year_idx on results (school_year_id);
create index results_student_idx on results (student_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger results_set_updated_at
  before update on results
  for each row
  execute function set_updated_at();

-- Row Level Security: authenticated admins only, no anonymous access.

alter table students enable row level security;
alter table school_years enable row level security;
alter table niveaux enable row level security;
alter table criteria enable row level security;
alter table results enable row level security;

create policy "authenticated_full_access" on students
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on school_years
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on niveaux
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on criteria
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on results
  for all to authenticated using (true) with check (true);
