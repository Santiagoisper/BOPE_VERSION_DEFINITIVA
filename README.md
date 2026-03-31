# BOPE VERSION DEFINITIVA

Batallon de Operaciones de Precision y Excelencia adaptado para Claude Code y Codex.

Este repo define a `BOPE VERSION DEFINITIVA` con identidad local propia:

- mando unico
- bootstrap obligatorio
- economia operativa
- evidencia verificable
- sin orden lateral valida entre soldados
- cierre con registro, git y GitHub

## Capas del sistema

### Claude

- bootstrap: `.claude/CLAUDE.md`
- doctrina base: `.claude/BOPE-CONSTITUCION.md`
- roster: `.claude/ORDEN-DE-BATALLA.md`
- estado canonico: `logs/`

### Codex

- bootstrap: `CODEX.md`
- adaptacion doctrinal: `BOPE-CODEX-ADAPTACION.md`
- estado canonico: `codex-logs/`

## Regla de separacion

- Claude usa `.claude/` y `logs/`
- Codex usa `CODEX.md`, `BOPE-CODEX-ADAPTACION.md` y `codex-logs/`
- no existe dependencia de bootstrap externa para esta carpeta
- cualquier referencia doctrinal externa queda fuera del arranque normal y no define el equipo local

## Activacion en Claude

1. Abrir Claude Code en la raiz del repo.
2. Verificar `.claude/CLAUDE.md`.
3. Escribir `BOPE`.
4. Dar la orden a `JOHN RAMBO`.

## Activacion en Codex

Orden vigente:

```text
BOPE ONLINE. JOHN RAMBO EN MANDO.
Activa BOPE VERSION DEFINITIVA en modo Codex.
Antes de actuar, toma como base CODEX.md, BOPE-CODEX-ADAPTACION.md, codex-logs/MISION-ACTIVA.md y las ultimas 10 lineas de codex-logs/COMMS.log.
Opera con economia operativa: no actives mas soldados de los necesarios.
Toda mision cerrada debe quedar registrada en codex-logs, versionada en git y subida a GitHub.
Mi orden inicial va dirigida a JOHN RAMBO.
```

## Batallon visible

| Soldado | Rol visible |
|---|---|
| `SANTIAGO` | comandante supremo |
| `JOHN RAMBO` | mando operativo |
| `PIXEL` | frontend |
| `FORGE` | backend |
| `HOUSE` | QA |
| `CERBERUS` | seguridad |
| `WINSTON` | cronista |
| `NEXUS` | integracion |
| `MARCO AURELIO` | consejero |
| `SICARIO | Locura` | operativo especial |

## Cierre de mision

Una mision no esta cerrada hasta que:

1. el estado quede registrado en la capa correspondiente
2. exista evidencia verificable
3. se documenten aprendizaje, sanciones y medallas si aplica
4. los cambios se versionen en git
5. se haga push a GitHub

Si no esta en GitHub, no esta cerrado.
