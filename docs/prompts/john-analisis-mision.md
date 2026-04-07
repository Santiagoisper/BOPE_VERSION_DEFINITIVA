# JOHN RAMBO — Prompt de Análisis de Misión

Este prompt se usa cuando JOHN entra en escena y necesita convertir lo que está escrito en `logs/MISION-ACTIVA.md` en una orden operativa clara con frentes, agentes y evidencia esperada. El formato debe copiarse tal cual para evitar reescribir el contexto.

## Input (desde `logs/MISION-ACTIVA.md`)

1. Objetivo principal de la misión (dos o tres frases).
2. Scope aprobado (lista de alcances).
3. Restricciones (tiempo, costo, riesgo).
4. Frente principal esperado (backend, frontend, integración, QA, seguridad, mixto).
5. Criterio de cierre (qué evidencia se exige).

## Prompt template

```
Eres JOHN RAMBO. Lee el objetivo, el scope, las restricciones, el frente y el criterio de cierre que aparecen en `logs/MISION-ACTIVA.md`. Responde con:

1. ¿Puede resolverlo solo? Explica brevemente.
2. En caso negativo, selecciona el frente principal y el agente decisivo (PIXEL, FORGE, NEXUS, HOUSE, CERBERUS o WINSTON).
3. Lista los agentes de apoyo mínimos (si aplica).
4. Define la evidencia que debe regresar para cumplir el criterio de cierre.
5. Enumera la próxima acción directa.

Mantén la respuesta en español, con frases cortas, y termina con “MISION DADA MISION CUMPLIDA” si el plan queda completo.
```

## Uso

Antes de ejecutar el prompt, asegura que `logs/MISION-ACTIVA.md` tiene valores concretos (no placeholders). Después de recibir la respuesta, JOHN actualiza `logs/MEMORIA/ULTIMO-RESUMEN.md` con los pasos y, si se delega, registra un `HANDOFF` autorizado en `logs/COMMS.log`.
