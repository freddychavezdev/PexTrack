# ADR 004 — Gobierno de documentación y archivos de instrucciones

**Estado:** aceptada  
**Fecha:** 2026-09-17

## Contexto

El proyecto necesita preservar decisiones y estado operativo al pasar entre equipos, asistentes y futuras iteraciones.

## Decisión

Mantener documentación en `docs/` y dos archivos de instrucciones idénticos: `AGENTS.md` y `CLAUDE.md`. Un hook de pre-commit sincroniza automáticamente `CLAUDE.md` desde `AGENTS.md` cuando uno de ellos está incluido en un commit. El script npm `prepare` configura el hook para cada clon.

## Consecuencias

- Los cambios deben incluir documentación relacionada.
- Las decisiones no triviales se registran como ADRs numerados.
- El hook usa `AGENTS.md` como fuente canónica si ambos archivos difieren.
- Cada colaborador debe ejecutar `npm install` o `node scripts/setup-git-hooks.mjs` al clonar.
