# Orchestrator Contract v1 - MVP

Este documento define el contrato del Orchestrator para la plataforma BOPE v1.

## Endpoints MVP

### 1. GET `/api/mission/:slug`
**Descripción:** Obtiene el estado actual de la misión, la tarea activa y el agente responsable.
- **Body:** N/A
- **Response:** `200 OK` con el objeto `Mission` y `Task` actual.
- **Escritura en DB:** Ninguna (Lectura pura).

### 2. POST `/api/mission/:slug/command`
**Descripción:** Único punto de entrada para órdenes del COMMANDER.
- **Body:** `{ "order": string, "metadata"?: JSON }`
- **Response:** `202 Accepted` con el `task_id`.
- **Escritura en DB:**
  - `tasks`: Crea nueva tarea con `status='pending'` y `current_agent='COMMANDER'`.
  - `events`: Inserta evento `type='system_log'` con la orden.

### 3. POST `/api/mission/:slug/agent/handoff`
**Descripción:** Contrato canónico para transiciones entre agentes. Implementa el flujo inviolable.
- **Body:** 
  ```json
  {
    "taskId": "UUID",
    "reason": "string",
    "to": "agent_id",
    "payload": "JSON"
  }
  ```
- **Response:** `200 OK` con confirmación de transición.
- **Escritura en DB:**
  - `tasks`: Actualiza tarea actual a `status='completed'`. Crea nueva tarea con `current_agent=to`.
  - `events`: Inserta evento `type='handoff'`.
  - `comms_log`: Registra la traza del handoff y latencia.

### 4. POST `/api/mission/:slug/agent/result`
**Descripción:** Endpoint donde el agente entrega el resultado final de su tarea asignada.
- **Body:**
  ```json
  {
    "taskId": "UUID",
    "status": "completed | failed",
    "result": "string",
    "nextAgent": "string (optional fallback)",
    "usage": { "tokensIn": number, "tokensOut": number }
  }
  ```
- **Response:** `200 OK`.
- **Escritura en DB:**
  - `tasks`: Actualiza `status` y `result`.
  - `events`: Inserta evento `type='agent_response'`.
  - `comms_log`: Registra uso de tokens y métricas.
  - `agent_reputation`: Actualiza contadores de éxito/fallo y latencia media.

### 5. GET `/api/mission/:slug/sse`
**Descripción:** Canal SSE nativo de Next.js para streaming de eventos a la interfaz.
- **Body:** N/A
- **Response:** `text/event-stream`.
- **Escritura en DB:** Ninguna (Emisión de eventos en tiempo real).

## Justificación
- **Handoff:** Centraliza la lógica de "quién sigue" asegurando que el estado en `tasks` sea siempre coherente.
- **Métricas:** El uso de `comms_log` y `agent_reputation` permite al COMMANDER evaluar el performance de cada modelo.
- **Fallback:** Si el `nextAgent` no es válido o hay error, el orchestrator redirige por defecto a `COMMANDER`.
