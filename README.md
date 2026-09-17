# PexTrack

Tablero web para asignar y supervisar órdenes de trabajo y cuadrillas en La Paz/El Alto.

## Documentación

- [Estado actual](docs/current-state.md)
- [Arquitectura](docs/architecture.md)
- [Decisiones técnicas](docs/decisions/)
- [Historial detallado](HISTORIAL_DESARROLLO_PEXTRACK.md)
- [Reglas para agentes y asistentes](AGENTS.md)

## Funciones MVP

- Autenticación por correo/contraseña con roles `admin`, `coordinador` y `tecnico`.
- Mapa Leaflet/OpenStreetMap con vehículos, destinos, estado de señal y actualización Realtime.
- Gestión de estado y asignación de OTs para Admin/Coordinador; Técnico en modo consulta.
- Simulador GPS: actualiza posición e historial cada 5 segundos.
- Tema claro/oscuro y vista adaptable: panel+mapa en escritorio, pestañas en móvil.

## Ejecución local

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Para modo demo, deja `VITE_ENABLE_SUPABASE=false`. Para Supabase real, configura en `.env.local`:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-o-anon-key>
VITE_ENABLE_SUPABASE=true
```

Nunca uses ni publiques una clave `service_role` en el frontend.

## Configuración de Supabase

1. En el SQL Editor ejecuta, en este orden:
   - `supabase/migrations/20260916000000_initial_schema.sql`
   - `supabase/migrations/20260917000000_dashboard_order_crew_name.sql`
   - `supabase/migrations/20260917000001_realtime_crew_tracking.sql`
2. Ejecuta `supabase/seed.sql` para crear las 7 cuadrillas y 2 OTs de demostración.
3. Crea las cuentas en **Authentication → Users**. Inserta un perfil con el mismo UUID en `public.users` y asígnale un rol existente.
4. Para cada Técnico, asigna una cuadrilla mediante `tecnico_1_id` o `tecnico_2_id`; las OTs se vinculan mediante `cuadrilla_id`.

Las migraciones activan RLS y añaden `cuadrillas` y `ordenes_trabajo` a `supabase_realtime`. Si Realtime no actualiza, verifica que ambas tablas sigan incluidas en la publicación en **Database → Replication**.

## Verificación

```powershell
npm run build
npm test
```

Prueba mínima: Admin/Coordinador editan una OT; Técnico solo ve su cuadrilla; en dos sesiones, activa el simulador y confirma la actualización visible. Detén el simulador por más de 60 segundos para comprobar `señal vencida`.

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel.
2. Framework: **Vite**; comando de build: `npm run build`; directorio de salida: `dist`.
3. Define las tres variables `VITE_*` anteriores en Production y Preview.
4. En Supabase Auth, agrega la URL final de Vercel a **URL Configuration → Redirect URLs**.
