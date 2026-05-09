# Roadmap Multica — BOPE War Room

Roadmap corto alineado al repo canónico **BOPE VERSION DEFINITIVA**.

## Semana 1 — Cimientos

- Árbol `bope/` versionado: doctrina, `roster.json`, prompts en `bope/agents/`.
- Validar que `platform/multica/` existente no se sobrescribe; README de plataforma si falta.
- Crear agentes en Multica según `roster.json` (IDs estables).

## Semana 2 — Operación diaria

- Skills en `bope/skills/` referenciados desde playbooks o documentación de agente.
- Issue templates GitHub en uso; etiquetas del tablero creadas.
- Primer handoff JOHN → especialista → evidencia → WINSTON.

## Semana 3 — Ciclo completo

- Tablero *BOPE War Room — Operations* en uso semanal.
- Una misión punta a punta con paralelismo documentado (modalidad b o c).
- Ajuste de `roster.json` si aparecen alias o skills reales de Multica.

## Semana 4 (opcional) — Hardening

- Workflow CI: JSON válido + presencia de archivos de agente listados en roster.
- Documentar CLI Multica o scripts en `platform/multica/` sin duplicar doctrina `.claude/`.
