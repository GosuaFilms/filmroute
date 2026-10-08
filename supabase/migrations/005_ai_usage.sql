-- Registro de generaciones con el asesor IA, para limitar el uso diario por usuario
create table if not exists ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  created_at timestamptz default now() not null
);

create index if not exists ai_usage_user_created_idx on ai_usage(user_id, created_at);

alter table ai_usage enable row level security;

-- Sin políticas de update/delete: un usuario no puede borrar su consumo
create policy "Usuarios ven su propio consumo de IA"
  on ai_usage for select using (auth.uid() = user_id);

create policy "Usuarios registran su propio consumo de IA"
  on ai_usage for insert with check (auth.uid() = user_id);
