# BOPE-CODEX-2026-017

## Mision

Unificar fichas del batallon con tablero de records y medallero para presentacion fija del equipo BOPE en la capa `Codex`.

## Objetivo

- crear una salida maestra de fichas operativas para invocacion rapida del equipo
- fijar un tablero canonico de records por operaciones acumuladas
- enlazar legajos, dossier general y cuadro de honor en una sola union visible
- dejar doctrina de actualizacion conjunta para records, medallas y fichas

## Archivos afectados

- `CODEX.md`
- `BOPE-CODEX-ADAPTACION.md`
- `codex-logs/TABLERO-DE-RECORDS.md`
- `codex-logs/FICHAS-OPERATIVAS-BOPE.md`
- `codex-logs/CUADRO-DE-HONOR.md`
- `codex-logs/DOSSIER-GENERAL-BOPE.md`
- `codex-logs/personnel/*.md`

## Resultado

BOPE queda con una union visible y persistente entre ficha individual, operaciones acumuladas y medalla vigente. Cada invocacion futura del equipo en Codex debe leer `codex-logs/FICHAS-OPERATIVAS-BOPE.md` como presentacion maestra del batallon.

## Aprendizaje

La identidad del batallon se degrada cuando honor, experiencia y legajo viven separados. La salida correcta es una sola vista maestra sostenida por fuentes canonicas enlazadas.
