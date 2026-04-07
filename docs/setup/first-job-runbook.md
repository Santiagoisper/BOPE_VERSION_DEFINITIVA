# First Job Runbook

Este runbook define el primer job real de BOPE Visual Code. El objetivo no es construir producto todavia: es demostrar que el cuartel arranca, que JOHN manda y que el control plane deja evidencia operativa.

## Job canonico

- `job_id`: `BOPE-VC-JOB-001`
- `mision`: `BOPE-VC-003`
- `frente`: `integracion`
- `lider`: `john`
- `apoyo minimo sugerido`: `nexus`
- `motor principal`: `OpenAI / Codex`

## Objetivo

Validar el arranque operativo desde VS Code con el minimo de fuerza:

1. leer la mision activa
2. decidir si JOHN resuelve solo o si requiere apoyo de NEXUS
3. confirmar que OpenAI, Vercel y Neon existen en el entorno local
4. registrar evidencia en `logs/COMMS.log`
5. cerrar con resumen y siguiente paso

## Secuencia

1. Abrir Codex dentro de `BOPE VISUAL CODE`.
2. Cargar `docs/prompts/john-analisis-mision.md`.
3. Ejecutar el analisis de la mision `BOPE-VC-003`.
4. Si JOHN delega, usar `docs/prompts/nexus-ops-plan.md`.
5. Registrar:
   - `JOB`
   - `TOOL` si hubo chequeo
   - `HANDOFF` o declaracion de no handoff
   - `CIERRE`

## Cierre esperado

- una decision clara de mando
- evidencia de integraciones disponibles
- sin cambios productivos
- siguiente job recomendado: primer artefacto tecnico real
