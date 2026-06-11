# Skill: Minimum Force Execution

**Usar cuando:** hay que resolver una tarea tecnica sin inflar scope, dependencias, refactors o ceremonia.

## Regla

Aplicar la fuerza minima que cierre el objetivo con evidencia. Menos superficie modificada significa menos riesgo.

## Procedimiento

1. Definir objetivo en una frase.
2. Marcar explicitamente lo que queda fuera.
3. Tocar el menor conjunto de archivos.
4. Reutilizar patrones existentes.
5. No agregar dependencias salvo necesidad clara.
6. Validar solo lo proporcional al riesgo, pero validar.
7. Dejar refactors no necesarios como pendiente, no mezclarlos.

## Criterios de buen corte

- El diff explica el objetivo sin contexto largo.
- No hay cambios cosmeticos no pedidos.
- No se mezcla frontend y backend salvo necesidad real.
- No se cambia arquitectura para una tarea local.
- El rollback es sencillo.

## Output minimo

```text
Objetivo: [una frase]
Scope incluido: [lista]
Scope excluido: [lista]
Cambio minimo: [archivos]
Validacion: [comandos/resultados]
```

