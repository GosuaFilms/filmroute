-- Cobros con Stripe: licencias por película, suscripción del plan productora y registro de análisis.
-- Solo el servidor (clave service_role) escribe en estas tablas; cada usuario lee las suyas.

-- Cliente de Stripe y suscripción del plan productora (una fila por usuario)
create table if not exists billing_accounts (
  user_id uuid references auth.users(id) on delete cascade primary key,
  stripe_customer_id text unique,
  subscription_id text unique,
  subscription_status text,
  subscription_interval text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz default now() not null
);

alter table billing_accounts enable row level security;
create policy "Usuarios ven su cuenta de cobro"
  on billing_accounts for select using (auth.uid() = user_id);

-- Licencia por película: 1 análisis inicial + 5 actualizaciones durante 12 meses desde que se asigna
create table if not exists film_licenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy_id uuid references strategies(id) on delete set null,
  analyses_used integer not null default 0,
  analyses_limit integer not null default 6,
  expires_at timestamptz,
  stripe_session_id text unique,
  created_at timestamptz default now() not null
);

create index if not exists film_licenses_user_idx on film_licenses(user_id, strategy_id);

alter table film_licenses enable row level security;
create policy "Usuarios ven sus licencias"
  on film_licenses for select using (auth.uid() = user_id);

-- Cada análisis autorizado. La investigación web y la redacción solo se aceptan con un análisis
-- reciente del usuario, y cada fase una sola vez.
create table if not exists analysis_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy_id uuid references strategies(id) on delete set null,
  source text not null check (source in ('film', 'subscription', 'admin')),
  license_id uuid references film_licenses(id) on delete set null,
  research_used boolean not null default false,
  generate_used boolean not null default false,
  created_at timestamptz default now() not null
);

create index if not exists analysis_runs_user_idx on analysis_runs(user_id, created_at desc);

alter table analysis_runs enable row level security;
create policy "Usuarios ven sus análisis"
  on analysis_runs for select using (auth.uid() = user_id);
