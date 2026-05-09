# Skill: Minimum-Force Execution

**Cuándo:** Toda ejecución táctica (código, config, tooling).

## Principios

- Menor cambio que resuelve el problema medible.
- Un PR enfocado mejor que un “cleanup” mezclado.
- Feature flags o toggles antes de big-bang cuando el riesgo es alto.

## Checklist

- ¿Se puede mitigar en 10 líneas primero?
- ¿Hay path de rollback?
- ¿Quién valida (HOUSE / CERBERUS) según tipo de cambio?
