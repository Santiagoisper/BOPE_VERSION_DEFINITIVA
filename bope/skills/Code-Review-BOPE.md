# Skill: Code Review BOPE

**Usar cuando:** hay que revisar un diff, PR, cambio propio antes de cierre o cambio ajeno con riesgo.

## Regla

La review prioriza bugs, regresiones, seguridad, datos y contratos. Estilo solo si afecta mantenibilidad real.

## Procedimiento

1. Leer objetivo del cambio.
2. Revisar diff completo y archivos vecinos si hace falta.
3. Buscar:
   - perdida/corrupcion de datos,
   - auth/permisos,
   - contratos rotos,
   - errores async/timeout,
   - estados UI faltantes,
   - tests insuficientes,
   - deuda introducida.
4. Ordenar hallazgos por severidad.
5. Referenciar archivo y linea cuando sea posible.
6. Si no hay hallazgos, decirlo y nombrar riesgo residual.

## Output minimo

```text
Findings:
- [Severidad] archivo:linea - problema, impacto, correccion.
Tests/riesgo:
- [lo corrido o faltante]
Resumen:
- [breve]
```

## Anti-patrones

- Review como resumen de cambios.
- Hallazgos vagos sin impacto.
- Pedir refactor cosmetico en mision urgente.
- Ignorar tests que faltan.

