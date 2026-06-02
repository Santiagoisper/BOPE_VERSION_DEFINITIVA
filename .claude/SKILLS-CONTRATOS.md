# SKILLS — CONTRATOS DE ENTRADA/SALIDA
## Cada skill es una función. Tiene input, acción y output verificable.
*Mantenido por JOHN. Actualizar al incorporar nuevos skills.*

---

## /impeccable [cmd]
**Soldado:** PIXEL
**Entrada:** Ruta o área de UI + comando específico (audit/polish/craft/critique/bolder/harden/live)
**Acción:** Analiza código/diseño contra 27 reglas de anti-patterns y 7 referencias de dominio (tipografía, color, motion, spatial, interaction, responsive, UX writing)
**Salida verificable:** Reporte con hallazgos categorizados por severidad + cambios aplicados al código
**Log:** Mencionar resultado en SQUAD-COMMS al cerrar frente

---

## /ce-brainstorm [descripción]
**Soldado:** JOHN / FORGE
**Entrada:** Descripción del feature o problema a resolver
**Acción:** Q&A interactivo para clarificar requisitos antes de planificar
**Salida verificable:** Archivo `docs/brainstorms/[nombre]-requirements.md` con requisitos formalizados
**Log:** Referenciar en la orden de misión

---

## /ce-plan [archivo-requirements]
**Soldado:** JOHN / FORGE
**Entrada:** Ruta al archivo de requirements del brainstorm
**Acción:** Genera plan de implementación detallado con pasos, archivos y criterios de cierre
**Salida verificable:** Archivo de plan con checklist verificable ítem por ítem
**Log:** Plan adjunto a la misión activa

---

## /ce-work
**Soldado:** FORGE / PIXEL
**Entrada:** Plan generado por /ce-plan
**Acción:** Ejecuta el plan en worktrees con task tracking
**Salida verificable:** Código implementado, tests pasando, PR listo
**Log:** Status en SQUAD-COMMS por checkpoint

---

## /ce-compound
**Soldado:** WINSTON / JOHN
**Entrada:** Sesión o misión cerrada
**Acción:** Extrae patrones, decisiones y aprendizajes de la sesión en formato reutilizable
**Salida verificable:** Entrada nueva en `logs/MEMORIA/MEMORIA-TACTICA.md` con tag de tipo y severidad
**Log:** Notificar en NOTICIAS-BATALLON si el aprendizaje es de alto impacto

---

## /understand [--language]
**Soldado:** HOUSE / JOHN
**Entrada:** Directorio del proyecto (o subdirectorio para monorepos grandes)
**Acción:** Pipeline multi-agente: scanner → file-analyzer → architecture-analyzer → tour-builder → reviewer. Genera knowledge graph en `.understand-anything/knowledge-graph.json`
**Salida verificable:** Dashboard accesible con `/understand-dashboard`, grafo JSON presente
**Log:** Citar en la orden de misión si el codebase es nuevo para el batallón

---

## /understand-chat [pregunta]
**Soldado:** HOUSE / JOHN
**Entrada:** Pregunta en lenguaje natural sobre el codebase
**Acción:** Consulta el knowledge graph generado y responde con referencias a nodos
**Salida verificable:** Respuesta con referencias a archivos/funciones específicas
**Prerequisito:** /understand debe haberse ejecutado primero

---

## /harness [descripción del proyecto]
**Soldado:** JOHN
**Entrada:** Descripción del dominio del proyecto en una oración
**Acción:** Genera equipo de agentes (.claude/agents/) y skills (.claude/skills/) usando uno de 6 patrones (Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical)
**Salida verificable:** Archivos de agentes y skills presentes en el repo
**Log:** Documentar patrón elegido en la orden de misión

---

## /cso (CERBERUS Security Operations)
**Soldado:** CERBERUS
**Entrada:** Código, PR o endpoint a auditar
**Acción:** Revisión OWASP + STRIDE, chequeo de secrets, análisis de superficie de ataque
**Salida verificable:** Reporte con hallazgos P0-P3, sin secrets expuestos confirmado
**Log:** Firmado en SQUAD-COMMS antes de cualquier deploy a producción

---

## cerberus-security [dominio]
**Soldado:** CERBERUS
**Entrada:** Dominio de seguridad (web-application-security, api-security, devsecops, cloud-security, incident-response, vulnerability-management)
**Acción:** Aplica el playbook del dominio — workflow paso a paso con herramientas específicas (Volatility3, Sigma, Nessus, etc.)
**Salida verificable:** Reporte con hallazgos mapeados a MITRE ATT&CK + acciones de remediación
**Log:** Entrada en NOTICIAS-BATALLON si se detecta P0
