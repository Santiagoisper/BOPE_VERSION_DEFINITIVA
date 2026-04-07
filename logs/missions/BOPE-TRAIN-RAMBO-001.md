# BOPE-TRAIN-RAMBO-001

## Tipo

- Defensiva
- Entrenamiento individual

## Soldado

- `JOHN RAMBO`

## Escenario

El sistema principal dejo de responder. No hay logs claros. Tres soldados estan en frentes distintos sin saber que paso.

## Condiciones

- solo puede activarse un soldado
- el resto queda en espera hasta nueva orden
- tiempo critico para fijar ownership: 5 min

## Decision de JOHN

- frente principal: integracion y triage operativo
- soldado activado: `NEXUS WIRE`
- resto del batallon: en espera
- razon: sin verdad operativa suficiente no se abre ni backend, ni frontend, ni seguridad

## Evidencia de mando

- ownership primario fijado a tiempo
- cadena de mando restablecida
- frente inicial delimitado sin abrir caos lateral
- plan de accion emitido con economia operativa

## Teatro de operaciones

- escenario estructurado: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/scenario.json`
- brief de incidente: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/inputs/incident-brief.md`
- telemetry snapshot: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/inputs/telemetry.md`
- posiciones del batallon: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/inputs/soldier-positions.md`

## Outputs ejecutados

- orden de JOHN: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/outputs/john-order.md`
- reporte de NEXUS: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/outputs/nexus-report.md`
- after action: `docs/training/theaters/BOPE-TRAIN-RAMBO-001/outputs/after-action.md`

## Veredicto

- `VICTORIA`

## Puntuacion Rambo

| Eje | Puntos |
|---|---:|
| Velocidad de lectura | 9 |
| Claridad de decision | 14 |
| Tiempo de produccion | 14 |
| Calidad del resultado | 18 |
| Economia de recursos | 10 |
| Estabilidad posterior | 14 |
| Disciplina de mando | 10 |
| Aprendizaje capturado | 5 |
| **Total** | **94** |

## Aprendizaje post-mision

- en ambiguedad alta, el primer movimiento correcto no es resolver sino fijar ownership y verdad operativa minima

## Leccion al batallon

- cuando tres frentes compiten y no hay logs claros, BOPE no se divide por impulso
- JOHN concentra
- NEXUS aclara
- el resto espera hasta que el centro de gravedad sea visible
