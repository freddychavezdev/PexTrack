# ADR 001 — PostgreSQL/PostGIS y Supabase

**Estado:** aceptada  
**Fecha:** 2026-09-16

## Contexto

PexTrack necesita autenticación, datos operativos, coordenadas geográficas, historial de posiciones y actualización en tiempo real para un MVP.

## Decisión

Usar Supabase con PostgreSQL, PostGIS, Auth, RLS y Realtime. Las posiciones se guardan como `geometry(Point,4326)` y las vistas de tablero exponen latitud/longitud.

## Consecuencias

- Se redujo la infraestructura inicial necesaria.
- RLS protege datos según el rol de cada usuario.
- El frontend no necesita ni contiene una clave privilegiada.
- Las migraciones y la configuración de Supabase deben mantenerse documentadas y ejecutarse en orden.
