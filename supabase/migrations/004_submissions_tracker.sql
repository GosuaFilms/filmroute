-- Tracker de envíos a festivales por estrategia
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  strategy_id uuid references strategies(id) on delete cascade not null,
  festival_name text not null,
  festival_country text not null default '',
  festival_tier text not null default 'tier_b',
  status text not null default 'pendiente'
    check (status in ('pendiente', 'enviado', 'seleccionado', 'rechazado', 'retirado')),
  submission_date date,
  deadline date,
  response_date date,
  fee_paid numeric(8, 2),
  platform text not null default '',
  notes text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists submissions_user_id_idx on submissions(user_id);
create index if not exists submissions_strategy_id_idx on submissions(strategy_id);

alter table submissions enable row level security;

create policy "Usuarios ven sus propios envíos"
  on submissions for select
  using (auth.uid() = user_id);

create policy "Usuarios crean sus propios envíos"
  on submissions for insert
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan sus propios envíos"
  on submissions for update
  using (auth.uid() = user_id);

create policy "Usuarios eliminan sus propios envíos"
  on submissions for delete
  using (auth.uid() = user_id);

create trigger submissions_updated_at
  before update on submissions
  for each row execute function update_updated_at();
