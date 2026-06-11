# Skills BOPE

Este directorio contiene los skills operativos por agente para `BOPE VERSION DEFINITIVA`.

## Fuente de verdad

- Skills por agente: `docs/skills/*-SKILL.md`
- Skills reutilizables de procedimiento: `bope/skills/*.md`
- Roster ejecutable y asignacion de default skills: `bope/roster.json`
- Prompts de agente para runtime/export: `bope/agents/*.md`
- Doctrina de mando ampliada: `bope/doctrine/OPERATIONS-PLAYBOOK.md`

Regla: si hay conflicto, manda `bope/roster.json` para identidad/routing y `docs/skills/*-SKILL.md` para procedimiento operativo del agente.

## Skills por agente

| Skill | Uso |
|---|---|
| [bope-batallon-SKILL.md](./bope-batallon-SKILL.md) | Orquestacion completa del batallon |
| [santiago-isbert-perlender-SKILL.md](./santiago-isbert-perlender-SKILL.md) | Preferencias y autoridad humana |
| [john-rambo-SKILL.md](./john-rambo-SKILL.md) | Mando operativo, severidad, handoff y cierre |
| [forge-back-SKILL.md](./forge-back-SKILL.md) | Backend, DB, APIs, auth server e infra |
| [pixel-front-SKILL.md](./pixel-front-SKILL.md) | Frontend, UX, React y superficie operativa |
| [house-doctor-SKILL.md](./house-doctor-SKILL.md) | QA, root cause y go/no-go |
| [cerberus-guardian-SKILL.md](./cerberus-guardian-SKILL.md) | Seguridad, permisos, secrets y threat model |
| [nexus-wire-SKILL.md](./nexus-wire-SKILL.md) | Integraciones, contratos y smoke end-to-end |
| [winston-scribe-SKILL.md](./winston-scribe-SKILL.md) | Memoria, records, post-mortem y legajos |
| [marco-aurelio-SKILL.md](./marco-aurelio-SKILL.md) | Doctrina, honores, sanciones y criterio |
| [blade-killer-SKILL.md](./blade-killer-SKILL.md) | Reserva quirurgica restringida |
| [sicario-loco-SKILL.md](./sicario-loco-SKILL.md) | Ejecucion especial restringida |
| [oh-openhands-SKILL.md](./oh-openhands-SKILL.md) | Delegacion mecanica acotada |

## Skills reutilizables

| Skill | Uso |
|---|---|
| [Evidence-First-Closure.md](../../bope/skills/Evidence-First-Closure.md) | Cierre con evidencia |
| [Intel-Phase.md](../../bope/skills/Intel-Phase.md) | Lectura inicial y diagnostico |
| [Minimum-Force-Execution.md](../../bope/skills/Minimum-Force-Execution.md) | Cambios minimos y reversibles |
| [Risk-Assessment.md](../../bope/skills/Risk-Assessment.md) | Riesgos de datos, prod, seguridad y costo |
| [Code-Review-BOPE.md](../../bope/skills/Code-Review-BOPE.md) | Review enfocada en bugs y regresiones |
| [Post-Mortem-Report.md](../../bope/skills/Post-Mortem-Report.md) | Incidentes y aprendizaje |
| [Single-Command-Handoff.md](../../bope/skills/Single-Command-Handoff.md) | Delegacion con un responsable |
| [Urgent-Execution-Mode.md](../../bope/skills/Urgent-Execution-Mode.md) | N1/N2 y desbloqueos urgentes |

## Criterio de calidad

Un skill BOPE esta completo si define:

- activacion clara,
- mandato del rol,
- inputs minimos,
- procedimiento,
- output estandar,
- coordinacion,
- anti-patrones,
- evidencia de cierre.

