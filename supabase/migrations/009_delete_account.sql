-- Permite a cada usuario eliminar su propia cuenta desde la app (derecho de supresión, art. 17 RGPD).
-- Las estrategias, envíos, consumo de IA y perfil se borran en cascada con auth.users.
-- Los carteles del almacenamiento los borra antes la app con la API de Storage.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
