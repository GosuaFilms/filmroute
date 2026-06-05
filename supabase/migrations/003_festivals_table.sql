-- ─── Tabla de perfiles de usuario (rol admin) ────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  is_admin boolean not null default false,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Usuarios ven su propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Solo admins actualizan perfiles"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Tabla de festivales ──────────────────────────────────────────────────────
create table if not exists festivals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  country text not null,
  city text not null,
  tier text not null check (tier in ('tier_a','tier_b','tier_c','nacional','regional')),
  month text not null,
  deadline text not null,
  submission_fee text not null,
  platform text not null,
  url text not null,
  genres text[] not null default '{}',
  accepts_types text[] not null default '{}',
  prestige integer not null default 50 check (prestige between 0 and 100),
  reason text not null default '',
  active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists festivals_tier_idx on festivals(tier);
create index if not exists festivals_active_idx on festivals(active);

alter table festivals enable row level security;

-- Cualquier usuario autenticado puede leer
create policy "Usuarios autenticados leen festivales"
  on festivals for select to authenticated using (true);

-- Solo admins pueden escribir
create policy "Admins crean festivales"
  on festivals for insert to authenticated
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins actualizan festivales"
  on festivals for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins eliminan festivales"
  on festivals for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Trigger updated_at
create trigger festivals_updated_at
  before update on festivals
  for each row execute function update_updated_at();

-- ─── Seed: 33 festivales (ciclo 2025-2026) ───────────────────────────────────
insert into festivals (name, country, city, tier, month, deadline, submission_fee, platform, url, genres, accepts_types, prestige, reason) values
('Festival de Cannes','Francia','Cannes','tier_a','Mayo','Enero-Febrero','Gratuito (por invitación)','Directo','https://www.festival-cannes.com',array['drama','thriller','experimental','documental_social'],array['cortometraje','largometraje','documental'],100,'El festival más prestigioso del mundo. Palme d''Or. Imprescindible para cine de autor y drama de calidad.'),
('Berlinale (Festival de Berlín)','Alemania','Berlín','tier_a','Febrero','Octubre-Noviembre','70-120€','FilmFreeway / Directo','https://www.berlinale.de',array['drama','documental_social','experimental','thriller','romance'],array['cortometraje','largometraje','documental'],98,'Uno de los tres grandes festivales europeos. Oso de Oro. Muy receptivo a cine político, social y LGBTQ+.'),
('Festival de Venecia','Italia','Venecia','tier_a','Agosto-Septiembre','Junio','Gratuito (por invitación)','Directo','https://www.labiennale.org',array['drama','experimental','biopic','thriller','ciencia_ficcion'],array['cortometraje','largometraje','documental'],98,'El festival de cine más antiguo del mundo. León de Oro. Muy abierto a propuestas audaces y riesgo artístico.'),
('Sundance Film Festival','Estados Unidos','Park City, Utah','tier_a','Enero','Agosto-Octubre','65-100 USD','FilmFreeway','https://www.sundance.org',array['drama','documental_social','comedia','thriller'],array['cortometraje','largometraje','documental'],96,'El festival independiente más importante del mundo. Puerta de entrada al mercado norteamericano y plataformas globales.'),
('Locarno Film Festival','Suiza','Locarno','tier_a','Agosto','Marzo-Abril','30-60 CHF','FilmFreeway / Directo','https://www.locarnofestival.ch',array['drama','experimental','documental_social','thriller','animacion'],array['cortometraje','largometraje','documental'],92,'Festival histórico de primer orden. Leopardo de Oro. Muy valorado para cine de autor y óperas primas.'),
('TIFF (Toronto International Film Festival)','Canadá','Toronto','tier_a','Septiembre','Abril-Mayo','75-125 CAD','FilmFreeway','https://www.tiff.net',array['drama','comedia','thriller','documental_social','biopic'],array['cortometraje','largometraje','documental'],94,'Trampolín clave hacia los Oscars. Muy fuerte en adquisiciones internacionales y ventas a plataformas.'),
('Busan International Film Festival (BIFF)','Corea del Sur','Busan','tier_a','Octubre','Junio-Julio','Gratuito','Directo','https://www.biff.kr',array['drama','thriller','documental_social','experimental','romance'],array['cortometraje','largometraje','documental'],90,'El festival más importante de Asia. Esencial para acceder al mercado asiático.'),
('San Sebastián Zinemaldia','España','San Sebastián','tier_a','Septiembre','Junio-Julio','50-80€','FilmFreeway / Directo','https://www.sansebastianfestival.com',array['drama','thriller','comedia','documental_social','biopic'],array['cortometraje','largometraje','documental'],88,'El festival más importante de España. Concha de Oro. Referente para cine en español e iberoamericano.'),
('Tribeca Film Festival','Estados Unidos','Nueva York','tier_a','Junio','Enero-Febrero','50-75 USD','FilmFreeway','https://www.tribecafilm.com',array['drama','documental_social','comedia','experimental'],array['cortometraje','largometraje','documental'],85,'Festival líder en Nueva York con gran visibilidad mediática, industria y plataformas digitales.'),
('Annecy — Festival Internacional de Animación','Francia','Annecy','tier_a','Junio','Enero-Febrero','20-45€','FilmFreeway / Directo','https://www.annecy.org',array['animacion'],array['cortometraje','largometraje','mediometraje'],95,'El festival de animación más importante del mundo. Imprescindible para cualquier proyecto animado.'),
('Clermont-Ferrand','Francia','Clermont-Ferrand','tier_b','Enero-Febrero','Septiembre-Octubre','10-15€','FilmFreeway / Directo','https://www.clermont-filmfest.com',array['drama','comedia','experimental','animacion','documental_social'],array['cortometraje'],92,'El festival de cortometrajes más importante del mundo. Mercado activo. Imprescindible para cortometrajistas.'),
('IDFA (Ámsterdam)','Países Bajos','Ámsterdam','tier_b','Noviembre','Agosto','25-60€','FilmFreeway','https://www.idfa.nl',array['documental_social','documental_historico','documental_naturaleza'],array['documental','cortometraje'],90,'El festival de documentales más importante del mundo. Mercado Docs for Sale. Esencial para documentales.'),
('Rotterdam (IFFR)','Países Bajos','Rotterdam','tier_b','Enero-Febrero','Septiembre-Octubre','25-45€','FilmFreeway / Directo','https://iffr.com',array['experimental','drama','documental_social','animacion'],array['cortometraje','largometraje','documental'],85,'Festival europeo de referencia para cine independiente y experimental. Fondo CineMart para coproducción.'),
('CPH:DOX (Copenhague)','Dinamarca','Copenhague','tier_b','Marzo','Noviembre-Diciembre','20-40€','FilmFreeway','https://www.cphdox.dk',array['documental_social','documental_historico','experimental'],array['documental','cortometraje'],82,'Uno de los festivales de documentales más innovadores de Europa. Muy abierto a formatos híbridos.'),
('Visions du Réel (Nyon)','Suiza','Nyon','tier_b','Abril','Diciembre-Enero','20-35 CHF','FilmFreeway / Directo','https://www.visionsdureel.ch',array['documental_social','documental_historico','experimental'],array['documental','cortometraje','mediometraje'],80,'Festival de referencia para el documental de creación en Europa.'),
('Hot Docs (Toronto)','Canadá','Toronto','tier_b','Abril-Mayo','Diciembre-Enero','50-75 CAD','FilmFreeway','https://www.hotdocs.ca',array['documental_social','documental_historico','documental_naturaleza'],array['documental'],88,'Festival de documentales líder en América del Norte con fuerte mercado de coproducción.'),
('Sitges — Festival Internacional de Cine Fantástico','España','Sitges','tier_b','Octubre','Junio-Julio','30-60€','FilmFreeway / Directo','https://www.sitgesfilmfestival.com',array['terror','ciencia_ficcion','fantasia','thriller','animacion'],array['cortometraje','largometraje'],86,'Referente mundial en cine de género fantástico y de terror. Imprescindible para el género.'),
('Sheffield DocFest','Reino Unido','Sheffield','tier_b','Junio','Enero-Febrero','25-50£','FilmFreeway','https://www.sheffdocfest.com',array['documental_social','documental_historico'],array['documental','cortometraje'],82,'El festival de documentales más importante del Reino Unido. Excelente para coproducciones UK.'),
('Festival de Málaga — Cine en Español','España','Málaga','tier_b','Marzo','Noviembre-Diciembre','Gratuito','FilmFreeway / Directo','https://www.festivaldemalaga.com',array['drama','comedia','thriller','documental_social','romance'],array['cortometraje','largometraje','documental'],80,'Festival referente para el cine en lengua española. Biznaga de Oro. Mercado activo hispanohablante.'),
('Seminci (Valladolid)','España','Valladolid','tier_b','Octubre','Julio','Gratuito','Directo','https://www.seminci.es',array['drama','experimental','documental_social','thriller'],array['cortometraje','largometraje','documental'],78,'Festival de reconocido prestigio en España. Espiga de Oro. Fuerte en cine de autor europeo.'),
('Festival de Sevilla — Cine Europeo','España','Sevilla','tier_b','Noviembre','Julio-Agosto','Gratuito','FilmFreeway / Directo','https://www.festivalcinesevilla.eu',array['drama','experimental','documental_social','comedia'],array['cortometraje','largometraje','documental'],75,'El festival de cine europeo más importante de España. Sección oficial y programación de vanguardia.'),
('FICX Gijón','España','Gijón','tier_b','Noviembre','Agosto-Septiembre','Gratuito','FilmFreeway / Directo','https://www.gijonfilmfestival.com',array['drama','experimental','thriller','animacion','documental_social'],array['cortometraje','largometraje','documental'],72,'Festival con gran reconocimiento en España. Muy valorado para jóvenes directores y cine de riesgo.'),
('Guadalajara (FICG)','México','Guadalajara','tier_b','Marzo','Noviembre-Diciembre','Gratuito','FilmFreeway / Directo','https://www.ficg.mx',array['drama','comedia','documental_social','thriller'],array['cortometraje','largometraje','documental'],80,'El festival más importante de cine iberoamericano. Esencial para el mercado latinoamericano.'),
('Bafici (Buenos Aires)','Argentina','Buenos Aires','tier_b','Abril','Diciembre-Enero','Gratuito','FilmFreeway','https://festivales.buenosaires.gob.ar/bafici',array['drama','experimental','documental_social','comedia'],array['cortometraje','largometraje','documental'],75,'Festival clave para el cine independiente latinoamericano. Muy fuerte en cine de autor.'),
('Goya — Academia de Cine (España)','España','Madrid','tier_b','Febrero','Octubre-Noviembre','Gratuito (inscripción academia)','Academia de Cine','https://www.academiadecine.com',array['drama','comedia','thriller','animacion','documental_social'],array['cortometraje','largometraje','documental','mediometraje'],85,'Los premios más importantes del cine español. Candidatura al Oscar por España para largometrajes.'),
('Tampere Film Festival','Finlandia','Tampere','tier_b','Marzo','Octubre-Noviembre','15-30€','FilmFreeway','https://www.tamperefilmfestival.fi',array['drama','animacion','experimental','documental_social'],array['cortometraje'],80,'Uno de los festivales de cortometrajes más importantes de Europa. Competición oficial FIAPF.'),
('Oberhausen','Alemania','Oberhausen','tier_b','Mayo','Enero','10-20€','FilmFreeway / Directo','https://www.kurzfilmtage.de',array['experimental','animacion','documental_social','drama'],array['cortometraje'],82,'Festival histórico de cortometrajes. Muy respetado en el mundo del cine experimental y de vanguardia.'),
('Palm Springs International ShortFest','Estados Unidos','Palm Springs','tier_b','Junio','Febrero-Marzo','40-70 USD','FilmFreeway','https://www.psfilmfest.org',array['drama','comedia','animacion','documental_social','experimental'],array['cortometraje'],82,'El festival de cortometrajes más grande del mundo. Clasificatorio para los Oscars.'),
('Encounters Short Film Festival (Bristol)','Reino Unido','Bristol','tier_b','Septiembre','Abril-Mayo','10-25£','FilmFreeway','https://www.encounters-festival.org.uk',array['drama','animacion','experimental','documental_social'],array['cortometraje'],75,'Festival BAFTA-qualifying de cortometrajes. Puerta al mercado del Reino Unido.'),
('Zinebi — Bilbao','España','Bilbao','tier_c','Noviembre','Julio-Agosto','Gratuito','Directo','https://www.zinebi.com',array['drama','documental_social','experimental','animacion'],array['cortometraje','documental'],68,'Festival histórico en el País Vasco. Especialmente relevante para proyectos vascos e ibéricos.'),
('Curt Ficcions (Barcelona)','España','Barcelona','tier_c','Abril','Enero-Febrero','Gratuito','Directo','https://www.curtficcions.cat',array['drama','comedia','experimental','animacion'],array['cortometraje'],65,'Festival referente de cortometrajes en Cataluña. Importante para el circuito nacional.'),
('Alcances (Cádiz)','España','Cádiz','tier_c','Septiembre','Junio','Gratuito','Directo','https://www.alcances.org',array['documental_social','documental_historico'],array['documental','cortometraje'],62,'Festival especializado en documentales. Histórico y de gran tradición en España.');
