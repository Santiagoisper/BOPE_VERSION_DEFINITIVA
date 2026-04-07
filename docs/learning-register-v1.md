# Registro de Aprendizaje Estrategico BOPE v1
Fecha: 2026-03-23 | Autor: PX/INTEL

## Principios registrados

1. La inteligencia efectiva es sistemica, no model-based
   Impacto: adaptadores en /orchestrator/adapters/ normalizan
   outputs sin importar el modelo. decideNextAgent() es el
   sistema, no el modelo que ejecuta.

2. El estado estructurado reemplaza al contexto difuso
   Impacto: persistencia total en Neon es no negociable.
   Ningun agente decide basandose en lo que recuerda.

3. Separacion obligatoria entre generacion, evaluacion y ejecucion
   Impacto: el agente que genera no evalua ni ejecuta.
   Agregar evaluated_by en tasks en schema v2.

4. El aprendizaje ocurre en loops, no en eventos aislados
   Impacto: orchestrator actualiza agent_reputation en cada
   TASK_COMPLETED y TASK_FAILED automaticamente.

5. La evaluacion es condicion necesaria para mejorar
   Impacto: toda orden debe incluir criterio de exito
   verificable, no solo entregable. Agregar a input-standard v2.

6. El control debe prevenir dano sin bloquear operacion
   Impacto: STOP solo en 3 condiciones irreversibles.
   Fallos de bajo riesgo se registran y alimentan el loop.

## Cambios operativos pendientes validados por COMMANDER
1. Agregar evaluated_by VARCHAR(50) a tasks - schema v2
2. Agregar item 6 a input-standard.md - criterio de exito
3. Logica agent_reputation en orchestrator - Fase 1 CX (URGENTE)
