# Documento de Requisitos — BOPE Completion

## Introduction

BOPE (Batallón de Operaciones de Precisión y Excelencia) es un sistema multiagente para desarrollo de software. La plataforma ya tiene una base sólida: frontend React/Vite, backend Node.js nativo, persistencia en Postgres (Neon), autenticación JWT, SSE para eventos en tiempo real, y un motor de ejecución con routing automático de agentes.

Lo que falta para considerar el sistema **terminado y funcional** se agrupa en cinco áreas:

1. **Activación controlada de proveedores LLM** — Claude y Codex están en modo `disabled`. El motor ya existe pero los providers están bloqueados por política y kill switch.
2. **Streaming real en la UI** — El endpoint `/api/execute` existe y el contexto tiene `executeOrder`, pero la respuesta es un JSON único (no streaming). El SSE ya está conectado pero solo recibe eventos de ejecución, no chunks en tiempo real.
3. **Panel de ejecución en tiempo real** — El Dashboard tiene una consola funcional, pero no hay página dedicada de ejecución con historial persistido, selección de agente, y visualización de chunks en vivo.
4. **Claridad arquitectónica** — El directorio `app/` (Next.js) coexiste con `apps/bope-command-center/` (React/Vite) sin decisión documentada. El documento `docs/PLATAFORMA-BOPE-vNEXT.md` no existe.
5. **Cobertura de tests** — Solo existe `tests/test_mission_parser.py`. No hay tests para el motor de ejecución, el routing de agentes, ni los endpoints críticos.

---

## Glosario

- **Command_Center**: El frontend React/Vite en `apps/bope-command-center/`.
- **Server**: El backend Node.js nativo en `apps/bope-command-center-server/`.
- **Engine**: El motor de ejecución compuesto por `executor.ts`, `llm.ts`, `soldiers.ts`, `tools.ts` y `budget.ts`.
- **Provider**: Un proveedor LLM externo. Los proveedores soportados son `claude` (Anthropic) y `codex` (OpenAI).
- **Kill_Switch**: Bandera booleana `killSwitchActive` en `bope_provider_configs` que bloquea toda ejecución real de un provider.
- **Modo_Shadow**: Estado de provider donde las llamadas se registran y validan contra límites pero no se envían al LLM externo. Útil para pruebas de gobernanza.
- **Modo_Armed**: Estado de provider donde las llamadas se ejecutan realmente contra el LLM externo.
- **SSE**: Server-Sent Events. Canal unidireccional servidor → cliente en `/api/events`.
- **Execution_Panel**: Página dedicada de la UI para enviar órdenes y ver respuestas en tiempo real.
- **Chunk**: Fragmento parcial de texto emitido por el LLM durante la generación de una respuesta.
- **Soldier**: Un agente del batallón BOPE (JOHN, PIXEL, FORGE, HOUSE, etc.) con un system prompt y preferencia de modelo.
- **Budget_Guard**: La lógica en `budget.ts` que verifica y registra el gasto antes y después de cada llamada LLM.
- **COMMANDER**: Santiago, el único usuario del sistema.

---

## Requirements

### Requirement 1: Activación controlada de proveedores LLM

**User Story:** Como COMMANDER, quiero poder activar Claude y Codex de forma controlada y reversible, para ejecutar órdenes reales contra LLMs externos sin perder el control de gasto ni la capacidad de corte de emergencia.

#### Criterios de Aceptación

1. WHEN el COMMANDER actualiza un provider con `enabled=true`, `mode="armed"` y `killSwitchActive=false` mediante `PATCH /api/providers/control`, THE Server SHALL persistir el cambio en `bope_provider_configs` garantizando que los valores específicos `enabled=true`, `mode="armed"` y `killSwitchActive=false` queden aplicados en el estado final.
2. WHEN el Engine recibe una orden de ejecución y el provider seleccionado tiene `killSwitchActive=true`, THE Engine SHALL rechazar la ejecución con un error descriptivo sin realizar ninguna llamada externa.
3. WHEN el Engine recibe una orden de ejecución y el provider seleccionado tiene `enabled=false`, THE Engine SHALL rechazar la ejecución con un error descriptivo sin realizar ninguna llamada externa.
4. WHEN el Engine recibe una orden de ejecución y el provider seleccionado tiene `mode="shadow"`, THE Engine SHALL simular la ejecución registrando el intento en auditoría pero sin enviar tokens al LLM externo, retornando una respuesta simulada.
5. WHEN el Engine recibe una orden de ejecución y el provider seleccionado tiene `mode="armed"` y `killSwitchActive=false` y `enabled=true`, THE Engine SHALL ejecutar la llamada real al LLM externo.
6. WHEN el COMMANDER activa el kill switch global mediante `PATCH /api/providers/governance` con `globalKillSwitchActive=true`, THE Server SHALL bloquear toda ejecución real de todos los providers independientemente de su configuración individual.
7. THE Server SHALL verificar los límites de presupuesto mensual y anual del provider antes de cada ejecución real, y rechazar la llamada si el gasto proyectado supera el límite configurado.
8. WHEN una ejecución real es completada, THE Engine SHALL registrar el costo real en USD, tokens de entrada y tokens de salida en el Budget_Guard y en el audit log.

---

### Requirement 2: Streaming de respuestas LLM en tiempo real

**User Story:** Como COMMANDER, quiero ver los chunks de respuesta del LLM aparecer en la consola a medida que se generan, para tener feedback inmediato sin esperar a que la respuesta completa esté lista.

#### Criterios de Aceptación

1. WHEN el Server recibe `POST /api/execute`, THE Server SHALL emitir cada chunk de texto recibido del LLM como un evento SSE de tipo `execution` con `type="chunk"` a todos los clientes SSE conectados.
2. WHEN el Server inicia una ejecución, THE Server SHALL emitir un evento SSE de tipo `execution` con `type="started"` antes de la primera llamada al LLM.
3. WHEN el Server completa una ejecución exitosamente, THE Server SHALL emitir un evento SSE de tipo `execution` con `type="completed"` incluyendo costo, modelo y duración.
4. IF una ejecución falla, THEN THE Server SHALL emitir un evento SSE de tipo `execution` con `type="error"` incluyendo el mensaje de error.
5. WHEN el Command_Center recibe un evento SSE de tipo `execution`, THE Command_Center SHALL agregar la entrada al `executionLog` en el contexto descartando las entradas más antiguas si se supera el límite de 500, y renderizarla en la consola activa manteniendo consistencia entre el log y la visualización.
6. THE Command_Center SHALL mantener un máximo de 500 entradas en el `executionLog` en memoria, descartando las más antiguas cuando se supera el límite para garantizar que el log y la consola siempre muestren el mismo conjunto de entradas.
7. WHEN el Command_Center recibe un chunk de tipo `chunk`, THE Command_Center SHALL acumular los chunks del mismo `executionId` en una sola línea visual que se actualiza progresivamente.

---

### Requirement 3: Panel de ejecución dedicado

**User Story:** Como COMMANDER, quiero una página dedicada para enviar órdenes al batallón y ver el historial de ejecuciones con sus resultados completos, para operar el sistema de forma eficiente sin mezclar la consola con el dashboard de estado.

#### Criterios de Aceptación

1. THE Command_Center SHALL exponer una ruta `/execute` accesible desde la navegación principal del AppLayout.
2. WHEN el COMMANDER accede a `/execute`, THE Command_Center SHALL mostrar un formulario de orden con: campo de texto para la orden, selector de provider (auto/claude/codex), selector de agente (opcional), y botón de ejecución.
3. WHEN el COMMANDER envía una orden desde el Execution_Panel, THE Command_Center SHALL deshabilitar el formulario e inmediatamente mostrar un indicador visual de progreso de forma simultánea mientras `isExecuting` sea verdadero.
4. THE Command_Center SHALL mostrar el historial de ejecuciones de la sesión actual en el Execution_Panel, con: agente asignado, provider usado, modelo, costo en USD, duración en ms, y output completo.
5. WHEN el COMMANDER selecciona una ejecución del historial, THE Command_Center SHALL mostrar el output completo de esa ejecución en un panel de detalle.
6. THE Command_Center SHALL mostrar el estado actual del Engine (disponibilidad de CLI de Claude y Codex, API keys configuradas) en el Execution_Panel consultando `GET /api/engine-status`.
7. IF el provider seleccionado tiene `killSwitchActive=true` o `enabled=false`, THEN THE Command_Center SHALL mostrar una advertencia visual antes de permitir el envío de la orden.

---

### Requirement 4: Persistencia de ejecuciones

**User Story:** Como COMMANDER, quiero que cada ejecución quede registrada en la base de datos con su resultado completo, para poder auditar el historial de órdenes y costos entre sesiones.

#### Criterios de Aceptación

1. WHEN el Engine completa una ejecución (exitosa o fallida), THE Server SHALL persistir un registro en la tabla `bope_executions` con: id, agentId, provider, model, order (texto de la orden), output, costUSD, inputTokens, outputTokens, durationMs, viaCliTool, status, y timestamp.
2. THE Server SHALL exponer `GET /api/executions` que retorna el historial de ejecuciones paginado, ordenado por timestamp descendente, con soporte para parámetros `limit` y `offset`.
3. THE Server SHALL exponer `GET /api/executions/:id` que retorna el detalle completo de una ejecución por su id.
4. WHEN el Command_Center carga el Execution_Panel, THE Command_Center SHALL consultar `GET /api/executions` para mostrar el historial persistido de ejecuciones previas.
5. THE Server SHALL requerir sesión autenticada para todos los endpoints de `/api/executions`, retornando HTTP 401 si la sesión no está presente o es inválida.

---

### Requirement 5: Decisión y limpieza arquitectónica

**User Story:** Como COMMANDER, quiero que la arquitectura del repositorio sea clara y sin ambigüedades, para que cualquier agente del batallón pueda orientarse rápidamente sin confundirse entre versiones paralelas.

#### Criterios de Aceptación

1. THE Server SHALL crear el documento `docs/PLATAFORMA-BOPE-vNEXT.md` que defina: objetivo técnico del sistema, componentes del MVP, estructura del repositorio, modelo de datos en Neon, contrato de eventos SSE, flujo operativo de una ejecución, interfaz de adaptadores para Claude/Codex, y fases de construcción.
2. THE Server SHALL documentar en `docs/PLATAFORMA-BOPE-vNEXT.md` la decisión explícita sobre el directorio `app/` (Next.js): si se mantiene como versión futura, se archiva, o se elimina.
3. WHERE el directorio `app/` es descartado, THE Server SHALL moverlo a `archive/app-nextjs-legacy/` o eliminarlo, y actualizar `pnpm-workspace.yaml` para excluirlo.
4. THE Command_Center SHALL actualizar el texto "OPERACIONES CON PERSISTENCIA LOCAL" del Dashboard para reflejar el estado real del sistema (persistencia remota en Neon).

---

### Requirement 6: Cobertura de tests del motor de ejecución

**User Story:** Como COMMANDER, quiero que el motor de ejecución tenga tests automatizados, para poder modificar el routing de agentes, la selección de modelos y la lógica de presupuesto con confianza.

#### Criterios de Aceptación

1. THE Test_Suite SHALL incluir tests unitarios para `autoRouteSoldier` que verifiquen que cada conjunto de keywords del routing table mapea al agentId correcto.
2. THE Test_Suite SHALL incluir tests unitarios para `selectModel` que verifiquen que la selección de modelo (haiku vs sonnet) es correcta para cada combinación de agentId y longitud/complejidad de orden.
3. THE Test_Suite SHALL incluir tests de propiedad para `autoRouteSoldier` que verifiquen que para cualquier orden de texto, la función retorna siempre un agentId válido (nunca undefined ni string vacío).
4. THE Test_Suite SHALL incluir tests de propiedad para `selectModel` que verifiquen que para cualquier combinación de orden y agentId, la función retorna exactamente uno de los dos modelos válidos (`claude-haiku-4-5-20251001` o `claude-sonnet-4-6`).
5. THE Test_Suite SHALL incluir tests unitarios para `getBudgetSummary` que verifiquen que el status retornado (`ok`, `warning`, `critical`) es correcto para distintos niveles de gasto.
6. THE Test_Suite SHALL incluir tests de propiedad para `getBudgetSummary` que verifiquen que `annualRemaining + annualSpent === annualLimit` para cualquier estado de presupuesto válido (invariante de conservación).
7. THE Test_Suite SHALL ejecutarse con `pnpm test` desde la raíz del monorepo sin requerir variables de entorno externas ni conexión a Neon.

---

### Requirement 7: Configuración de entorno y arranque operativo

**User Story:** Como COMMANDER, quiero poder levantar el sistema completo con un único procedimiento documentado, para no depender de memoria ni de documentación dispersa.

#### Criterios de Aceptación

1. THE Server SHALL validar al arrancar que las variables de entorno críticas están presentes (`BOPE_COMMAND_CENTER_DATABASE_URL`, `JWT_SECRET`) y fallar con un mensaje descriptivo si alguna falta.
2. WHERE `ANTHROPIC_API_KEY` está configurada y `BOPE_DISABLE_API` no es `true`, THE Engine SHALL usar el modo API de Claude como fallback cuando el CLI no está disponible en el momento del arranque del servidor.
3. WHERE `OPENAI_API_KEY` está configurada y `BOPE_DISABLE_API` no es `true`, THE Engine SHALL usar el modo API de Codex como fallback cuando el CLI no está disponible en el momento del arranque del servidor.
4. THE Server SHALL exponer `GET /api/healthz` que retorna `{ ok: true, db: "connected" | "error", version: string }` verificando la conectividad real con Neon.
5. THE Command_Center SHALL mostrar un banner de error visible cuando `GET /api/healthz` retorna `db: "error"`, indicando que la base de datos no está disponible.
6. THE Server SHALL documentar en `apps/bope-command-center-server/.env.example` todas las variables de entorno requeridas y opcionales con descripción de cada una.
