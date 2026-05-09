# Multica — BOPE War Room · Operations

Especificación de tablero sugerido para Multica (nombres ajustables en la UI).

## Proyecto

- **Nombre:** `BOPE War Room — Operations`
- **Propósito:** Visibilidad de misiones desde intel hasta cierre con evidencia.

## Columnas sugeridas (orden izquierda → derecha)

1. **Intel / Triage** — Entrada, clasificación, duplicados, falta de datos.
2. **Assigned** — JOHN asignó Lead (y Apoyo si aplica); descripción y DoD presentes.
3. **Execute** — Trabajo activo; enlaces a PRs, ramas, logs.
4. **Review / QA** — HOUSE o revisión requerida; checklist corto.
5. **Security** — Opcional: items que pasan por CERBERUS antes de cerrar.
6. **Blocked** — Dependencia externa o decisión de SANTIAGO; dueño y fecha.
7. **Evidence** — Artefactos de cierre reunidos; no es “done” sin evidencia.
8. **Closed** — Winston registró o quedó acuerdo de cierre mínimo documentado.

## Reglas de flujo

- Nada entra a **Closed** sin cumplir **Definition of Done** del issue.
- **Paralelismo:** issues hermanos enlazados en descripción (mismo `mission_id` o etiqueta).
- **Escalada:** de Execute a Blocked solo con nota visible al mando (JOHN).

## Etiquetas sugeridas

- `mission`, `bug`, `improvement`, `security`, `frontend`, `backend`, `integration`, `docs`
- `priority:p1` … `priority:p4`
- `activation:restricted` (BLADE / SICARIO)
- `needs:winston`

## Automations (ideas)

- Al mover a **Closed**, comentario obligatorio con enlaces de evidencia.
- Nuevo issue tipo `mission` → plantilla con campos Authority / Modalidad / Lead / Apoyo.
