# Extracto Util: monday-learning-skill

Origen: `Santiagoisper/Proyecto-Memoria-Santi/docs/MONDAY_LEARNING_EXTRACT.md`.

Fuente: `Santiagoisper/monday-learning-skill` (archivado)
Actualizado: 2026-04-21
Objetivo: rescatar lo reusable para agentes sin depender del repo original.

## Valor real del skill

El repo aporta un loop de aprendizaje semanal simple y potente:
1. Selecciona tema nuevo o de repaso.
2. Genera micro-leccion con LLM.
3. Registra aprendizaje, nota y rating.
4. Mantiene historial + racha.

Ese patrón sirve para agentes porque transforma "aprendizaje" en proceso operativo repetible.

## Componentes reutilizables

- `topics.json`: backlog tematico curado por area (IA, salud, negocios, desarrollo, etc.).
- `learning_log.json`: memoria historica de sesiones.
- `monday_skill.py`: motor con 3 modos:
  - Claude online
  - Ollama local (privacidad)
  - fallback offline

## Patrón recomendado para BOPE / agentes

### Job semanal de aprendizaje
- Trigger: lunes (manual o cron).
- Input: backlog de temas + ultimos aprendizajes.
- Output:
  - `micro_lesson`
  - `pregunta_reflexiva`
  - `nota_operativa`
  - `rating`
- Persistencia: JSON o tabla DB (`agent_learning_events`).

### Campos minimos sugeridos
- `date`
- `agent`
- `topic`
- `mode` (`new|review`)
- `engine` (`claude|ollama|offline`)
- `lesson`
- `note`
- `rating`
- `next_review_date`

## Uso sugerido en tu ecosistema

- Mantener el repo `monday-learning-skill` archivado.
- Reusar su lógica como modulo dentro de `BOPE-SANDBOX`.
- Cuando madure, promover a `BOPE_VERSION_DEFINITIVA` como rutina de mejora continua para agentes.

## Copy/Paste para instruccion de agentes

"Cada lunes, ejecutar un ciclo de aprendizaje: seleccionar tema nuevo o de repaso, generar micro-leccion contextualizada, registrar nota y rating, y producir una accion concreta aplicable a la operacion de la semana."
