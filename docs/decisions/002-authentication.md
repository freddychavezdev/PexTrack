# ADR 002 — Autenticación por Supabase Auth y roles en perfil

**Estado:** aceptada  
**Fecha:** 2026-09-16

## Contexto

El sistema exige acceso por correo/contraseña sin registro público, con reglas diferentes para Admin, Coordinador y Técnico.

## Decisión

Usar Supabase Auth para credenciales y `public.users`/`public.roles` para perfiles y autorización. El cliente restaura sesión y consulta el perfil; RLS confirma las restricciones en la base de datos.

## Consecuencias

- Crear un usuario requiere crear su cuenta Auth y su perfil con el mismo UUID.
- Técnico debe estar asignado a `tecnico_1_id` o `tecnico_2_id` de una cuadrilla.
- La interfaz filtra datos por rol como defensa adicional, pero RLS es la fuente de seguridad.
