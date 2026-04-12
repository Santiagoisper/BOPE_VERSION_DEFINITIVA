# BOPE-CODEX-2026-023

## Titulo

Saneamiento canonico del batallon y cierre asistido

## Objetivo

- corregir desalineaciones entre `COMMS`, `MISIONES`, `MISION-ACTIVA`, `RECORDS`, `CUADRO-DE-HONOR`, `FICHAS` y `DOSSIER`
- normalizar el legajo roto de `PIXEL FRONT`
- dejar una rutina unica para sincronizar cierres de mision en la capa Codex
- evitar nuevos cierres parciales por actualizacion manual incompleta

## Archivos afectados

- `package.json`
- `scripts/close-codex-mission.js`
- `README.md`
- `codex-logs/COMMS.log`
- `codex-logs/MISION-ACTIVA.md`
- `codex-logs/MISIONES.md`
- `codex-logs/RECORDS.md`
- `codex-logs/CUADRO-DE-HONOR.md`
- `codex-logs/FICHAS-OPERATIVAS-BOPE.md`
- `codex-logs/DOSSIER-GENERAL-BOPE.md`
- `codex-logs/personnel/JOHN-JAMES-RAMBO.md`
- `codex-logs/personnel/WINSTON-ALASTAIR-MACLEOD.md`
- `codex-logs/personnel/ADRIA-FERRER-SOLER.md`
- `codex-logs/missions/BOPE-CODEX-2026-023.md`

## Resultado

La capa Codex queda saneada contra sus fuentes canonicas. Las misiones `021` y `022` pasan a reflejarse en los derivados correctos, el legajo de `PIXEL FRONT` vuelve a coincidir con el dossier y queda disponible un cierre asistido por script para sincronizar mision indice, ultima mision visible, records y cuadro de honor desde una sola ejecucion.

## Efectivos desplegados

- `JOHN RAMBO`
- `WINSTON`

## Evidencia

- `npm run codex:close-mission -- BOPE-CODEX-2026-023 2026-04-12`
- `codex-logs/MISION-ACTIVA.md` actualizado con ultima mision cerrada real
- `codex-logs/RECORDS.md` y `codex-logs/CUADRO-DE-HONOR.md` realineados
- `codex-logs/DOSSIER-GENERAL-BOPE.md` y `codex-logs/personnel/ADRIA-FERRER-SOLER.md` consistentes
