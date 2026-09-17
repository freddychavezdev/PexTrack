# PexTrack — guía de trabajo

Este archivo y `CLAUDE.md` son idénticos. `AGENTS.md` es la fuente canónica; el hook de Git copia su contenido a `CLAUDE.md` antes de cada commit cuando alguno cambia.

## Reglas del proyecto

1. Lee `docs/current-state.md` y la documentación relevante antes de modificar una funcionalidad.
2. Mantén `AGENTS.md` y `CLAUDE.md` sincronizados; no los edites con contenido distinto.
3. Todo cambio funcional, técnico o de infraestructura debe actualizar su documento correspondiente en `docs/` dentro del mismo commit.
4. Registra decisiones de arquitectura no triviales como un nuevo ADR en `docs/decisions/`.
5. Ejecuta `npm run build` y `npm test` antes de hacer commit.
6. Nunca incluyas `.env.local`, contraseñas, claves privadas ni `service_role` en Git.

## Mapa de documentación

| Cambio | Documento a actualizar |
|---|---|
| Arquitectura, componentes, integraciones | `docs/architecture.md` |
| Estado, alcance, pruebas, despliegue | `docs/current-state.md` |
| Decisión relevante de diseño | `docs/decisions/NNN-*.md` |
| Recorrido cronológico del proyecto | `HISTORIAL_DESARROLLO_PEXTRACK.md` |

## Hooks

Después de `npm install`, el script `prepare` configura `core.hooksPath=.githooks` para este clon. Si el hook no se activa, ejecuta:

```powershell
node scripts/setup-git-hooks.mjs
```
