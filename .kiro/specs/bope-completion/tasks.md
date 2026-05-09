# Plan de Implementación: BOPE Completion

## Overview

Implementación incremental de las siete áreas que completan la plataforma BOPE. El orden prioriza la infraestructura base (env, DB, ProviderGuard) antes de las capas que dependen de ella (executor, SSE, UI), y deja la limpieza arquitectónica y los tests como tareas paralelas que no bloquean el flujo principal.

Lenguaje de implementación: **TypeScript** (stack existente: Node.js nativo + React/Vite).

---

## Tasks

- [x] 1. Configuración de entorno y arranque operativo
  - [x] 1.1 Crear `apps/bope-command-center-server/src/envValidator.ts`
    - Exportar `validateEnv(): void` que verifica `BOPE_COMMAND_CENTER_DATABASE_URL` y `JWT_SECRET`
    - Lanzar error descriptivo con lista de variables faltantes y terminar el proceso si alguna falta
    - Llamar a `validateEnv()` al inicio de `server.ts`, antes de `initializePersistence()`
    - _Requirements: 7.1_

  - [ ]* 1.2 Escribir tests unitarios para `validateEnv`
    - Test: proceso termina con mensaje descriptivo cuando falta `BOPE_COMMAND_CENTER_DATABASE_URL`
    - Test: proceso termina con mensaje descriptivo cuando falta `JWT_SECRET`
    - Test: función retorna sin error cuando ambas variables están presentes
    - _Requirements: 7.1_

  - [x] 1.3 Actualizar `apps/bope-command-center-server/.env.example` con todas las variables
    - Agregar `JWT_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `BOPE_ANNUAL_BUDGET`, `BOPE_MONTHLY_LIMIT`, `BOPE_MAX_EXECUTION_COST`, `BOPE_ALLOWED_ORIGIN`, `NODE_ENV`, `BOPE_PREFER_API`
    - Incluir descripción de cada variable como comentario
    - _Requirements: 7.6_

  - [x] 1.4 Modificar `GET /api/healthz` en `server.ts` para verificar conectividad real con Neon
    - Ejecutar `SELECT 1` con timeout de 3 segundos usando el cliente `pg` existente
    - Retornar `{ ok: boolean, db: "connected" | "error", version: string }` — siempre HTTP 200
    - _Requirements: 7.4_

- [x] 2. Checkpoint — Entorno y arranque
  - Asegurar que el servidor arranca correctamente con `validateEnv`, que `GET /api/healthz` retorna `db: "connected"` con Neon activo, y que `.env.example` está completo. Consultar al usuario si hay dudas.

- [x] 3. Persistencia de ejecuciones (tabla + módulo + endpoints)
  - [x] 3.1 Crear migración `apps/bope-command-center-server/db/migrations/0004_executions.sql`
    - Tabla `bope_executions` con columnas: `id text PK`, `agent_id text`, `provider text`, `model text`, `"order" text`, `output text`, `cost_usd double precision`, `input_tokens integer`, `output_tokens integer`, `duration_ms integer`, `via_cli_tool boolean`, `status text`, `created_at timestamptz`
    - Índice `idx_bope_executions_created_at` en `created_at DESC`
    - _Requirements: 4.1_

  - [x] 3.2 Crear `apps/bope-command-center-server/src/executions.ts`
    - Exportar interfaz `ExecutionRecord` con todos los campos del diseño
    - Implementar `persistExecution(record: ExecutionRecord): Promise<void>` — INSERT en `bope_executions`
    - Implementar `getExecutions(limit: number, offset: number): Promise<{ rows: ExecutionRecord[]; total: number }>` — SELECT paginado ordenado por `created_at DESC`
    - Implementar `getExecutionById(id: string): Promise<ExecutionRecord | null>`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.3 Agregar endpoints `GET /api/executions` y `GET /api/executions/:id` en `server.ts`
    - Ambos requieren sesión autenticada (`requireSession`) — retornar 401 si no hay sesión
    - `GET /api/executions` acepta query params `limit` (default 50) y `offset` (default 0)
    - `GET /api/executions/:id` retorna 404 si no existe el registro
    - _Requirements: 4.2, 4.3, 4.5_

  - [ ]* 3.4 Escribir tests de propiedad para endpoints de ejecuciones (Property 8 y 9)
    - **Property 8: Los endpoints de /api/executions requieren autenticación**
    - **Validates: Requirements 4.5**
    - **Property 9: GET /api/executions retorna resultados ordenados por timestamp descendente**
    - **Validates: Requirements 4.2**
    - _Requirements: 4.2, 4.5_

- [ ] 4. ProviderGuard — Activación controlada de proveedores LLM
  - [x] 4.1 Crear `apps/bope-command-center-server/src/engine/providerGuard.ts`
    - Exportar `ProviderBlockedError` con campo `reason: "kill_switch" | "disabled" | "global_kill_switch" | "budget_exceeded"`
    - Exportar interfaz `ProviderPolicy` con `config: ProviderConfigRecord` y `governance: ProviderGovernanceRecord`
    - Implementar `assertProviderAllowed(policy: ProviderPolicy): "shadow" | "armed"` — lanzar `ProviderBlockedError` si `globalKillSwitchActive`, `killSwitchActive`, o `!enabled`; retornar `mode` efectivo si pasa
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Escribir tests de propiedad para `assertProviderAllowed` (Properties 5 y 6)
    - **Property 5: assertProviderAllowed bloquea cuando killSwitch está activo**
    - **Validates: Requirements 1.2, 1.6**
    - **Property 6: assertProviderAllowed bloquea cuando el provider está deshabilitado**
    - **Validates: Requirements 1.3**
    - _Requirements: 1.2, 1.3, 1.6_

  - [x] 4.3 Integrar `assertProviderAllowed` en `executor.ts`
    - Agregar parámetro `policy?: ProviderPolicy` a `ExecuteInput` (o cargarlo desde el store pasado como argumento)
    - Llamar a `assertProviderAllowed(policy)` antes de cualquier llamada LLM — lanzar si bloqueado
    - Si `mode === "shadow"`: emitir evento `started`, persistir en `bope_executions` con `status="shadow"`, emitir `completed` con `shadow:true`, retornar respuesta simulada sin llamar al LLM
    - Si `mode === "armed"`: flujo normal existente
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 4.4 Integrar `persistExecution` en `executor.ts`
    - Al completar exitosamente: llamar a `persistExecution` con todos los campos del resultado
    - Al fallar: llamar a `persistExecution` con `status="failed"` y el mensaje de error en `output`
    - En modo shadow: llamar a `persistExecution` con `status="shadow"`
    - _Requirements: 1.8, 4.1_

  - [ ] 4.5 Actualizar el handler `POST /api/execute` en `server.ts`
    - Cargar `providerConfigs` y `providerGovernance` del store antes de llamar a `execute()`
    - Construir `ProviderPolicy` y pasarla al executor
    - Capturar `ProviderBlockedError` y emitir evento SSE `type:"error"` + retornar HTTP 500 con mensaje descriptivo
    - _Requirements: 1.2, 1.3, 1.6, 1.7_

- [ ] 5. Checkpoint — ProviderGuard y persistencia
  - Verificar que una ejecución con provider `disabled` retorna error descriptivo, que el modo `shadow` no llama al LLM y persiste con `status="shadow"`, y que las ejecuciones reales se guardan en `bope_executions`. Consultar al usuario si hay dudas.

- [ ] 6. Streaming real en la UI (SSE chunks con agrupación por executionId)
  - [ ] 6.1 Actualizar `CommandCenterContext.tsx` — corregir `addToLog` para respetar límite de 500 entradas
    - Reemplazar `[...prev.slice(-199), entry]` por `[...prev.slice(-499), entry]` para mantener exactamente 500 entradas máximo
    - Asegurar que el log y la consola siempre muestren el mismo conjunto de entradas
    - _Requirements: 2.5, 2.6_

  - [ ]* 6.2 Escribir test de propiedad para el límite del executionLog (Property 7)
    - **Property 7: El executionLog nunca supera 500 entradas**
    - **Validates: Requirements 2.5, 2.6**
    - _Requirements: 2.5, 2.6_

  - [ ] 6.3 Agregar lógica de acumulación de chunks por `executionId` en `CommandCenterContext.tsx`
    - Mantener un `Map<executionId, string>` de chunks acumulados en el contexto
    - Cuando llega un evento `type="chunk"`: acumular el texto en el mapa por `executionId` en lugar de agregar una nueva entrada al log
    - Cuando llega `type="completed"` o `type="error"`: consolidar el chunk acumulado como una entrada final en el log y limpiar el mapa
    - Exponer `activeChunks: Map<string, string>` en el contexto para que la UI pueda renderizar el chunk en progreso
    - _Requirements: 2.7_

  - [ ] 6.4 Actualizar `TerminalConsole` en `Dashboard.tsx` para renderizar chunks en progreso
    - Mostrar el chunk activo del `executionId` en curso como una línea que se actualiza progresivamente
    - Usar `activeChunks` del contexto para renderizar el texto parcial mientras llegan los chunks
    - _Requirements: 2.7_

- [ ] 7. Panel de ejecución dedicado (`/execute`)
  - [ ] 7.1 Crear `apps/bope-command-center/src/pages/Execute.tsx`
    - Implementar `ExecutionPanel` con tres zonas: formulario (orden + selector provider + selector agente + botón EJECUTAR), consola en vivo (chunks del `executionId` activo), historial (ejecuciones de sesión + persistidas)
    - Formulario: deshabilitar mientras `isExecuting === true` y mostrar indicador de progreso simultáneamente
    - Consola en vivo: filtrar `executionLog` por `executionId` activo, acumular chunks progresivamente usando `activeChunks`
    - Mostrar advertencia visual si el provider seleccionado tiene `killSwitchActive=true` o `enabled=false`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

  - [ ] 7.2 Agregar ruta `/execute` en `App.tsx` y entrada en la navegación de `AppLayout.tsx`
    - Importar y registrar `Execute` en el `Switch` de `App.tsx`
    - Agregar `{ path: "/execute", label: "Ejecución", icon: "▶", shortLabel: "Ejecutar" }` al array `NAV_ITEMS` en `AppLayout.tsx`
    - _Requirements: 3.1_

  - [ ] 7.3 Agregar llamada a `GET /api/executions` en `CommandCenterContext.tsx` y exponer historial
    - Agregar función `fetchExecutionHistory(limit?: number, offset?: number)` que llama a `GET /api/executions`
    - Exponer `executionHistory: ExecutionRecord[]` en el contexto
    - Llamar a `fetchExecutionHistory` al cargar el `ExecutionPanel` (desde `useEffect` en el componente)
    - _Requirements: 3.4, 4.4_

  - [ ] 7.4 Implementar panel de detalle de ejecución en `Execute.tsx`
    - Al seleccionar una ejecución del historial, mostrar el output completo en un panel de detalle lateral
    - Mostrar: agente, provider, modelo, costo USD, duración ms, timestamp, status, output completo
    - _Requirements: 3.5_

  - [ ] 7.5 Agregar banner de error de DB en `AppLayout.tsx`
    - Consultar `GET /api/healthz` al montar el layout (con intervalo de 30s)
    - Si `db: "error"`, mostrar banner persistente en la parte superior del layout con mensaje de error
    - _Requirements: 7.5_

  - [ ]* 7.6 Escribir test de propiedad para advertencia visual de provider bloqueado (Property 10)
    - **Property 10: Advertencia visual cuando el provider está bloqueado**
    - **Validates: Requirements 3.7**
    - _Requirements: 3.7_

- [ ] 8. Checkpoint — Panel de ejecución y streaming
  - Verificar que `/execute` es accesible desde la navegación, que el formulario se deshabilita durante la ejecución, que los chunks aparecen progresivamente en la consola, y que el historial carga desde `GET /api/executions`. Consultar al usuario si hay dudas.

- [x] 9. Cobertura de tests del motor de ejecución
  - [x] 9.1 Agregar `vitest` y `fast-check` como devDependencies en `apps/bope-command-center-server/package.json`
    - Agregar `"vitest": "^2.0.0"` y `"fast-check": "^3.22.0"` en `devDependencies`
    - Agregar script `"test": "vitest run"` en `scripts`
    - Agregar script `"test": "pnpm --dir apps/bope-command-center-server run test"` en el `package.json` raíz
    - _Requirements: 6.7_

  - [x] 9.2 Crear `apps/bope-command-center-server/src/__tests__/soldiers.test.ts`
    - Tests unitarios: cada agente en `SONNET_FORCE` → `selectModel` retorna `"claude-sonnet-4-6"`
    - Tests unitarios: cada agente en `HAIKU_FORCE` → `selectModel` retorna `"claude-haiku-4-5-20251001"`
    - Tests unitarios: orden corta sin keywords → haiku; orden larga (>50 palabras) → sonnet; orden con keyword compleja → sonnet
    - Tests unitarios: cada keyword de cada regla de routing → `autoRouteSoldier` retorna el agentId esperado
    - Tests unitarios: orden sin keywords → `autoRouteSoldier` retorna `"john-rambo"`
    - _Requirements: 6.1, 6.2_

  - [ ]* 9.3 Escribir tests de propiedad para `autoRouteSoldier` (Property 1)
    - **Property 1: autoRouteSoldier siempre retorna un agentId válido**
    - **Validates: Requirements 6.3**
    - _Requirements: 6.3_

  - [ ]* 9.4 Escribir tests de propiedad para `selectModel` (Property 2)
    - **Property 2: selectModel siempre retorna exactamente uno de los dos modelos válidos**
    - **Validates: Requirements 6.4**
    - _Requirements: 6.4_

  - [x] 9.5 Crear `apps/bope-command-center-server/src/__tests__/budget.test.ts`
    - Tests unitarios: `annualSpent = 0` → status `"ok"`; `74%` → `"ok"`; `75%` → `"warning"`; `89%` → `"warning"`; `90%` → `"critical"`; `100%` → `"critical"`
    - _Requirements: 6.5_

  - [ ]* 9.6 Escribir tests de propiedad para `getBudgetSummary` (Property 3)
    - **Property 3: Invariante de conservación del presupuesto**
    - **Validates: Requirements 6.6**
    - _Requirements: 6.6_

  - [ ]* 9.7 Escribir tests de propiedad para `checkBudget` (Property 4)
    - **Property 4: checkBudget rechaza cuando el gasto supera el límite**
    - **Validates: Requirements 1.7**
    - _Requirements: 1.7_

- [ ] 10. Checkpoint — Tests
  - Ejecutar `pnpm test` desde la raíz y verificar que todos los tests pasan sin conexión a Neon ni variables de entorno externas. Consultar al usuario si hay dudas.

- [ ] 11. Limpieza arquitectónica
  - [ ] 11.1 Mover `app/` a `archive/app-nextjs-legacy/`
    - Mover el directorio `app/` a `archive/app-nextjs-legacy/` usando `git mv` para preservar historial
    - Actualizar `pnpm-workspace.yaml` para excluir `archive/*` (o eliminar la entrada `apps/*` que ya no incluye `app/`)
    - _Requirements: 5.2, 5.3_

  - [ ] 11.2 Actualizar texto del Dashboard en `apps/bope-command-center/src/pages/Dashboard.tsx`
    - Reemplazar `"OPERACIONES CON PERSISTENCIA LOCAL"` por `"OPERACIONES CON PERSISTENCIA EN NEON"`
    - _Requirements: 5.4_

  - [ ] 11.3 Crear `docs/PLATAFORMA-BOPE-vNEXT.md`
    - Documentar: objetivo técnico del sistema, componentes del MVP, estructura del repositorio, modelo de datos en Neon, contrato de eventos SSE, flujo operativo de una ejecución, interfaz de adaptadores para Claude/Codex, fases de construcción
    - Incluir decisión explícita sobre `app/` (archivado en `archive/app-nextjs-legacy/`)
    - _Requirements: 5.1, 5.2_

- [ ] 12. Checkpoint final — Verificación integral
  - Ejecutar `pnpm typecheck` para verificar que no hay errores de TypeScript en ningún paquete. Ejecutar `pnpm test` para confirmar que todos los tests pasan. Verificar que el servidor arranca, que `GET /api/healthz` retorna `db: "connected"`, y que la ruta `/execute` es funcional. Consultar al usuario si hay dudas.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental antes de avanzar a la siguiente área
- Los tests de propiedad usan `fast-check` con mínimo 100 iteraciones por defecto
- Las funciones `autoRouteSoldier`, `selectModel` y `getBudgetSummary` son puras — no requieren mocking
- Para `checkBudget`, mockear `readBudget` con `vi.mock` de Vitest
- El lenguaje de implementación es TypeScript en todo el stack

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.4", "3.2", "9.1"] },
    { "id": 2, "tasks": ["3.3", "4.1", "9.2", "9.5"] },
    { "id": 3, "tasks": ["3.4", "4.2", "9.3", "9.4", "9.6", "9.7"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "7.1", "7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "7.6"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3"] }
  ]
}
```
