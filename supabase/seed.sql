-- Create Auth users in Dashboard first, then replace these UUIDs with their auth.users IDs before running.
-- Example operational seed (run after setting technician UUIDs):
insert into public.cuadrillas (nombre, placa_vehiculo, posicion_actual, heading, estado_operativo, ultima_actualizacion) values
('Cuadrilla 1','PEX-120',st_setsrid(st_makepoint(-68.14,-16.50),4326),40,'activo',now()),('Cuadrilla 2','PEX-121',st_setsrid(st_makepoint(-68.13,-16.49),4326),90,'activo',now()),('Cuadrilla 3','PEX-122',st_setsrid(st_makepoint(-68.12,-16.48),4326),150,'activo',now()),('Cuadrilla 4','PEX-123',st_setsrid(st_makepoint(-68.16,-16.50),4326),210,'activo',now()),('Cuadrilla 5','PEX-124',st_setsrid(st_makepoint(-68.15,-16.49),4326),270,'activo',now()),('Cuadrilla 6','PEX-125',st_setsrid(st_makepoint(-68.14,-16.48),4326),315,'activo',now()),('Cuadrilla 7','PEX-126',st_setsrid(st_makepoint(-68.17,-16.51),4326),5,'activo',now());
insert into public.ordenes_trabajo(codigo_ot,cliente_nombre,cliente_telefono,ubicacion_cliente,direccion_referencial,tipo_tarea,estado,cuadrilla_id,fecha_programada,motivo_postergacion)
select codigo_ot,cliente_nombre,cliente_telefono,st_setsrid(st_makepoint(lng,lat),4326),direccion_referencial,tipo_tarea,estado,(select id from public.cuadrillas where nombre=cuadrilla_nombre),fecha_programada,motivo_postergacion
from (values
('OT-2026-001','Cliente demostración','+59170000001',-68.1450,-16.4950,'Sopocachi','instalacion','pendiente','Cuadrilla 1',current_date,null::text),
('OT-2026-002','Cliente demostración 2','+59170000002',-68.1300,-16.5100,'Miraflores','asistencia_tecnica','en_camino','Cuadrilla 1',current_date,null::text),
('OT-2026-003','Familia Quispe','+59170100003',-68.1512,-16.5060,'Obrajes, calle 5','instalacion','pendiente','Cuadrilla 1',current_date,null::text),
('OT-2026-004','Comercial Andino','+59170100004',-68.1328,-16.4930,'Miraflores, avenida Busch','asistencia_tecnica','en_camino','Cuadrilla 2',current_date,null::text),
('OT-2026-005','Clínica Los Andes','+59170100005',-68.1185,-16.4788,'Villa Fátima, calle 12','instalacion','en_sitio','Cuadrilla 3',current_date,null::text),
('OT-2026-006','María Condori','+59170100006',-68.1620,-16.5017,'Tembladerani, pasaje Central','traslado','pendiente','Cuadrilla 4',current_date,null::text),
('OT-2026-007','Edificio Illimani','+59170100007',-68.1478,-16.4861,'San Pedro, calle Ecuador','asistencia_tecnica','suspendido','Cuadrilla 5',current_date,'Cliente solicitó reprogramación para la tarde.'),
('OT-2026-008','Jorge Mamani','+59170100008',-68.1397,-16.5128,'Sopocachi, avenida 6 de Agosto','instalacion','pendiente',null,current_date,null::text),
('OT-2026-009','Mercado Nuevo Amanecer','+59170100009',-68.1422,-16.4736,'Zona Norte, calle Comercio','asistencia_tecnica','en_camino','Cuadrilla 6',current_date,null::text),
('OT-2026-010','Patricia Flores','+59170100010',-68.1714,-16.5142,'Achumani, calle 22','instalacion','pendiente',null,current_date,null::text),
('OT-2026-011','Unidad Educativa Kantuta','+59170100011',-68.1681,-16.4982,'Alto Sopocachi, avenida del Maestro','asistencia_tecnica','en_sitio','Cuadrilla 7',current_date + 1,null::text),
('OT-2026-012','Restaurante La Casona','+59170100012',-68.1365,-16.5010,'Centro, calle Potosí','traslado','finalizado','Cuadrilla 1',current_date,null::text),
('OT-2026-013','Andrea Rojas','+59170100013',-68.1262,-16.4860,'Villa Copacabana, calle 8','instalacion','pendiente','Cuadrilla 2',current_date + 1,null::text),
('OT-2026-014','Hotel Libertador','+59170100014',-68.1542,-16.4917,'San Jorge, avenida Arce','asistencia_tecnica','suspendido',null,current_date + 1,'Pendiente de confirmación del cliente.'),
('OT-2026-015','Luis Choque','+59170100015',-68.1152,-16.4945,'Pura Pura, calle Principal','instalacion','en_camino','Cuadrilla 3',current_date + 1,null::text)
) as demo(codigo_ot,cliente_nombre,cliente_telefono,lng,lat,direccion_referencial,tipo_tarea,estado,cuadrilla_nombre,fecha_programada,motivo_postergacion);
