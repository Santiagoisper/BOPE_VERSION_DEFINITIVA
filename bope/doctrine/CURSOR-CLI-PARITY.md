# Cursor BOPE — Paridad CLI y Save & Return

Norma exportable (Multica / humanos). La ejecución automática en Cursor está en `.cursor/rules/bope-cli-paridad.mdc`.

## Principio

Un `BOPE` escrito en **Cursor** debe comportarse como **BOPE en Claude Code o Codex** sobre este mismo repo: **John Rambo** toma el mando operativo, lee doctrina mínima, ejecuta la misión y cierra con **brief oficial + estado persistido en disco**.

## Brief final designado

- JOHN **nombra** antes del cierre quién dicta el brief final (**por defecto WINSTON**).
- El brief lista **resultado**, **evidencia**, **condecoraciones** y **sanciones** de la misión.

## Save & Return (fin de misión confirmada por SANTIAGO)

Sin actualizar estos artefactos (según aplique), la misión **no queda lista para la próxima**:

| Artefacto | Rol |
|-----------|-----|
| `codex-logs/RECORDS.md` | Tabla maestra + detalle por soldado |
| `codex-logs/CUADRO-DE-HONOR.md` | Medallero ceremonial visible |
| `codex-logs/personnel/*.md` | Legajos individuales |
| `app/public/warroom-state.json` | Espejo máquina para `/warroom` (misión a misión, effects) |
| `.claude/ORDEN-DE-BATALLA.md` | Coherencia con capa Claude si se usa como roster vivo |
| `logs/missions/INDEX.md` | Índice operativo si existe |

Cierre con **commit** que incluya los cambios tocados.

Nota: si algún texto legacy en `.claude/CLAUDE.md` citara `codex-logs/` como solo lectura,
la **órden explícita de SANTIAGO** para cerrar misión institucional en este monorepo **prevalece**;
conviene luego unificar doctrina en un PR aparte si queda contradicción.

## Lecturas cruzadas

- Activación detallada: `.claude/CLAUDE.md`
- Paralelismo / Lead-Apoyo: `bope/doctrine/COLLABORATION_RULES.md`
