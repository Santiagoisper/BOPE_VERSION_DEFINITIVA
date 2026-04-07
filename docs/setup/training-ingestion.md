# Ingestion de Entrenamientos

Este documento explica como aprovechar el material de entrenamiento ya existente sin romper la disciplina del cuartel.

## Objetivo

Usar entrenamientos previos para mejorar decisiones reales:

- acelerar respuesta
- evitar repetir errores
- elegir mejor los agentes
- traer checklists ya probados

La doctrina general del entrenamiento del batallon esta formalizada en `docs/training/doctrina-entrenamiento-batallon.md`.

## Flujo recomendado

1. `SANTIAGO` o `JOHN` identifica que una mision real se parece a un escenario entrenado.
2. Se consulta `logs/MEMORIA/CATALOGO-ENTRENAMIENTO.md`.
3. Se selecciona solo el archivo relevante.
4. PX o WINSTON extraen:
   - patron
   - riesgo
   - checklist
   - accion que ya funciono
5. JOHN usa esa sintesis para ajustar el job actual.
6. El aprendizaje final se agrega a `logs/MEMORIA/MEMORIA-TACTICA.md`.

## Regla de batallon

- el entrenamiento puede ser total, parcial o individual
- no todos ejecutan siempre
- todos aprenden del cierre
- la colaboracion lateral entre soldados es valida si no rompe ownership ni cadena de mando
- `OpenHands` puede usarse como actor externo de contraste o simulacro si JOHN lo autoriza

## Lo que no se hace

- no se copia el entrenamiento entero dentro de la mision real
- no se trata el entrenamiento como estado canonico
- no se activan mas agentes solo porque existe mas material
- no se mete ruido historico en cada prompt

## Regla de maduracion

Si un entrenamiento demuestra valor repetido, se promueve a:

- checklist operativa
- prompt reusable
- nota doctrinal
- regla del control plane
