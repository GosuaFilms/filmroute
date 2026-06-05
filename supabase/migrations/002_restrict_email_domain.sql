-- Función que valida el dominio de email al crear un usuario.
-- Se usa como Auth Hook en Supabase: Authentication → Hooks → before_user_created
-- Si el email no termina en @luratlantik.com, el registro es rechazado a nivel de base de datos.

create or replace function public.restrict_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (new.email ilike '%@luratlantik.com') then
    raise exception 'Acceso restringido: solo se permiten cuentas con dominio @luratlantik.com';
  end if;
  return new;
end;
$$;

-- INSTRUCCIONES PARA ACTIVAR EL HOOK EN SUPABASE DASHBOARD:
-- 1. Ir a Authentication → Hooks
-- 2. Activar "before_user_created"
-- 3. Seleccionar la función: public.restrict_email_domain
-- Esto garantiza que aunque alguien llame directamente a la API de Supabase
-- sin pasar por la app, el registro será igualmente rechazado.
