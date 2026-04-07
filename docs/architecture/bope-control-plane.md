# Control Plane Ligero — Jobs, tools y evidencia

El “control plane” de BOPE Visual Code es el artefacto documental que asegura que cada misión Balanced 11 deja evidencia verificable, controla el consumo del núcleo caliente y reduce handoffs innecesarios. Está pensado para ejecutarse desde VS Code con scripts o prompts mínimos (no necesita dashboard completo en la primera fase). Siempre que JOHN reciba un job, este documento define qué registrar y dónde.

## Job básico (una sola entrada por delegación)

| Campo | Descripción |
|---|---|
| `job_id` | UUID o string corto generado por JOHN al recibir la misión. |
| `timestamp` | fecha y hora de la asignación. |
| `frente` | backend | frontend | integración | QA | seguridad | observabilidad. |
| `agente` | RAMBO → `john` mantiene el mando, pero el job lo ejecuta `forge`, `pixel` o `nexus`. |
| `motor` | Codex (preferido) o Claude/Perplexity si ya está justificado. |
| `herramientas` | lista de herramientas usadas (`github_create_branch`, `vercel_deploy_preview`, `health_check_url`, etc.) |
| `input` | resumen del objetivo (2-3 frases) + contexto mínimo (repos, issue, PR o job anterior). |
| `artefacto` | qué entregable se espera (PR, commit, reporte). |
| `restricciones` | tokens máximos, tiempo estimado, costo (ej. “no usar Claude”). |
| `output` | branch/PR/resultados de health check. |
| `seguimiento` | si se hizo handoff, quién escribe el registro y qué se espera del siguiente agente. |
| `evidencia` | enlaces a commits, PRs, despliegues, health checks, documentación final. |

El job se documenta en `logs/MISION-ACTIVA.md` o `logs/MEMORIA/ULTIMO-RESUMEN.md` dentro de la sección “plan” y, además, debe dejar una entrada en `logs/COMMS.log` del estilo:

```
[JOHN RAMBO] JOB: job_id=X | frente=backend | agente=forge | motor=codex | artefacto=PR #123 | herramientas=github_create_branch, health_check_url
```

## Tool calling y handoffs

Cada vez que un job ejecuta una herramienta externa (GitHub, Vercel, Neon, Supabase, n8n, health check) se crea una bitácora corta con:

1. Tool llamada (nombre del tool).
2. Resultado (exit status, URL, error si aplica).
3. Token estimado (Codex/Claude/Perplexity).
4. Patrones de fallback (si se usó Groq/OpenWebUI en vez de Claude para mantener el costo).

Ejemplo de línea:

```
[NEXUS] TOOL: vercel_deploy_preview → success (https://vercel.app/preview/xyz) | health_check_url=PASS | costo=Claude 0.01k
```

Los handoffs formales se registran como:

```
[JOHN RAMBO] HANDOFF: job_id=X | de=forge | a=house | motivo=bug reproducido en PR #123 | artefacto=PR #123 + log de build
```

La regla Balanced 11 exige que el handoff sea corto, con artefacto y sin reenviar todo el contexto.

## Registro mínimo

Para la Fase 1, alcanza con mantener un archivo `logs/COMMS.log` actualizado (ya existe en BOPE VERSION DEFINITIVA; en Visual Code puede replicarse con el mismo nombre). Cada job (rambo→forge/pixel/nexus) agrega tres líneas: el job, las tool calls y cualquier handoff. El objetivo es poder calcular tokens por job y mostrar que estamos limitando el concurrency a 2–3 agentes.

## Checklist por job

- [ ] Job generado con `job_id` y fecha.
- [ ] Herramientas listadas y resultados (“health check” si hubo deploy).
- [ ] Artefacto final (branch, PR, documento) con link.
- [ ] Tokens estimados o comentario sobre “solo Codex”.
- [ ] Evidencia de cierre (log, doc, release note).
- [ ] Si hubo handoff, se registró y se conoce el próximo paso.

Una vez que el job pasa la checklist, se registra como “cerrado” en `logs/MEMORIA/ULTIMO-RESUMEN.md` y se actualiza el roster (cuando corresponde).
