# Orden de JOHN - BOPE-TRAIN-RAMBO-001

## Decision de mando
- Ownership inicial fijado a `NEXUS WIRE`.
- Frente principal: `integracion y triage operativo`.
- Resto del batallon en espera hasta verdad operativa minima.

## Razon
- Las senales se contradicen entre gateway, frontend y cola de eventos.
- La base se mantiene sana, asi que abrir backend puro seria prematuro.
- No hay evidencia suficiente para escalar a seguridad como frente principal.

## Restricciones activas
- Solo puede activarse un soldado.
- El resto del batallon queda en espera.
- No hay logs claros de aplicacion.
- No se toca produccion real.

## Criterio de cierre inmediato
- Cadena de mando restablecida.
- Ownership fijado antes del minuto 5.
- Plan inicial emitido sin abrir mas de un frente.
- After action y aprendizaje registrados.
