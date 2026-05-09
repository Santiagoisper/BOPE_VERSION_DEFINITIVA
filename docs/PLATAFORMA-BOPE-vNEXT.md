# Plataforma BOPE — visión técnica (vNEXT)

## Objetivo

Sistema multiagente para operación de software con **gobierno de proveedores LLM**, presupuesto, auditoría y UI en tiempo real. Un único operador (**COMMANDER**) usa el Command Center para órdenes directas, misiones y control de gasto.

## Componentes del MVP

| Capa | Ruta | Rol |
|------|------|-----|
| UI | `apps/bope-command-center` | React + Vite, Wouter, SSE cliente, panel `/execute` |
| API | `apps/bope-command-center-server` | Node HTTP nativo, JWT/sesión, Postgres (Neon), SSE broadcast |
| Legado Next.js | `app/` (raíz) | **No canónico** — ver `app/DEPRECATED.md` y script `scripts/archive-nextjs-root-app.ps1` |

## Estructura del repositorio

- `apps/bope-command-center/` — frontend operativo.
- `apps/bope-command-center-server/` — backend, motor `engine/` (executor, llm, soldiers, budget, providerGuard), migraciones SQL en `db/migrations/`.
- `app/` — Next.js histórico en raíz; no participa en `pnpm-workspace` (solo `apps/*`).
- `.kiro/specs/bope-completion/` — especificación y plan de completitud (referencia).

## Modelo de datos (Neon)

Tablas principales de estado del Command Center (semilla + mutaciones vía `storage.ts`), incluyendo:

- `bope_provider_configs` — modo `disabled | shadow | armed`, `enabled`, kill switch por provider.
- `bope_provider_governance` — kill switch global y defaults.
- `bope_executions` — historial de ejecuciones LLM (ver migración `0004_executions.sql`).

Presupuesto de ejecución en archivo local `data/budget.json` (servidor) además de políticas en estado persistido.

## Contrato SSE (`/api/events`)

Evento `execution`, payload JSON alineado con `ExecutionEvent` en `executor.ts`:

- `type`: `started` | `chunk` | `completed` | `error` | `budget_warning`
- `executionId`: agrupa chunks de una misma corrida.
- `message`, `timestamp`, opcionales `costUSD`, `model`, `durationMs`, `shadow`.

El cliente acumula `chunk` por `executionId` y consolida al recibir `completed` o `error`.

## Flujo de una ejecución

1. Cliente autenticado → `POST /api/execute` con `order`, `provider`, `agentId` opcional.
2. Servidor resuelve provider efectivo (auto/heurística) y carga `ProviderPolicy` desde el store.
3. `assertProviderAllowed` bloquea kill switch global, kill switch por provider, `enabled=false` o modo no ejecutable.
4. Modo **shadow**: sin llamada LLM, eventos SSE + persistencia `status=shadow`.
5. Modo **armed**: `callClaude` / `runCodex` con callbacks → chunks por SSE; al terminar → `persistExecution` y respuesta JSON final.

## Adaptadores Claude / Codex

Implementados en `engine/llm.ts`: CLI preferido con fallback a API según env (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `BOPE_DISABLE_API`, `BOPE_PREFER_API`).

## Fases de construcción (estado)

1. **Base:** validación de env, healthz con `SELECT 1`, migraciones, autenticación.
2. **Gobernanza:** `providerGuard` integrado en la ruta de ejecución con política cargada desde DB.
3. **Historial:** `GET /api/executions` paginado + UI `/execute`.
4. **Streaming UI:** log hasta 500 entradas, chunks acumulados por `executionId`.
5. **Limpieza:** documentar y archivar `app/` (raíz) cuando se ejecute el script de archivo.

## Variables de entorno críticas

Ver `apps/bope-command-center-server/.env.example`: mínimo `BOPE_COMMAND_CENTER_DATABASE_URL`, `JWT_SECRET`.
