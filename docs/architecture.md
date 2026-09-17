# Arquitectura

## Visión general

PexTrack es una SPA de React/Vite. El navegador se comunica con Supabase usando únicamente la clave pública. Supabase concentra autenticación, PostgreSQL/PostGIS, RLS, RPC y Realtime.

```text
React + TypeScript
  ├─ MapView (Leaflet / OSM)
  ├─ OrdersTable + DetailDrawer
  ├─ repository.ts (adaptador de datos)
  └─ supabase.ts (cliente público)
             │
             ▼
Supabase Auth + PostgreSQL/PostGIS + RLS + Realtime
```

## Componentes

| Capa | Responsabilidad |
|---|---|
| `App.tsx` | Sesión, rol, filtros, tablero y simulador. |
| `components/` | Mapa, tabla y detalle de OTs/cuadrillas. |
| `lib/repository.ts` | Consultas, mutaciones, RPC y suscripciones. |
| `lib/domain.ts` | Reglas de permisos, estados y señal vencida. |
| `supabase/migrations/` | Esquema, RLS, vistas y función GPS. |

## Datos y seguridad

- Las tablas principales son `roles`, `users`, `cuadrillas`, `ordenes_trabajo` e `historial_ubicaciones`.
- PostGIS guarda puntos `Point(4326)`; las vistas exponen `lat`/`lng` al cliente.
- RLS restringe a Técnicos a su cuadrilla y OTs asignadas.
- `dashboard_crews` y `dashboard_orders` son vistas `security_invoker=true`.
- La función `report_crew_position` valida coordenadas, actualiza posición e inserta historial.
- La clave `service_role` no puede entrar al frontend.

## Flujo Realtime

1. El simulador calcula una posición válida cada cinco segundos.
2. El cliente llama a `report_crew_position` mediante RPC.
3. Supabase actualiza cuadrilla e historial en una transacción.
4. Realtime informa cambios de `cuadrillas` y `ordenes_trabajo`.
5. Cada sesión vuelve a cargar las filas visibles según su rol.
