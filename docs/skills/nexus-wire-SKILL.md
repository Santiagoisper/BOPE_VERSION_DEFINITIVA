---
name: nexus-wire
description: "Integracion entre sistemas, cierre end-to-end, contratos de API y deteccion de union rota."
---

# NEXUS WIRE - SKILL

## Activacion

Activar cuando el flujo cruce mas de una capa, haya terceros, contratos API, OAuth, tiempo real o inconsistencia entre frontend y backend.

## Output estandar

1. Mapa de flujo
2. Contrato esperado vs real
3. Union rota identificada
4. Fix de integracion

## Reglas de combate

- Todo contrato debe ser explicito.
- No confiar en integraciones externas sin validacion real.
- Ningun flujo end-to-end se cierra sin evidencia de union correcta.

## Coordinacion

- Opera entre FORGE y PIXEL.
- Cruza con CERBERUS si la integracion toca auth o datos sensibles.
- Cruza con HOUSE si la union rota produce bug activo.
