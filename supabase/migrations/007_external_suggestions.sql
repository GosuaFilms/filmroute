-- Oportunidades encontradas por la IA en la web que no están en la base de datos.
-- Se acumulan sin duplicados para que un admin las revise y las añada con un clic.
create table if not exists external_suggestions (
  id uuid default gen_random_uuid() primary key,
  kind text not null check (kind in ('festival', 'platform')),
  name_key text not null,
  name text not null,
  country text not null default '',
  city text not null default '',
  dates text not null default '',
  deadline text not null default '',
  submission_fee text not null default '',
  platform_type text not null default '',
  territory text not null default '',
  notes text not null default '',
  url text not null default '',
  -- Tipos y géneros de las películas para las que se ha sugerido (ayuda a clasificarla al añadirla)
  film_types text[] not null default '{}',
  film_genres text[] not null default '{}',
  times_suggested integer not null default 1,
  status text not null default 'pendiente' check (status in ('pendiente', 'añadida', 'descartada')),
  first_suggested_at timestamptz default now() not null,
  last_suggested_at timestamptz default now() not null,
  unique (kind, name_key)
);

create index if not exists external_suggestions_status_idx on external_suggestions(status, last_suggested_at desc);

alter table external_suggestions enable row level security;

-- Solo los admins leen y gestionan; los usuarios registran a través de la función de abajo
create policy "Admins leen sugerencias"
  on external_suggestions for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins actualizan sugerencias"
  on external_suggestions for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins eliminan sugerencias"
  on external_suggestions for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Registra o actualiza una sugerencia. El año se quita del nombre para que
-- «Premios Feroz 2027» y «Premios Feroz 2028» cuenten como la misma.
create or replace function public.record_external_suggestion(
  p_kind text,
  p_name text,
  p_country text,
  p_city text,
  p_dates text,
  p_deadline text,
  p_submission_fee text,
  p_platform_type text,
  p_territory text,
  p_notes text,
  p_url text,
  p_film_type text,
  p_film_genre text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_key text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if p_kind not in ('festival', 'platform') or coalesce(trim(p_name), '') = '' or p_url !~* '^https?://' then
    return;
  end if;
  v_key := trim(regexp_replace(lower(left(p_name, 200)), '\s*\m(19|20)\d{2}\M\s*', ' ', 'g'));

  insert into external_suggestions as s (
    kind, name_key, name, country, city, dates, deadline, submission_fee,
    platform_type, territory, notes, url, film_types, film_genres
  ) values (
    p_kind, v_key, left(trim(p_name), 200), left(coalesce(p_country, ''), 100), left(coalesce(p_city, ''), 100),
    left(coalesce(p_dates, ''), 200), left(coalesce(p_deadline, ''), 200), left(coalesce(p_submission_fee, ''), 100),
    left(coalesce(p_platform_type, ''), 100), left(coalesce(p_territory, ''), 200), left(coalesce(p_notes, ''), 2000),
    left(p_url, 500),
    case when coalesce(p_film_type, '') = '' then '{}' else array[left(p_film_type, 50)] end,
    case when coalesce(p_film_genre, '') = '' then '{}' else array[left(p_film_genre, 50)] end
  )
  on conflict (kind, name_key) do update set
    name = excluded.name,
    country = excluded.country,
    city = excluded.city,
    dates = excluded.dates,
    deadline = excluded.deadline,
    submission_fee = excluded.submission_fee,
    platform_type = excluded.platform_type,
    territory = excluded.territory,
    notes = excluded.notes,
    url = excluded.url,
    film_types = (select coalesce(array_agg(distinct t), '{}') from unnest(s.film_types || excluded.film_types) t),
    film_genres = (select coalesce(array_agg(distinct g), '{}') from unnest(s.film_genres || excluded.film_genres) g),
    times_suggested = s.times_suggested + 1,
    last_suggested_at = now();
end;
$$;

revoke all on function public.record_external_suggestion(text, text, text, text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.record_external_suggestion(text, text, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
