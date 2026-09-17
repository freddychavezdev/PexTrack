# Estado actual

## MVP entregado

- Login real por correo/contraseña de Supabase y perfiles Admin, Coordinador y Técnico.
- Mapa con siete cuadrillas, destinos por estado, panel de OTs y detalle responsive.
- Gestión de OT para Admin/Coordinador; motivo obligatorio al suspender.
- Seguimiento GPS simulado, historial, Realtime y señal vencida a los 60 segundos.
- Tema claro/oscuro, pruebas unitarias y despliegue en Vercel.
- Estructura documental, ADRs y hook de sincronización para `AGENTS.md`/`CLAUDE.md`.
- Interfaz refinada: acceso, cabecera, panel de OTs, detalle y pestañas móviles con foco visible, contraste y movimiento reducido respetado. Los combos nativos tienen superficie y texto legibles en tema oscuro.
- Datos demo: 15 OTs distribuidas entre las siete cuadrillas, con tres sin asignar y estados variados para validar el tablero.
- La OT elegida centra el mapa y muestra un resaltado temporal de cinco segundos, cancelado por una nueva interacción relevante.
- El informe técnico consolidado para la elaboración formal está disponible en `docs/project-report.md`.

## Entornos

- Repositorio: <https://github.com/freddychavezdev/PexTrack>
- Producción: <https://pex-track.vercel.app/>
- Variables Vercel requeridas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ENABLE_SUPABASE=true`.

## Verificación requerida antes de publicar cambios

```powershell
npm run build
npm test
```

Además, validar manualmente roles, edición de OT, dos sesiones Realtime, señal vencida y vista móvil cuando el cambio afecte esas áreas.

## Próximas mejoras fuera del MVP

- GPS físico/API de rastreo.
- Administración de usuarios y cuadrillas.
- Pruebas de integración/e2e y monitoreo de producción.
- Rutas históricas, ETA, notificaciones e inventario.
