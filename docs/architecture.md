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

## Sistema de interfaz

La interfaz usa Tailwind para estructura y `src/styles.css` para los patrones visuales compartidos: cabecera, controles, formulario, tabla, panel de detalle y navegación móvil. El diseño conserva las variables de color actuales de Tailwind y sus variantes `dark`; la información de estado sigue viniendo de `statusMeta` y no está duplicada en componentes visuales.

La capa de presentación no realiza consultas ni reglas de autorización. `App.tsx` mantiene sesión, datos, selección y acciones; los componentes reciben props tipadas y se limitan a representar esos datos.

Al seleccionar una OT desde la tabla o el mapa, `App.tsx` entrega su ID a `MapView` como un resaltado efímero. El marcador conserva su color de estado y recibe una señal visual de selección durante cinco segundos; una nueva selección, la selección de una cuadrilla o el cierre del detalle la cancelan.

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
