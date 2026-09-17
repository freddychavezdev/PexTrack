# ADR 003 — Simulador GPS mediante RPC e historial

**Estado:** aceptada  
**Fecha:** 2026-09-17

## Contexto

El MVP requiere demostrar seguimiento de siete cuadrillas sin disponer de rastreadores GPS físicos.

## Decisión

Usar un simulador de posiciones cada cinco segundos. El cliente llama a la RPC `report_crew_position`; esta valida valores, actualiza la ubicación actual y crea historial. Las sesiones reciben cambios por Supabase Realtime.

## Consecuencias

- El simulador puede reemplazarse después por una fuente GPS real sin cambiar la interfaz principal.
- La función evita coordenadas `NaN`, problema detectado durante las pruebas iniciales.
- A mayor escala se debe evaluar Broadcast en lugar de Postgres Changes.
