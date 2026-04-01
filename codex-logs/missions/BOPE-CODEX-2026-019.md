# BOPE-CODEX-2026-019

## Titulo

Compatibilidad de invocacion y normalizacion de aliases

## Objetivo

- tomar `BOPE VERSION DEFINITIVA` como carpeta canonica de arranque
- resolver referencias heredadas a carpeta `BOPE` o a `docs/` externos contra las fuentes canonicas locales
- aceptar `CORONEL RAMBO`, `RAMBO` y `JOHN RAMBO` como aliases de activacion sin alterar el canon visible
- evitar falsos bloqueos por forma cuando la intencion operativa es correcta

## Archivos afectados

- `README.md`
- `CODEX.md`
- `BOPE-CODEX-ADAPTACION.md`
- `codex-logs/COMMS.log`
- `codex-logs/MISIONES.md`
- `codex-logs/RECORDS.md`
- `codex-logs/DOSSIER-GENERAL-BOPE.md`
- `codex-logs/personnel/JOHN-JAMES-RAMBO.md`
- `codex-logs/personnel/WINSTON-ALASTAIR-MACLEOD.md`

## Resultado

La activacion de BOPE en Codex queda tolerante a variantes razonables del operador. El bootstrap local ya no discute con rutas heredadas inexistentes ni con aliases de mando, pero conserva como canon visible a `JOHN RAMBO` con rango `Sargento Mayor`.

## Efectivos desplegados

- `JOHN RAMBO`
- `WINSTON`

## Evidencia

- `README.md` fija `BOPE VERSION DEFINITIVA` como carpeta canonica y agrega compatibilidad de invocacion
- `CODEX.md` normaliza aliases de mando y resuelve referencias heredadas hacia fuentes canonicas locales
- `BOPE-CODEX-ADAPTACION.md` deja asentado que el alias de activacion no reescribe roster, rango ni legajo
- `codex-logs/` refleja el cierre doctrinal y la actualizacion de records asociada
