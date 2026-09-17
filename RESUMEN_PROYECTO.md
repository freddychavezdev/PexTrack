# PexTrack — estado MVP

## Implementado

- React + TypeScript + Vite + Tailwind, Leaflet/OSM y Supabase.
- Login real y perfiles `admin`, `coordinador`, `tecnico`; Técnico ve solo su cuadrilla/OTs.
- 7 cuadrillas, OTs con asignación, estados y suspensión con motivo obligatorio.
- Realtime y simulación GPS; cada posición se guarda como ubicación actual e historial.
- Señal vencida a los 60 segundos; tema claro/oscuro; escritorio y móvil responsivos.

## Base de datos

Ejecutar las tres migraciones de `supabase/migrations/` en orden y luego `supabase/seed.sql`. Las claves se guardan solo en `.env.local`, nunca en Git.

## Validación final

`npm run build` y `npm test`; probar roles, edición de OT, dos sesiones Realtime, señal vencida y vista móvil.

## Pendiente para publicación

Commit/push de cambios, variables `VITE_*` en Vercel y URL de Vercel permitida en Supabase Auth.
