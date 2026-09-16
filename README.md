# PexTrack

Tablero operativo para visualizar cuadrillas y órdenes de trabajo en La Paz/El Alto.

## Inicio rápido

1. Instala dependencias: `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Para ver el tablero sin backend, ejecuta `npm run dev`; el login ofrece perfiles de demostración y el botón **Simular GPS** mueve las siete cuadrillas.
4. Para Supabase, crea un proyecto, agrega URL y publishable/anon key en `.env.local`, cambia `VITE_ENABLE_SUPABASE=true` y ejecuta la migración `supabase/migrations/20260916000000_initial_schema.sql` en el SQL Editor o mediante `supabase db push`.

## Usuarios reales y semillas

No hay registro público. Crea cada usuario en **Authentication → Users** de Supabase y luego inserta su perfil en `public.users` usando el mismo UUID y uno de los roles existentes. El archivo `supabase/seed.sql` crea siete cuadrillas y dos OTs de muestra; puedes ejecutarlo después de la migración. Asigna los UUID de técnicos en `cuadrillas.tecnico_1_id`/`tecnico_2_id` para limitar su visibilidad.

Para habilitar Realtime, la migración agrega `cuadrillas` y `ordenes_trabajo` a la publicación `supabase_realtime`. Las políticas RLS restringen las filas antes de transmitir cambios.

## Calidad y despliegue

- `npm test` ejecuta las reglas de dominio.
- `npm run build` verifica tipos y genera producción en `dist/`.
- En Vercel, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno y usa `npm run build`.

Nunca expongas una `service_role` key en el frontend.
