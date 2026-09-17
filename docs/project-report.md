# Informe técnico de desarrollo — PexTrack MVP v1

**Proyecto:** PexTrack  
**Versión documentada:** MVP v1  
**Fecha de actualización:** 17 de septiembre de 2026  
**Repositorio:** <https://github.com/freddychavezdev/PexTrack>

## 1. Resumen ejecutivo

PexTrack es una aplicación web para centralizar la supervisión de cuadrillas de trabajo y órdenes de trabajo (OT) en La Paz y El Alto. Responde a una operación inicialmente basada en llamadas y mensajería individual, donde no existía una vista única de la ubicación, estado ni asignación de las siete cuadrillas en campo.

El MVP v1 implementa un tablero GIS con actualización en tiempo real, autenticación por rol, gestión básica de OTs y una interfaz adaptable a escritorio, tableta y móvil. Se utiliza una simulación GPS controlada para demostrar el flujo operativo sin requerir aún dispositivos de rastreo físico. La solución está versionada en GitHub y desplegada en Vercel con Supabase como backend administrado.

## 2. Problema y objetivo

La coordinación de cuadrillas mediante reportes manuales causa fragmentación de la información, baja trazabilidad y dificultades para conocer el avance de una visita. El objetivo de PexTrack es proporcionar un panel único que permita a supervisores y coordinadores:

- Ubicar las cuadrillas en un mapa interactivo.
- Consultar las OTs y su estado operativo.
- Asignar cuadrillas y actualizar estados de atención.
- Distinguir posiciones desactualizadas.
- Mantener datos coherentes entre sesiones conectadas.

El proyecto adopta un alcance MVP: demuestra la operación principal con datos de ejemplo y deja funciones de optimización y automatización para fases posteriores.

## 3. Alcance funcional del MVP

| Área | Capacidades entregadas |
|---|---|
| Acceso | Inicio de sesión real por correo y contraseña; restauración de sesión; sin registro público. |
| Roles | `admin`, `coordinador` y `tecnico`, con visibilidad y acciones restringidas por RLS y la interfaz. |
| Mapa GIS | Leaflet y OpenStreetMap con siete vehículos, destinos de cliente, tooltips y enfoque de OT. |
| Órdenes de trabajo | Tabla sincronizada con mapa, detalle, asignación, cambio de estado y motivo obligatorio de suspensión. |
| Seguimiento | Simulador GPS, rumbo, historial de ubicaciones, Supabase Realtime y detección de señal vencida. |
| Interfaz | Split view en escritorio, pestañas en móvil, drawer/bottom sheet, tema claro/oscuro y accesibilidad básica. |
| Datos de muestra | Siete cuadrillas y 15 OTs con estados variados; tres permanecen sin asignación. |

### Trazabilidad con requisitos funcionales

| Requisito | Cobertura v1 |
|---|---|
| RF-01 / RF-02: autenticación, roles y permisos | Login de Supabase, perfiles en `public.users` y RLS. |
| RF-03 a RF-06: mapa, tiempo real, heading y estados | Mapa OSM, vehículos SVG rotados, pines de cliente y Realtime. |
| RF-07 a RF-10: OTs, split, móvil y detalle | Tabla lateral, pestañas, selección sincronizada y drawer. |
| RF-11 a RF-13: estado, suspensión y asignación | Formulario para Admin/Coordinador, persistencia y actualización visible. |
| RF-15: tema | Preferencia clara/oscura persistida en `localStorage`. |

RF-14 (aprobaciones), RF-16 (ETA), RF-17 (visualización de rutas) y RF-18 (notificaciones) no pertenecen al alcance implementado de esta versión.

## 4. Tecnologías y herramientas

| Capa | Tecnología / herramienta | Uso en el proyecto |
|---|---|---|
| Frontend | React 18, TypeScript y Vite | SPA, tipado estático, desarrollo y empaquetado. |
| Estilos | TailwindCSS y CSS específico | Diseño responsive, modo oscuro, controles y marcadores Leaflet. |
| Mapa | Leaflet, React Leaflet y OpenStreetMap | Mapa base, marcadores, enfoque y tooltips. |
| Iconografía | Lucide React y SVG embebido | Controles de interfaz, vehículos y destinos. |
| Backend | Supabase | Auth, PostgreSQL, PostGIS, RLS, RPC y Realtime. |
| Geodatos | PostGIS | Puntos WGS84 `Point(4326)`, índices espaciales y consultas de latitud/longitud. |
| Pruebas | Vitest | Pruebas unitarias de reglas de dominio. |
| Control de versiones | Git y GitHub | Historial, colaboración y repositorio público. |
| Despliegue | Vercel | Compilación y publicación automática desde la rama `main`. |
| Documentación | Markdown, ADRs y hooks de Git | Registro de decisiones, estado y continuidad del proyecto. |

## 5. Arquitectura de la solución

PexTrack se implementa como una SPA. El navegador utiliza únicamente la clave pública de Supabase y nunca incluye una clave `service_role`.

```text
Usuario
  │
  ▼
React + TypeScript + Tailwind
  ├─ App: sesión, rol, tablero y simulador
  ├─ MapView: Leaflet / OpenStreetMap
  ├─ OrdersTable y DetailDrawer
  └─ repository.ts: adaptador tipado de datos
  │
  ▼
Supabase
  ├─ Auth
  ├─ PostgreSQL + PostGIS
  ├─ RLS y vistas de tablero
  ├─ RPC report_crew_position
  └─ Realtime
```

La separación en capas evita que los componentes visuales consulten SQL directamente. `repository.ts` centraliza lecturas, mutaciones, llamadas RPC y suscripciones; `domain.ts` concentra reglas como permisos, estados y señal vencida.

## 6. Modelo de datos y seguridad

| Entidad | Finalidad |
|---|---|
| `roles` | Catálogo de los roles operativos. |
| `users` | Perfil PexTrack asociado uno a uno a `auth.users`. |
| `cuadrillas` | Vehículo, técnicos, posición actual, rumbo y última actualización. |
| `ordenes_trabajo` | Cliente, ubicación, estado, asignación y motivo de postergación. |
| `historial_ubicaciones` | Auditoría de posiciones por cuadrilla y OT opcional. |

Las coordenadas se almacenan como `geometry(Point, 4326)`. Las vistas `dashboard_crews` y `dashboard_orders` entregan `lat` y `lng` al frontend, sin exponer geometrías crudas. Se configuraron índices GiST para los puntos geográficos.

Row Level Security protege las tablas expuestas. Admin y Coordinador pueden operar sobre el conjunto de OTs; el Técnico solo consulta su propia cuadrilla y OTs asignadas. Las vistas usan `security_invoker=true`, por lo que conservan las políticas de las tablas originales.

## 7. Funcionalidades implementadas

### 7.1 Autenticación y control de acceso

El acceso real se resuelve con `signInWithPassword` de Supabase Auth. Tras autenticar, el sistema consulta el perfil y rol asociado. Si la cuenta no tiene perfil PexTrack válido, la sesión se cierra de forma controlada. El modo demostración queda disponible solo cuando las variables de Supabase no están habilitadas.

No existe registro público. La creación de usuarios y perfiles se realiza actualmente desde Supabase; una pantalla de administración de usuarios para Admin es una mejora posterior al MVP.

### 7.2 Tablero de operación y OTs

En escritorio se muestra una vista dividida: panel lateral de OTs y mapa. El panel puede colapsarse con una transición suave. En móvil y tablet vertical se presentan pestañas para alternar entre mapa y órdenes.

La selección de una OT sincroniza tabla, mapa y drawer. El mapa centra el punto y, durante cinco segundos, el destino recibe un halo pulsante, rótulo de selección y prioridad visual. El efecto se cancela ante otra selección relevante para evitar distracción permanente.

Admin y Coordinador pueden cambiar estado y cuadrilla. El estado `suspendido` exige motivo; el Técnico tiene modo de consulta y solo observa sus datos autorizados.

### 7.3 Seguimiento y Realtime

El simulador calcula posiciones válidas para las siete cuadrillas cada cinco segundos. Cada posición contiene latitud, longitud, rumbo y marca de tiempo. La RPC `report_crew_position` valida rangos y valores finitos, actualiza la cuadrilla e inserta historial de forma transaccional.

Las tablas `cuadrillas` y `ordenes_trabajo` participan en la publicación de Supabase Realtime. Al llegar un evento, el tablero recarga los datos que el rol puede consultar. Si una cuadrilla no reporta durante más de 60 segundos, su vehículo se atenúa y se identifica como última ubicación conocida.

## 8. Diseño y experiencia de usuario

La interfaz aplica una jerarquía orientada a operación: el mapa es el área principal, las OTs constituyen el contexto de decisión y el drawer muestra detalle sin abandonar el tablero. Las cuadrillas usan vehículos SVG rotados por `heading`; los destinos usan íconos de usuario con color dependiente del estado.

El diseño conserva una paleta coherente en ambos temas. Los controles tienen foco visible para navegación por teclado, se respeta la preferencia de reducción de movimiento y los combos nativos reciben estilos de alto contraste en modo oscuro. Los avisos operativos son compactos y no cubren el mapa.

## 9. Metodología de trabajo aplicada

El desarrollo siguió un enfoque incremental e iterativo orientado al MVP:

1. **Análisis y priorización.** Se utilizó MoSCoW para separar Must Have, Should Have y Could Have; el trabajo se organizó alrededor de historias HU-01 a HU-05.
2. **Construcción por verticales funcionales.** Se implementaron primero autenticación y roles, luego OTs, mapa, GPS/Reatime, responsive y refinamientos de interfaz.
3. **Validación continua.** Cada cambio se verificó mediante compilación, pruebas unitarias y pruebas manuales por rol y dispositivo.
4. **Corrección basada en evidencia.** Errores observados, como UUID visible en la tabla, coordenadas `NaN`, selección poco visible y contraste insuficiente, se documentaron y corrigieron de forma puntual.
5. **Documentación viva.** La arquitectura, estado, decisiones y registro cronológico se mantienen en Markdown junto al código.

Para continuidad, `AGENTS.md` y `CLAUDE.md` contienen instrucciones idénticas. El hook versionado de pre-commit sincroniza ambos documentos desde `AGENTS.md`.

## 10. Pruebas y validación

Las pruebas unitarias con Vitest cubren:

- Catálogo de estados de OT.
- Permisos de gestión por rol.
- Detección de señal vencida a los 60 segundos.
- Transformación de geometrías a coordenadas utilizables.
- Generación de posiciones GPS finitas para identificadores UUID.

Los comandos de calidad son:

```powershell
npm run build
npm test
```

Además se realizaron verificaciones manuales de login con los tres roles, visibilidad restringida para Técnicos, actualización de estados, asignación, suspensión con motivo, actualización Realtime, señal vencida, tema, split view, pestañas móviles, drawer y resaltado de OT.

## 11. Incidencias relevantes y soluciones

| Incidencia | Causa | Solución aplicada |
|---|---|---|
| Login no avanzaba | Perfil/rol no asociado o configuración inicial incompleta. | Validación de perfil, restauración de sesión y mensajes controlados. |
| UUID mostrado como cuadrilla | La vista de OTs no entregaba nombre legible. | Se añadió `cuadrilla_nombre` a `dashboard_orders`. |
| Error `coordinates:[NaN,NaN]` | Simulador calculaba números desde UUID de manera inválida. | Desplazamiento determinista, validación RPC y prueba unitaria. |
| Error al redefinir vista | PostgreSQL no permite eliminar columnas al recrear una vista. | Se preservó el orden y se añadió la columna al final. |
| Menú de combos ilegible en oscuro | Control nativo de Chromium no heredaba correctamente la superficie. | `color-scheme` y estilos explícitos para opciones. |
| OT difícil de localizar en mapa | El enfoque del mapa no distinguía el pin seleccionado. | Halo temporal, etiqueta y elevación del marcador seleccionado. |
| Vercel apuntaba a repositorio incorrecto | Existían `PexTrack` y `pex-track` como repositorios distintos. | Se creó una conexión Vercel al repositorio canónico `freddychavezdev/PexTrack`. |

## 12. Gestión de repositorio y despliegue

El repositorio canónico es `freddychavezdev/PexTrack`. La rama de trabajo publicada es `main`. Vercel debe permanecer conectado a ese repositorio, no al repositorio distinto con guion (`pex-track`). Cada `push` a `main` desencadena un despliegue automático.

Para Supabase se requieren las variables de compilación:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<clave-publica>
VITE_ENABLE_SUPABASE=true
```

Las variables `VITE_*` se incorporan durante el build de Vite; un cambio exige un nuevo deployment. La clave pública puede estar disponible en el navegador por diseño, pero la clave `service_role` no debe publicarse ni almacenarse en Vercel.

## 13. Estado de entrega

La versión v1 satisface el alcance definido para el MVP: autenticación, permisos, mapa de siete cuadrillas, marcadores de clientes, tabla de OTs, estados básicos, responsive, tema y despliegue. El backend real de Supabase y el despliegue Vercel se encuentran integrados con el repositorio canónico.

Los cambios de datos se conservan tanto en `supabase/seed.sql` como en la migración `20260917163636_add_demo_orders.sql`. Para que las 15 OTs aparezcan en una base remota ya creada, la migración debe ejecutarse una vez desde el SQL Editor de Supabase o mediante `supabase db push` en un entorno enlazado.

## 14. Limitaciones y trabajo futuro

Las siguientes capacidades están fuera del MVP actual:

- Integración con GPS físico o aplicación móvil en segundo plano.
- Cola local y reintento de coordenadas del dispositivo ante desconexión.
- ETA y rutas históricas visuales.
- Notificaciones automáticas a clientes.
- Administración visual de usuarios y cuadrillas para el Administrador.
- Aprobaciones de tareas, emergencias y materiales.
- Pruebas de integración, interfaz y carga con más de 50 OTs.
- Observabilidad, monitoreo de errores y analítica de producción.

Estas mejoras pueden planificarse como versiones posteriores sin alterar la arquitectura base del MVP.

## 15. Referencias internas

- [Especificación de requerimientos y diseño](../../PexTrack_Especificacion_Requerimientos_Diseno.md)
- [Estado actual](current-state.md)
- [Arquitectura](architecture.md)
- [Historial de desarrollo](../HISTORIAL_DESARROLLO_PEXTRACK.md)
- [Decisiones de arquitectura](decisions/)
