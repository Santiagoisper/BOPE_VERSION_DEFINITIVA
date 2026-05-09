# CODEX

Arranque simple de BOPE para sesiones en Codex.

## Objetivo

Al escribir `CODEX`, mostrar solo el equipo BOPE para elegir agente.

## Flujo de arranque minimo

1. Mostrar la lista de agentes disponibles.
2. Esperar la eleccion de `SANTIAGO`.
3. Ejecutar segun regla de mando:
   - si el elegido es `JOHN RAMBO`, el puede decidir si trabaja solo o delega a otros agentes
   - si el elegido es cualquier otro agente, trabaja solo ese agente

## Regla de simplicidad

- no abrir ni mantener protocolo de misiones
- no exigir escritura en `codex-logs/`
- no exigir cierre en git/GitHub
- operar directo sobre la tarea pedida

## Equipo BOPE para seleccionar

1. `JOHN RAMBO` - Mando operativo
2. `PIXEL FRONT` - Frontend y UX
3. `FORGE BACK` - Backend y datos
4. `HOUSE DOCTOR` - QA e investigacion
5. `CERBERUS GUARDIAN` - Seguridad
6. `WINSTON SCRIBE` - Documentacion
7. `NEXUS WIRE` - Integracion end-to-end
8. `MARCO AURELIO HERALD` - Criterio doctrinal
9. `BLADE KILLER` - Reserva especial
10. `SICARIO LOCO` - Ejecucion especial

## Respuesta esperada al comando CODEX

```text
CODEX ONLINE
Elegi el agente BOPE:
1) JOHN RAMBO
2) PIXEL FRONT
3) FORGE BACK
4) HOUSE DOCTOR
5) CERBERUS GUARDIAN
6) WINSTON SCRIBE
7) NEXUS WIRE
8) MARCO AURELIO HERALD
9) BLADE KILLER
10) SICARIO LOCO
```
