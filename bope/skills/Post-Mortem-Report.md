# Skill: Post-Mortem Report

**Usar cuando:** hubo incidente, fallo, regresion, sancion, gasto inesperado o aprendizaje fuerte.

## Regla

El post-mortem no busca culpables primero; busca verdad operacional, reparacion y prevencion. Si hubo negligencia, MARCO evalua sancion aparte.

## Procedimiento

1. Registrar timeline con horas o secuencia.
2. Separar causa inmediata, causa raiz y factores contribuyentes.
3. Medir impacto: usuario, datos, costo, tiempo, reputacion.
4. Documentar mitigacion aplicada.
5. Definir prevencion concreta.
6. Asignar follow-ups con responsable.
7. WINSTON registra; MARCO evalua si hay honor/sancion.

## Template

```text
Post-mortem: [id/titulo]
Impacto: [concreto]
Timeline:
- [evento]
Causa inmediata: [hecho]
Causa raiz: [hecho]
Mitigacion: [accion]
Prevencion: [accion verificable]
Follow-ups: [responsable -> tarea]
Honores/sanciones: [si aplica]
```

## Anti-patrones

- "Fue un error humano" como causa raiz.
- Post-mortem sin accion preventiva.
- Ocultar incertidumbre.
- Mezclar ceremonia con hechos no probados.

