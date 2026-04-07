# Fundacion BOPE Visual Code

BOPE Visual Code es el cuartel tecnico ligero del batallon. No intenta reemplazar toda la aplicacion historica de una sola vez: fija mando, prompts, jobs y trazabilidad para operar desde VS Code con Codex y APIs externas controladas por costo.

## Principios base

- `Santiago Isbert Perlender` es autoridad humana suprema y fundador del batallon.
- `JOHN RAMBO` es segundo al mando del batallon, recibe toda mision y decide si resuelve solo o delega.
- El Balanced 11 es un roster disponible, no una concurrencia permanente.
- El nucleo caliente trabaja primero con Codex.
- Claude, Perplexity, Groq y Open WebUI entran por necesidad real y deben dejar evidencia.
- Si no esta escrito en `logs/`, no existe.
- La cadena de mando tiene regimen disciplinario formal en `docs/discipline/corte-marcial.md`.
- El sistema de merito se rige por `docs/honors/medallas-y-condecoraciones.md`.
- La doctrina de entrenamiento del batallon se rige por `docs/training/doctrina-entrenamiento-batallon.md`.

## Niveles de activacion

### 1. Nucleo caliente

- `JOHN RAMBO`
- `FORGE BACK`
- `PIXEL FRONT`
- `NEXUS WIRE`

Uso:
- intake
- implementacion
- integracion
- deploys y health checks

### 2. Soporte frecuente

- `HOUSE DOCTOR`
- `CERBERUS GUARDIAN`
- `WINSTON SCRIBE`

Uso:
- QA
- seguridad
- cierre y memoria

### 3. Reserva controlada

- `PX`
- `GEMINI`
- `SCOUT`
- `MARCO AURELIO`
- `BLADE KILLER`
- `SICARIO LOCO`

Uso:
- intel
- arquitectura
- research
- retrospectiva
- performance
- maxima presion

## Secuencia de arranque

1. Leer `logs/MISION-ACTIVA.md`.
2. Leer `docs/architecture/john-flow.md`.
3. Leer `docs/architecture/bope-control-plane.md`.
4. Leer las ultimas lineas de `logs/COMMS.log`.
5. Lanzar a JOHN con `docs/prompts/john-analisis-mision.md`.
6. Crear `job_id`.
7. Registrar job, tools y handoffs.

## Criterio de operacion sana

- no mas de 2 o 3 agentes activos por job
- no reenviar contexto completo a cada agente
- no abrir QA sin artefacto
- no desplegar sin health check
- no cerrar sin evidencia verificable

## Colaboracion lateral controlada

BOPE permite colaboracion lateral entre soldados, incluida la que puede emerger naturalmente en Claude Code, pero con estas condiciones:

- `JOHN RAMBO` mantiene el mando operativo
- siempre hay ownership principal del frente
- la colaboracion lateral no equivale por si sola a cambio de responsable
- el cierre siempre vuelve a `JOHN`
