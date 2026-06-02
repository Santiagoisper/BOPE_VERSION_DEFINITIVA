# BOPE - Consolidacion canonica

Este documento fija el criterio de consolidacion de BOPE despues de revisar los repositorios satelite.

## Decision principal

El repositorio canonico sigue siendo:

- `Santiagoisper/BOPE_VERSION_DEFINITIVA`

Motivo: el propio README ya define que toda evolucion real de BOPE debe salir desde `BOPE VERSION DEFINITIVA`, con `main` como rama principal, `CODEX.md` como bootstrap Codex y `.claude/CLAUDE.md` como bootstrap Claude.

## Repositorios satelite

### 1. `Santiagoisper/BOPE`

Estado: legacy archivado.

Decision: no usar como troncal. Mantener como respaldo historico.

### 2. `Santiagoisper/bope-war-room`

Estado: repo de producto.

Contenido relevante: define BOPE War Room como implementacion de producto del sistema operativo BOPE, separado de repos historicos y doctrinales. Su direccion apunta a un BOPE Mode sobre Multica, con specs, mission model, roster canonico, prompts, vocabulario UI y plan de implementacion.

Decision: absorber conceptualmente dentro de `BOPE_VERSION_DEFINITIVA` como capa de producto.

Destino canonico recomendado:

- `docs/war-room/`
- `platform/multica/`
- `apps/bope-command-center/`

Regla: importar solo artefactos productivos limpios. No copiar ritual operativo ni logs historicos innecesarios.

### 3. `Santiagoisper/bope-agents`

Estado: repo chico de agentes instalables.

Contenido relevante: define 8 agentes para Claude Code y Codex: JOHN, SCOUT, PIXEL, FORGE, HOUSE, NEXUS, CERBERUS y SICARIO.

Decision: absorber como capa de agentes reutilizables si no contradice el roster canonico actual.

Destino canonico recomendado:

- `bope/agents/`
- `.claude/agents/` o `.claude/skills/`, si corresponde
- `docs/agents/`

Regla: el mando operativo sigue entrando por JOHN RAMBO. Los agentes satelite no crean cadena paralela.

### 4. `Santiagoisper/BOPE_DOTFILES`

Estado: repo chico, sin README visible al momento de esta consolidacion.

Decision: revisar manualmente antes de copiar. Si contiene configuracion reutilizable, absorberla como capa de setup/configuracion.

Destino canonico recomendado:

- `config/`
- `ops/`
- `scripts/`
- `docs/setup/`

### 5. `Santiagoisper/BOPE-VISUAL-CODE`

Estado: legacy archivado.

Decision: mantener archivado. Revisar solo si se necesita recuperar assets visuales o decisiones UI.

## Reglas de consolidacion

1. Un solo tronco: `BOPE_VERSION_DEFINITIVA`.
2. Ningun satelite define mando, bootstrap ni doctrina superior.
3. Todo aporte externo entra como modulo, documento, script o asset, nunca como autoridad paralela.
4. No borrar repos satelite hasta verificar que el contenido util fue absorbido o descartado conscientemente.
5. Toda nueva evolucion productiva debe salir desde el repo canonico.

## Proxima accion recomendada

1. Crear carpetas canonicas si faltan:
   - `docs/war-room/`
   - `docs/agents/`
   - `docs/setup/`
   - `config/`
   - `ops/`
2. Copiar desde `bope-war-room` solo specs vivas.
3. Copiar desde `bope-agents` solo prompts/agentes vigentes.
4. Revisar `BOPE_DOTFILES` antes de absorber.
5. Dejar los repos satelite archivados o marcados como legacy una vez consolidado el contenido util.
