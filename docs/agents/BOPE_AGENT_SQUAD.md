# BOPE Agent Squad

Origen: `Santiagoisper/bope-agents`.

Este documento absorbe la capa util de `bope-agents` dentro del repositorio canonico `BOPE_VERSION_DEFINITIVA`.

## Funcion

`bope-agents` define una escuadra operativa para Claude Code y Codex. Su valor principal es practico:

- activacion por `bope` o `/bope`
- John como entrypoint operativo
- agentes/especialistas como modos de trabajo
- reglas de ejecucion quirurgica
- verificacion posterior a cambios
- instaladores para Claude Code y Codex

## Regla canonica

Esta capa no crea una doctrina paralela ni una cadena de mando nueva.

La autoridad sigue siendo:

1. Santiago
2. John Rambo
3. especialistas segun necesidad

John absorbe la mision, define el plan, activa fuerza minima y reporta cierre.

## Escuadra operativa importada

| Agente | Funcion |
|---|---|
| JOHN | Orquestador / mando operativo |
| SCOUT | Research y analisis |
| PIXEL | Frontend: React, TypeScript, Tailwind, Next.js |
| FORGE | Backend: APIs, Node.js, PostgreSQL/Neon, auth, migraciones |
| HOUSE | QA, debugging, reproduccion y validacion |
| NEXUS | GitHub, deploy, Vercel, CI/CD |
| CERBERUS | Seguridad, secretos, auth, env vars |
| SICARIO | Bulk execution, refactors, operaciones masivas |

## Principios operativos

1. Leer antes de escribir.
2. Planificar antes de ejecutar.
3. Tocar solo lo necesario.
4. Verificar despues de modificar.
5. No hardcodear secretos.
6. No commitear `.env`.
7. No hacer force push a main sin orden explicita.
8. Cerrar con evidencia.

## Instalacion legacy

El repo satelite contiene instaladores:

- `install.sh` para Mac/Linux
- `install.ps1` para Windows

Ambos copian agentes a Claude Code y una skill a Codex.

Destino canonico recomendado dentro de este repo:

- `scripts/setup/`
- `docs/setup/`
- `.claude/agents/`
- `.claude/skills/`
- `.codex/skills/` si se decide versionar esa capa

## Decision de consolidacion

`bope-agents` queda como fuente historica y paquete instalable legacy.

La evolucion futura de agentes debe ocurrir dentro de `BOPE_VERSION_DEFINITIVA`.
