# Historial de desarrollo — PexTrack

> Documento de seguimiento del MVP. Registra el trabajo realizado, las decisiones técnicas, incidencias resueltas y el estado alcanzado. No contiene credenciales, claves ni contraseñas.

## 1. Contexto y objetivo

PexTrack es una aplicación web para supervisar cuadrillas de trabajo y órdenes de trabajo (OTs) en un mapa. El MVP se planteó para operar en La Paz/El Alto, con datos de demostración y una integración real con Supabase.

El alcance acordado del MVP fue:

- Inicio de sesión y control de acceso por rol.
- Roles: Administrador, Coordinador y Técnico.
- Tablero operativo con mapa Leaflet/OpenStreetMap y tabla de OTs.
- Gestión de estado y asignación de OTs.
- Siete cuadrillas simuladas y seguimiento GPS en tiempo real.
- Historial de ubicaciones, señal vencida, tema claro/oscuro y diseño responsive.
- Repositorio GitHub público y despliegue en Vercel.

Quedaron fuera del MVP: GPS físico, ETA, rutas históricas visuales, optimización de rutas, notificaciones a clientes, inventario y registro público de usuarios.

## 2. Base tecnológica implementada

| Área                 | Tecnología / decisión                               |
| -------------------- | --------------------------------------------------- |
| Frontend             | React 18 + TypeScript + Vite                        |
| Estilos              | TailwindCSS + CSS específico para mapa y marcadores |
| Mapa                 | Leaflet + React Leaflet + OpenStreetMap             |
| Iconos               | Lucide React y SVGs embebidos                       |
| Backend              | Supabase: Auth, PostgreSQL, PostGIS, RLS y Realtime |
| Pruebas              | Vitest                                              |
| Control de versiones | Git + GitHub                                        |
| Hosting              | Vercel                                              |

Se usó únicamente la clave pública/publicable de Supabase en el navegador. La clave `service_role` no se usa ni se debe publicar.

## 3. Estructura funcional principal

La aplicación se organiza alrededor de los siguientes módulos:

| Archivo / carpeta                 | Responsabilidad                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `src/App.tsx`                     | Inicio de sesión, restauración de sesión, tablero, filtros por rol, tema y simulador. |
| `src/components/MapView.tsx`      | Mapa, vehículos, destinos, tooltip, señal vencida y enfoque de OT seleccionada.       |
| `src/components/OrdersTable.tsx`  | Tabla seleccionable de órdenes de trabajo.                                            |
| `src/components/DetailDrawer.tsx` | Detalle de cuadrilla/OT y formulario de actualización.                                |
| `src/lib/repository.ts`           | Adaptador tipado de lecturas, actualizaciones, RPC GPS y suscripciones Realtime.      |
| `src/lib/supabase.ts`             | Inicialización segura del cliente Supabase según variables `VITE_*`.                  |
| `src/lib/mock.ts`                 | Datos demo y movimiento simulado de cuadrillas.                                       |
| `supabase/migrations/`            | Esquema, vistas, políticas y funciones de base de datos.                              |

## 4. Interfaz y experiencia de usuario

### 4.1 Tablero operativo

Se construyó una vista de operación con:

- Cabecera fija y marca PEXTRACK más visible.
- Logotipo visual basado en un símbolo de localización.
- Mapa como área principal.
- Panel de OTs ubicado al lado izquierdo en escritorio.
- Botón con transición suave para ocultar/mostrar el panel de OTs.
- Panel de detalle lateral en escritorio y panel inferior en móvil.
- Tema claro/oscuro persistido en `localStorage`.

### 4.2 Diseño responsive

El comportamiento se adaptó por tamaño de pantalla:

| Dispositivo             | Comportamiento                                                        |
| ----------------------- | --------------------------------------------------------------------- |
| Escritorio              | Mapa y tabla visibles simultáneamente; panel de OTs colapsable.       |
| Tablet horizontal       | Distribución tipo split simplificada.                                 |
| Móvil / tablet vertical | Pestañas `Mapa` y `Tabla`; detalle de OT/cuadrilla como bottom sheet. |

### 4.3 Marcadores del mapa

- Las cuadrillas se muestran como vehículos SVG, rotados según `heading`.
- Los vehículos tienen halo, sombra y pulso para mejorar su localización visual.
- Los destinos de OTs se representan con íconos de usuario.
- El color del destino corresponde al estado de la OT: pendiente, en camino, en sitio, finalizado o suspendido.
- Si una posición tiene más de 60 segundos, el vehículo se atenúa y el tooltip muestra `señal vencida`.
- El mapa se vuelve a evaluar cada 5 segundos para reflejar señal vencida incluso si no hay nuevas actualizaciones.

### 4.4 Refinamiento de interfaz

Se reorganizó la presentación sin cambiar las capacidades ni la paleta de los temas claro y oscuro. El acceso ahora tiene una identidad de marca y campos con mejor jerarquía; la cabecera prioriza identidad, control del panel, simulador y cuenta. La tabla diferencia encabezado, cantidad de OTs, filas seleccionadas y estado. El detalle agrupa información y edición de manera más legible; en móvil se agregaron iconos a las pestañas y se respetan las áreas seguras. También se incorporaron foco visible para teclado y preferencia de movimiento reducido. Los mensajes operativos son avisos compactos y descartables, de modo que no cubren el mapa. Se corrigió además el menú nativo de los combos en tema oscuro: sus opciones usan una superficie oscura y texto de alto contraste.

Al elegir una fila de OT, el marcador correspondiente ahora recibe un halo pulsante y la etiqueta `OT seleccionada`. El marcador conserva el color de su estado y pasa al frente del mapa. El efecto dura cinco segundos y se cancela al elegir otro elemento o cerrar el detalle.

## 5. Autenticación y autorización (HU-01)

### 5.1 Modo demo y modo real

Inicialmente se habilitó una pantalla demo para elegir rol sin credenciales. Esto permitió validar la interfaz antes de contar con Supabase configurado.

Luego se implementó el modo real:

- Login con correo y contraseña de Supabase Auth.
- Restauración de la sesión al recargar la página.
- Lectura del perfil desde `public.users` y del rol asociado en `public.roles`.
- No existe registro público.
- Si el perfil o rol no existe, se muestra un error controlado y se cierra la sesión.

La activación depende de:

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Si alguna variable no existe o el valor de activación no es exactamente `true`, la aplicación entra deliberadamente en modo demo.

### 5.2 Reglas por rol

| Capacidad                         |                Admin | Coordinador |                     Técnico |
| --------------------------------- | -------------------: | ----------: | --------------------------: |
| Ver cuadrillas y OTs              |                Todas |       Todas | Solo su cuadrilla y sus OTs |
| Editar estado de OT               |                   Sí |          Sí |                          No |
| Asignar/reasignar cuadrilla       |                   Sí |          Sí |                          No |
| Reportar posición de su cuadrilla |                   Sí |          Sí |          Sí, solo la propia |
| Administrar cuadrillas/usuarios   | Preparado para Admin |          No |                          No |

Se validó que, cuando las dos OTs pertenecían a Cuadrilla 1, el Técnico asignado a esa cuadrilla veía ambas. Al mover una OT a Cuadrilla 2, el Técnico de Cuadrilla 1 pasó a ver únicamente su OT correspondiente.

## 6. Órdenes de trabajo (HU-03)

La gestión real de OTs quedó implementada mediante Supabase.

Para enriquecer la demostración del tablero, se añadieron trece OTs a las dos iniciales: el conjunto queda con 15 órdenes. Las nuevas filas cubren los cinco estados, se distribuyen entre las siete cuadrillas y mantienen tres OTs sin asignar. La inserción busca las cuadrillas por nombre y no duplica códigos de OT, por lo que puede repetirse de forma segura.

### Funciones entregadas

- Tabla de OTs con código, cliente, estado y nombre legible de cuadrilla.
- Selección sincronizada entre tabla y mapa.
- Cambio de estado por Admin/Coordinador.
- Asignación o reasignación de cuadrilla.
- Estado `suspendido` con motivo obligatorio.
- Botón de guardado con estado `Guardando…` y prevención de doble envío.
- Actualización visual local y actualización recibida por Realtime.
- Técnico en modo consulta sin formulario de edición.

### Corrección de UUID visible

Al principio, la columna `CUADRILLA` mostraba UUIDs internos, por ejemplo `06e2ce40-...`. Se corrigió creando una versión ampliada de la vista `dashboard_orders`, con la columna `cuadrilla_nombre` proveniente de la tabla `cuadrillas`.

La migración correspondiente es:

`supabase/migrations/20260917000000_dashboard_order_crew_name.sql`

Para mantener compatibilidad con PostgreSQL, la vista conserva el orden de las columnas existentes y añade el nuevo nombre al final. Así se evitó el error `cannot drop columns from view` producido por un primer intento que eliminaba columnas al redefinir la vista.

## 7. Seguimiento GPS y Realtime (HU-02)

### 7.1 Simulación

El MVP no usa todavía un rastreador físico. El botón `Simular GPS` genera movimiento para las siete cuadrillas cada cinco segundos.

Cada actualización contiene:

- Coordenadas de longitud y latitud.
- Rumbo (`heading`).
- Hora de última actualización.
- Estado operativo.

### 7.2 Persistencia e historial

Se creó la función PostgreSQL `report_crew_position`, llamada desde el cliente con RPC. La función:

1. Valida rango de coordenadas y rumbo.
2. Rechaza valores `NaN`.
3. Actualiza `cuadrillas.posicion_actual`, `heading`, `ultima_actualizacion` y estado.
4. Inserta un registro en `historial_ubicaciones`.

La función y las políticas operativas están en:

`supabase/migrations/20260917000001_realtime_crew_tracking.sql`

### 7.3 Realtime

El cliente se suscribe a cambios de las tablas:

- `public.cuadrillas`
- `public.ordenes_trabajo`

Estas tablas se agregaron a la publicación `supabase_realtime`. Cada cambio recibido vuelve a cargar datos visibles del tablero, permitiendo que dos sesiones abiertas reflejen cambios sin recargar manualmente.

### 7.4 Incidencia de coordenadas inválidas

Se detectó el error:

```text
SyntaxError: Unexpected token 'N' ... coordinates:[NaN,NaN]
```

La causa fue el simulador original: intentaba calcular un número con parte de un UUID. Eso producía `NaN`, que llegó a guardarse como geometría PostGIS inválida para serialización JSON.

Correcciones realizadas:

- Se reemplazó el cálculo por un desplazamiento determinista basado en los caracteres del ID.
- Se agregó una prueba que comprueba coordenadas finitas para IDs UUID.
- Se agregó validación `NaN` en `report_crew_position`.
- Se restauraron las posiciones demo de las siete cuadrillas desde Supabase SQL Editor.
- El repositorio consulta explícitamente los campos necesarios en las vistas y no envía geometrías PostGIS crudas al navegador.

## 8. Base de datos Supabase

### 8.1 Tablas principales

| Tabla                   | Propósito                                               |
| ----------------------- | ------------------------------------------------------- |
| `roles`                 | Catálogo de Admin, Coordinador y Técnico.               |
| `users`                 | Perfil PexTrack vinculado uno a uno con `auth.users`.   |
| `cuadrillas`            | Vehículo, técnicos asignados, posición, rumbo y estado. |
| `ordenes_trabajo`       | Cliente, dirección, tarea, estado y cuadrilla asignada. |
| `historial_ubicaciones` | Registro de posiciones GPS por cuadrilla y OT opcional. |

### 8.2 PostGIS

Las posiciones usan `geometry(Point, 4326)`:

- `cuadrillas.posicion_actual`
- `ordenes_trabajo.ubicacion_cliente`
- `historial_ubicaciones.posicion`

Se incorporaron índices espaciales GiST y vistas de tablero que exponen `lat` y `lng` usando `st_y` y `st_x`.

### 8.3 RLS y seguridad

- RLS está habilitado en todas las tablas de `public`.
- Las vistas `dashboard_crews` y `dashboard_orders` usan `security_invoker=true`, de modo que respetan las políticas de las tablas subyacentes.
- Funciones auxiliares determinan el rol actual y si una cuadrilla pertenece al Técnico autenticado.
- Las políticas permiten al Técnico consultar y reportar solamente datos de su cuadrilla.
- Las actualizaciones de OTs se restringen a Admin/Coordinador.
- Se revocó ejecución pública de la función RPC GPS y se otorgó exclusivamente a `authenticated`.

### 8.4 Orden de migraciones

Para una instalación desde cero se deben ejecutar en este orden:

1. `20260916000000_initial_schema.sql`
2. `20260917000000_dashboard_order_crew_name.sql`
3. `20260917000001_realtime_crew_tracking.sql`
4. `supabase/seed.sql` para datos de demostración.

El proyecto local no tenía Supabase CLI instalado durante la implementación; por ello las migraciones quedaron disponibles para ejecutar desde Supabase SQL Editor o mediante una futura instalación/configuración del CLI.

## 9. Pruebas realizadas

Se configuró Vitest y se verificaron reglas de dominio:

- Catálogo completo de cinco estados de OT.
- Permisos de gestión de OTs por rol.
- Detección de señal vencida después de 60 segundos.
- Transformación de coordenadas GeoJSON a latitud/longitud.
- Generación de posiciones válidas para simulación con UUID.

Comandos de validación usados:

```powershell
npm run build
npm test
```

Al cierre de la implementación, la compilación de producción fue correcta y Vitest reportó cinco pruebas exitosas.

También se realizaron validaciones manuales de:

- Login con los tres tipos de usuario.
- Visibilidad de OTs según asignación de cuadrilla.
- Cambio de estado y motivo obligatorio de suspensión.
- Marcadores de vehículos y destinos.
- Panel de OTs, drawer/bottom sheet, tema y responsive.
- Actualización de posiciones y señal vencida.

## 10. Documentación creada

| Archivo                            | Contenido                                                          |
| ---------------------------------- | ------------------------------------------------------------------ |
| `README.md`                        | Inicio rápido, variables, migraciones, Realtime, pruebas y Vercel. |
| `RESUMEN_PROYECTO.md`              | Resumen compacto del estado MVP.                                   |
| `HISTORIAL_DESARROLLO_PEXTRACK.md` | Este historial extendido.                                          |

## 11. GitHub

Se creó y publicó el repositorio público:

- Cuenta: `freddychavezdev`
- Repositorio: `PexTrack`
- URL: <https://github.com/freddychavezdev/PexTrack>

Historial relevante de commits:

| Commit    | Descripción                                                         |
| --------- | ------------------------------------------------------------------- |
| `58b1b3c` | Dashboard MVP inicial.                                              |
| `d5ae23e` | Flujo operativo del MVP: roles, OTs, GPS, Realtime y documentación. |

La rama principal `main` fue sincronizada con `origin/main` luego del commit `d5ae23e`.

## 12. Despliegue en Vercel

El repositorio fue importado en Vercel como proyecto `pex-track` con preset Vite.

URL pública de producción:

<https://pex-track.vercel.app/>

Variables configuradas en Vercel para Production y Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_SUPABASE=true`

Se observó que el primer despliegue mostraba selector de rol demo. La causa fue que las variables `VITE_*` no estaban presentes durante la compilación. Tras agregarlas y redeplegar, la aplicación pasó a mostrar el login real con correo y contraseña.

Notas de despliegue:

- Las variables `VITE_*` se integran en el build de Vite; modificarlas requiere un redeploy.
- La clave pública/publicable puede aparecer en el cliente por diseño; Vercel puede solicitar marcarla como segura/configuración.
- Nunca se debe cargar en Vercel una clave `service_role` en variables `VITE_*`.
- La URL de producción debe estar permitida en la configuración de redirecciones de Supabase Auth si el flujo de autenticación lo requiere.

## 13. Estado actual del MVP

### Completado

- [x] Tablero GIS operativo.
- [x] Autenticación real por correo/contraseña.
- [x] Roles y visibilidad por cuadrilla.
- [x] Gestión de OTs, asignación y suspensión con motivo.
- [x] Vistas, RLS y datos demo en Supabase.
- [x] Realtime para cuadrillas y OTs.
- [x] Simulador GPS y registro de historial.
- [x] Señal vencida después de 60 segundos.
- [x] Tema claro/oscuro y responsive.
- [x] Pruebas unitarias básicas.
- [x] Repositorio público y despliegue en Vercel.

### Recomendaciones posteriores al MVP

- Añadir pruebas de integración y de interfaz automatizadas.
- Probar Realtime con más de dos usuarios y más de 50 OTs activas.
- Configurar Supabase CLI/MCP para aplicar migraciones y auditorías de forma automatizada.
- Incorporar pantalla de administración de usuarios/cuadrillas para el rol Admin.
- Sustituir el simulador por una fuente GPS real mediante API o dispositivo de rastreo.
- Añadir monitoreo de errores, analítica y alertas de producción.
- Evaluar migrar de Postgres Changes a Broadcast si aumenta la cantidad de conexiones y eventos Realtime.

## 14. Guía breve de continuidad

Para seguir desarrollando PexTrack:

1. Actualizar la rama local:

   ```powershell
   git pull origin main
   ```

2. Instalar dependencias y ejecutar:

   ```powershell
   npm install
   npm run dev
   ```

3. Mantener `.env.local` fuera de Git.
4. Crear migraciones nuevas para cambios de base de datos y ejecutarlas primero en Supabase.
5. Ejecutar `npm run build` y `npm test` antes de cada commit.
6. Hacer `git push origin main`; Vercel generará un despliegue nuevo automáticamente.

## 15. Gobierno de documentación

Se incorporó una estructura documental mantenible en la raíz del proyecto:

```text
AGENTS.md / CLAUDE.md
docs/
  architecture.md
  current-state.md
  decisions/
tests/
```

`AGENTS.md` y `CLAUDE.md` contienen las mismas instrucciones. Se agregó el hook versionado `.githooks/pre-commit`, configurado mediante `scripts/setup-git-hooks.mjs` y el script npm `prepare`. Si cambia cualquiera de los dos archivos, el hook copia el contenido canónico de `AGENTS.md` a `CLAUDE.md` y lo agrega al commit. También detiene el commit si ambos archivos quedaran distintos.

Las instrucciones obligan a documentar cada cambio dentro del mismo commit: arquitectura en `docs/architecture.md`, estado y validación en `docs/current-state.md`, y decisiones no triviales como ADRs en `docs/decisions/`.

## 16. Informe técnico formal

Se incorporó `docs/project-report.md` como documento de síntesis para preparar un informe formal. Consolida alcance, trazabilidad de requisitos, tecnologías, arquitectura, metodología, validación, incidencias, despliegue, limitaciones y próximos pasos del MVP v1.
