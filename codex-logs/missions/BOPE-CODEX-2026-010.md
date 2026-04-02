# BOPE-CODEX-2026-010

## Titulo

Protocolo de sincronizacion intercapas entre `Codex` y `Claude`

## Fecha

2026-03-31

## Objetivo

Dejar asentado en la capa `Codex` como se registran las misiones, medallas, sanciones y cambios doctrinales cuando deben existir tambien en `Claude`, sin romper el aislamiento entre capas ni inventar sincronizacion automatica.

## Orden de `SANTIAGO`

Definir si las misiones y medallas quedan grabadas en `Codex` o `Claude`, como se reflejan entre si, que comparte el batallon y cuales son los riesgos reales de operar con memorias separadas.

## Alcance

- `CODEX.md`
- `BOPE-CODEX-ADAPTACION.md`
- `codex-logs/COMMS.log`
- `codex-logs/MISIONES.md`

## Resultado canonico

- `Codex` queda definido como capa con memoria propia en `codex-logs/`
- se fija que `Claude` usa `logs/`
- se establece que ninguna medalla, sancion o mision se comparte por reflejo
- se establece protocolo de replica canonica explicita cuando un hecho debe existir en todo BOPE
- se documentan riesgos de divergencia, doble verdad y contaminacion doctrinal por escritura cruzada

## Ejecucion

`JOHN RAMBO` consolido el criterio operativo en `CODEX.md` como regla permanente de la capa.
`MARCO AURELIO` fijo el principio juridico de replica: si no esta asentado en la capa destino, no existe en esa capa.
`WINSTON` dejo trazabilidad del origen, la necesidad de replica y los riesgos de consistencia.

## Cierre

La capa `Codex` ya tiene protocolo escrito para sincronizacion con `Claude` sin perder aislamiento. Cualquier hecho compartido del batallon exige replica explicita por capa y no puede presumirse por arrastre.
