-- Module "Configuration des primes": catalogue, configuration par session/niveau/type,
-- dépenses complémentaires. Réutilise school_years/niveaux existants, et lie types_primes
-- aux codes académiques déjà calculés (results.awarded_prizes) pour un compte de
-- bénéficiaires automatique.

create table articles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  libelle text not null,
  categorie text not null,
  description text null,
  unite text not null default 'unité',
  prix_reference numeric(12, 2) not null default 0 check (prix_reference >= 0),
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_categorie_idx on articles (categorie);

create trigger articles_set_updated_at
  before update on articles
  for each row
  execute function set_updated_at();

create table types_primes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  libelle text not null,
  description text null,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

insert into types_primes (code, libelle, description) values
  ('SPECIAL', 'Prix Spécial', 'Prime associée au Prix Spécial (transitions Maternelle).'),
  ('EXC', 'Excellence', 'Prime associée au Prix d''Excellence.'),
  ('ENC', 'Encouragement', 'Prime associée au Prix d''Encouragement.'),
  ('EXC_PLUS', 'Excellence+', 'Prime associée au Prix d''Excellence obtenu deux années consécutives.');

create table configurations_primes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references school_years (id) on delete cascade,
  niveau_id uuid not null references niveaux (id) on delete cascade,
  type_prime_id uuid not null references types_primes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, niveau_id, type_prime_id)
);

create index configurations_primes_session_idx on configurations_primes (session_id);

create trigger configurations_primes_set_updated_at
  before update on configurations_primes
  for each row
  execute function set_updated_at();

create table configuration_prime_articles (
  id uuid primary key default gen_random_uuid(),
  configuration_prime_id uuid not null references configurations_primes (id) on delete cascade,
  article_id uuid not null references articles (id) on delete restrict,
  quantite numeric(10, 2) not null default 1 check (quantite > 0),
  prix_session numeric(12, 2) not null default 0 check (prix_session >= 0),
  montant numeric(14, 2) generated always as (quantite * prix_session) stored,
  observation text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (configuration_prime_id, article_id)
);

create index configuration_prime_articles_config_idx
  on configuration_prime_articles (configuration_prime_id);
create index configuration_prime_articles_article_idx
  on configuration_prime_articles (article_id);

create trigger configuration_prime_articles_set_updated_at
  before update on configuration_prime_articles
  for each row
  execute function set_updated_at();

create table depenses_complementaires (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references school_years (id) on delete cascade,
  libelle text not null,
  categorie text not null,
  description text null,
  montant numeric(12, 2) not null default 0 check (montant >= 0),
  observation text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index depenses_complementaires_session_idx on depenses_complementaires (session_id);

create trigger depenses_complementaires_set_updated_at
  before update on depenses_complementaires
  for each row
  execute function set_updated_at();

-- Row Level Security: authenticated admins only, matching every other table in this app.

alter table articles enable row level security;
alter table types_primes enable row level security;
alter table configurations_primes enable row level security;
alter table configuration_prime_articles enable row level security;
alter table depenses_complementaires enable row level security;

create policy "authenticated_full_access" on articles
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on types_primes
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on configurations_primes
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on configuration_prime_articles
  for all to authenticated using (true) with check (true);

create policy "authenticated_full_access" on depenses_complementaires
  for all to authenticated using (true) with check (true);
