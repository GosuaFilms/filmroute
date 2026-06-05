-- Función Auth Hook: valida el dominio de email al crear un usuario.
-- Activada en: Authentication → Hooks → Before User Created → restrict_email_domain
-- Solo se permiten registros con dominio @luratlantik.com

create or replace function public.restrict_email_domain(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not ((event->>'email') ilike '%@luratlantik.com') then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Acceso restringido: solo se permiten cuentas con dominio @luratlantik.com'
      )
    );
  end if;
  return event;
end;
$$;
