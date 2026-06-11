# Skill: Evidence-First Closure

**Usar cuando:** alguien quiera declarar una tarea, mision, PR, incidente o frente como cerrado.

## Regla

No existe cierre sin evidencia verificable. La narrativa acompana; no reemplaza logs, tests, diffs, URL, metricas o registros.

## Procedimiento

1. Listar las afirmaciones de cierre:
   - funciona,
   - no rompe,
   - esta seguro,
   - quedo registrado,
   - quedo desplegado.
2. Asociar una evidencia a cada afirmacion.
3. Si falta evidencia, elegir una:
   - correr validacion,
   - declarar riesgo residual,
   - dejar estado parcial,
   - pedir aceptacion explicita de JOHN/SANTIAGO.
4. Registrar resultado en el canal correspondiente.

## Evidencias validas

- Test/unit/e2e con resultado.
- Typecheck/build/lint.
- Diff revisado.
- Smoke manual con pasos.
- URL o screenshot de preview.
- Log de healthcheck/API.
- Commit/PR/deploy.
- Registro WINSTON si el cierre es institucional.

## Output minimo

```text
Cierre: [cerrado|parcial|bloqueado]
Afirmacion: [lo que se declara]
Evidencia: [artefacto verificable]
Riesgo residual: [concreto o ninguno]
```

## Anti-patrones

- "Deberia andar".
- "No vi errores" sin comando.
- Cerrar porque el diff parece chico.
- Ocultar que una validacion no se pudo correr.

