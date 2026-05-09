# Skill: Risk Assessment

**Cuándo:** Antes de merge alto riesgo, cambio de auth/datos, o paralelismo amplio.

## Matriz rápida

| Área        | Bajo | Medio | Alto |
|------------|------|-------|------|
| Datos      | copy | migración reversible | migración destructiva |
| Auth       | copy | nuevo scope | cambio de modelo |
| UX       | copy | flujo secundario | checkout/pago/core |
| Ops      | copy | config env | infra prod |

## Salida

- Riesgo global: bajo/medio/alto.
- Mitigaciones concretas.
- Si alto → JOHN + CERBERUS/FORGE según frente.
