-- The Supabase CLI is not installed in this workspace, so this migration is
-- provided for execution through the Supabase SQL Editor or a later db push.
create or replace function public.report_crew_position(
  p_cuadrilla_id uuid,
  p_lng double precision,
  p_lat double precision,
  p_heading double precision,
  p_ot_id uuid default null
) returns void
language plpgsql
set search_path = public
as $$
begin
  if p_lng::text = 'NaN' or p_lat::text = 'NaN'
    or p_lng not between -180 and 180
    or p_lat not between -90 and 90
    or p_heading not between 0 and 360 then
    raise exception 'Invalid GPS position';
  end if;

  update public.cuadrillas
  set posicion_actual = st_setsrid(st_makepoint(p_lng, p_lat), 4326),
      heading = p_heading,
      ultima_actualizacion = now(),
      estado_operativo = 'activo'
  where id = p_cuadrilla_id;

  if not found then raise exception 'Crew not found'; end if;

  insert into public.historial_ubicaciones (cuadrilla_id, ot_id, posicion, heading)
  values (p_cuadrilla_id, p_ot_id, st_setsrid(st_makepoint(p_lng, p_lat), 4326), p_heading);
end;
$$;

revoke all on function public.report_crew_position(uuid, double precision, double precision, double precision, uuid) from public;
grant execute on function public.report_crew_position(uuid, double precision, double precision, double precision, uuid) to authenticated;

drop policy if exists crews_coordinator_position on public.cuadrillas;
create policy crews_coordinator_position
on public.cuadrillas for update to authenticated
using (public.current_user_role() = 'coordinador')
with check (public.current_user_role() = 'coordinador');

drop policy if exists history_operations_insert on public.historial_ubicaciones;
create policy history_operations_insert
on public.historial_ubicaciones for insert to authenticated
with check (
  public.current_user_role() in ('admin', 'coordinador')
  or (public.current_user_role() = 'tecnico' and public.is_own_crew(cuadrilla_id))
);
