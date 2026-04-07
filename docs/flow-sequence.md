# Flow Sequence - Orchestrator v1

Este documento detalla la secuencia de pasos desde que el COMMANDER emite una orden hasta que el sistema procesa la respuesta del agente y actualiza la interfaz en tiempo real.

## Secuencia de Ejecución

1. **[COMMANDER] → [Orchestrator]:** Envía orden vía `/api/mission/:slug/command`.
   - **DB WRITE:** Inserta en `tasks` (status: `pending`) y en `events` (type: `system_log`).

2. **[Orchestrator] → [Interface]:** Emite evento SSE `MISSION_UPDATED`.
   - **SSE Content:** `{ type: 'mission_update', status: 'new_task_pending', taskId: 'UUID' }`.

3. **[Orchestrator] → [Logic]:** Evalúa la orden e identifica el agente inicial.
   - **Acción:** Si no se especifica, usa el orquestador interno para decidir (p. ej. `Gemini` por defecto).

4. **[Orchestrator] → [Adapter]:** Llama a `Adapter.execute(NormalizedInput)`.
   - **Acción:** El adaptador (Claude/Codex/Gemini) llama a su API externa y formatea el `NormalizedOutput`.

5. **[Adapter] → [Orchestrator]:** Devuelve `NormalizedOutput` con `reasoning`, `status`, `nextAgent`, `result`.
   - **Acción:** El orquestador valida que los campos obligatorios existan.

6. **[Orchestrator] → [Database]:** Registra el resultado y la transición.
   - **DB WRITE (`tasks`):** Actualiza `status`, `result` y `reason` de la tarea actual.
   - **DB WRITE (`events`):** Inserta `type='agent_response'`.
   - **DB WRITE (`comms_log`):** Inserta traza de la llamada (tokens, latencia).
   - **DB WRITE (`agent_reputation`):** Incrementa contadores de éxito/fallo del agente.

7. **[Orchestrator] → [Interface]:** Emite evento SSE `AGENT_REPLIED`.
   - **SSE Content:** `{ type: 'agent_reply', agent: 'ID', reasoning: '...', result: '...' }`.

8. **[Orchestrator] → [Logic]:** Ejecuta `decideNextAgent()`.
   - **Lógica:** Si `status == 'handoff'`, el orquestador prepara la siguiente llamada.
   - **Lógica:** Si el adaptador falló, redirige a `COMMANDER`.

9. **[Orchestrator] → [Database]:** (Si hay Handoff) Crea la siguiente tarea.
   - **DB WRITE (`tasks`):** Crea nueva fila con `current_agent = nextAgent` y `status='pending'`.
   - **DB WRITE (`events`):** Inserta `type='handoff'`.

10. **[Orchestrator] → [Interface]:** Emite evento SSE `HANDOFF_INITIATED`.
    - **SSE Content:** `{ type: 'handoff', from: '...', to: '...', reason: '...' }`.

11. **Loop:** Si el flujo continúa, vuelve al Paso 4 con el nuevo agente. Si el flujo termina en `COMMANDER`, se detiene la secuencia automática.

## Manejo de Fallos SSE
Si el SSE se desconecta, la interfaz puede rehidratar el estado llamando a `GET /api/mission/:slug` al reconectarse. La base de datos siempre es la fuente de verdad.
