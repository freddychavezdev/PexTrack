create or replace view public.dashboard_orders with (security_invoker=true) as
select
  o.*, st_y(o.ubicacion_cliente) as lat, st_x(o.ubicacion_cliente) as lng,
  c.nombre as cuadrilla_nombre
from public.ordenes_trabajo o
left join public.cuadrillas c on c.id = o.cuadrilla_id;

grant select on public.dashboard_orders to authenticated;
