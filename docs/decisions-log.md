# BOPE - Registro de Decisiones
Mision: BOPE-PLATFORM-001

---

## DECISION-001 | 2026-03-23
Tomada por: COMMANDER
Descripcion: Estandares de input, rechazo y SLA adoptados
como contrato operativo BOPE v1.
Impacto: todos los agentes quedan sujetos a input-standard
y rejection-rule desde este momento.
Revision: PX audita cumplimiento en cada mision cerrada.

---

## DECISION-002 | 2026-03-23
Tomada por: COMMANDER
Descripcion: Tareas de bajo riesgo pueden fallar sin STOP.
El fallo se registra, alimenta agent_reputation y cierra
el loop de aprendizaje. STOP solo aplica en las 3 condiciones
de rejection-rule.md.
Impacto: CX implementa actualizacion automatica de
agent_reputation en TASK_FAILED y TASK_COMPLETED
desde Fase 1 del orchestrator.

---

## DECISION-003 | 2026-03-23
Tomada por: COMMANDER
Descripcion: Registro oficial de ordenes vive en
docs/ORDENES.md - archivo dedicado.
COMMS.log = trazabilidad tecnica
MISION-ACTIVA.md = estado vivo de mision
ORDENES.md = registro limpio y numerado de ordenes

---

## DECISION-004 | 2026-03-23
Tomada por: COMMANDER
Descripcion: Nombre oficial de mision es BOPE-PLATFORM-001.
BOPE-PLATFORM-BOOT queda como nombre historico de la
fase de arranque unicamente.
Impacto: slug en tabla missions = 'bope-platform-001'
Todas las ordenes futuras usan este nombre.
