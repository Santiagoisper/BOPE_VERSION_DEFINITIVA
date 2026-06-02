# BOPE - Consolidacion canonica

Este documento fija el criterio de consolidacion de BOPE despues de revisar los repositorios satelite.

## Decision principal

El repositorio canonico sigue siendo:

- `Santiagoisper/BOPE_VERSION_DEFINITIVA`

Motivo: el propio README ya define que toda evolucion real de BOPE debe salir desde `BOPE VERSION DEFINITIVA`, con `main` como rama principal, `CODEX.md` como bootstrap Codex y `.claude/CLAUDE.md` como bootstrap Claude.

## Estado final de consolidacion

BOPE queda consolidado bajo un unico tronco operativo:

- repo canonico: `Santiagoisper/BOPE_VERSION_DEFINITIVA`
- rama principal: `main`
- bootstrap Codex: `CODEX.md`
- bootstrap Claude: `.claude/CLAUDE.md`
- capa producto: `docs/war-room/`
- capa agentes: `docs/agents/`

Los repositorios satelite no deben recibir trabajo productivo nuevo. Solo pueden consultarse como respaldo historico o fuente de recuperacion puntual.

## Repositorios satelite

### 1. `Santiagoisper/BOPE`

Estado: legacy archivado.

Decision: no usar como troncal. Mantener como respaldo historico.

### 2. `Santiagoisper/bope-war-room`

Estado: absorbido conceptualmente.

Contenido relevante: definia BOPE War Room como implementacion de producto del sistema operativo BOPE, separado de repos historicos y doctrinales. Su direccion apuntaba a un BOPE Mode sobre Multica, con specs, mission model, roster canonico, prompts, vocabulario UI y plan de implementacion.

Contenido importado al tronco canonico:

- `docs/war-room/BOPE_MODE_SPEC.md`
- `docs/war-room/ROSTER.md`
- `docs/war-room/UI_VOCABULARY.md`
- `docs/war-room/README.md`

Decision: puede archivarse como legacy una vez verificado que no quedan archivos no migrados que Santiago quiera preservar.

### 3. `Santiagoisper/bope-agents`

Estado: absorbido conceptualmente.

Contenido relevante: definia agentes para Claude Code y Codex: JOHN, SCOUT, PIXEL, FORGE, HOUSE, NEXUS, CERBERUS y SICARIO. Tambien contenia instaladores para Mac/Linux y Windows.

Contenido importado al tronco canonico:

- `docs/agents/BOPE_AGENT_SQUAD.md`

Decision: puede archivarse como legacy. Si se quiere preservar instalacion real, el proximo paso es portar `install.sh`, `install.ps1`, `claude/CLAUDE.md` y `codex/skills/bope/SKILL.md` a `scripts/setup/` o `docs/setup/`.

### 4. `Santiagoisper/BOPE_DOTFILES`

Estado: satelite menor revisado superficialmente.

Resultado de revision: no se encontro README visible, `CLAUDE.md`, `CODEX.md` ni resultados relevantes en busqueda por config/script/profile/agents/skill.

Decision: archivar como legacy menor salvo que Santiago recuerde un archivo especifico que deba recuperarse.

### 5. `Santiagoisper/BOPE-VISUAL-CODE`

Estado: legacy archivado.

Decision: mantener archivado. Revisar solo si se necesita recuperar assets visuales o decisiones UI.

## Reglas de consolidacion

1. Un solo tronco: `BOPE_VERSION_DEFINITIVA`.
2. Ningun satelite define mando, bootstrap ni doctrina superior.
3. Todo aporte externo entra como modulo, documento, script o asset, nunca como autoridad paralela.
4. No borrar repos satelite hasta verificar que el contenido util fue absorbido o descartado conscientemente.
5. Toda nueva evolucion productiva debe salir desde el repo canonico.
6. Si una idea nace en un repo satelite o sandbox, se porta al tronco canonico antes de considerarse viva.

## Acciones pendientes

1. Decidir si portar instaladores reales de `bope-agents` a `scripts/setup/`.
2. Archivar `bope-war-room`.
3. Archivar `bope-agents`.
4. Archivar `BOPE_DOTFILES`.
5. Mantener `BOPE` y `BOPE-VISUAL-CODE` como historicos.
