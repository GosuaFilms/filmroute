-- Tabla de estrategias de distribución por usuario
create table if not exists strategies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  film_title text not null default 'Sin título',
  film_data jsonb not null default '{}',
  report jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índice para consultas por usuario
create index if not exists strategies_user_id_idx on strategies(user_id);

-- Row Level Security: cada usuario solo ve sus propias estrategias
alter table strategies enable row level security;

create policy "Usuarios ven sus propias estrategias"
  on strategies for select
  using (auth.uid() = user_id);

create policy "Usuarios crean sus propias estrategias"
  on strategies for insert
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan sus propias estrategias"
  on strategies for update
  using (auth.uid() = user_id);

create policy "Usuarios eliminan sus propias estrategias"
  on strategies for delete
  using (auth.uid() = user_id);

-- Trigger para actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger strategies_updated_at
  before update on strategies
  for each row execute function update_updated_at();
