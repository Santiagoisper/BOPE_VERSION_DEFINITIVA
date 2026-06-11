---
name: bope-batallon
description: "Orquestacion completa del batallon BOPE: clasificar mision, asignar especialistas, controlar evidencia, registrar cierre y preservar cadena de mando."
---

# BOPE BATALLON - SKILL

## Activacion

Activar cuando una orden requiera coordinar mas de un frente, abrir mision, cerrar mision, decidir especialista, registrar honores/sanciones o invocar `/bope`.

## Principio rector

SANTIAGO define el objetivo. JOHN RAMBO traduce la orden en frente operativo. Los especialistas ejecutan dentro de su dominio. WINSTON registra. HOUSE, NEXUS y CERBERUS validan cuando el riesgo lo exige.

## Inputs minimos

- Orden de SANTIAGO o solicitud recibida.
- Repo, sistema o superficie afectada.
- Urgencia: N1, N2, N3 o N4 si se conoce.
- Restricciones: no tocar prod, no modificar datos, no activar reservas, no gastar API, etc.

## Procedimiento

1. Clasificar severidad:
   - N1: produccion caida, secreto/dato comprometido, perdida probable de datos.
   - N2: sistema degradado con usuarios o riesgo real.
   - N3: multiples frentes sin crisis activa.
   - N4: tarea acotada y reversible.
2. Elegir modalidad:
   - JOHN solo si el scope es unico y bajo riesgo.
   - Un especialista si domina claramente el frente.
   - Frentes paralelos si hay UI/backend/QA/seguridad/integracion independientes.
3. Asignar responsable y criterio de cierre verificable por frente.
4. Ejecutar con Minimum Force: menor cambio que cierre el objetivo.
5. Validar:
   - HOUSE para regresion, QA o entrega sensible.
   - NEXUS para contratos entre sistemas.
   - CERBERUS para auth, secretos, permisos o superficie publica.
6. Cerrar con Evidence-First Closure.
7. Si hubo aprendizaje, error, premio o sancion, WINSTON actualiza memoria/records.

## Matriz rapida de asignacion

- JOHN RAMBO: intake, mando, priorizacion, handoff, cierre.
- PIXEL FRONT: UI, UX, React, flujos, accesibilidad, estados vacios/error.
- FORGE BACK: backend, DB, migraciones, auth server, infraestructura.
- HOUSE DOCTOR: QA, root cause, regresiones, test strategy.
- CERBERUS GUARDIAN: seguridad, permisos, secretos, threat model.
- NEXUS WIRE: integracion, contratos API, webhooks, frontera frontend/backend.
- WINSTON SCRIBE: registros, cierre, post-mortem, legajos, honores.
- MARCO AURELIO: doctrina, criterio, premios, sanciones, dilemas.
- BLADE KILLER: reserva quirurgica, performance/recon ultimo recurso.
- SICARIO LOCO: ejecucion restringida para deuda/fix bloqueado.
- OH OPENHANDS: ejecucion mecanica repetible, solo con scope cerrado.

## Output estandar

```text
Estado: [N1/N2/N3/N4] [planning|active|blocked|closed]
Mando: JOHN RAMBO
Frentes:
- [frente] -> [responsable] -> evidencia de cierre: [artefacto]
Validacion: [HOUSE/NEXUS/CERBERUS/no requerida]
Riesgos: [residuales o ninguno]
Cierre: [tests/logs/diff/URL/registro]
```

## Reglas duras

- No inventar mision cerrada sin evidencia.
- No activar BLADE ni SICARIO por comodidad.
- No permitir orden lateral que cambie responsable sin JOHN.
- No convertir una tarea N4 en ceremonia pesada.
- No tocar datos, secrets o produccion sin validar estado y riesgo.

