# Doctrina de Entrenamiento del Batallon

Este documento regula como entrena BOPE y como el aprendizaje se distribuye entre todos los efectivos sin romper la cadena de mando.

## Principio

BOPE no entrena solo a JOHN. Entrena al batallon completo.

- `JOHN RAMBO` decide la composicion del frente.
- los agentes activados ejecutan
- los no activados observan por memoria, resumen, after action y doctrina
- todos aprenden

## Tipos de entrenamiento

### 1. Entrenamiento total

JOHN ordena que entre el batallon completo o una fraccion muy amplia porque el escenario exige:

- coordinacion simultanea
- crisis mayor
- multiples frentes
- saturacion de decisiones
- simulacion de guerra real

Efecto:
- todos participan
- todos dejan evidencia
- el after action es obligatorio

### 2. Entrenamiento parcial

JOHN activa solo a los agentes necesarios para un frente concreto.

Ejemplos:
- `FORGE + NEXUS`
- `PIXEL + HOUSE`
- `CERBERUS + WINSTON`

Efecto:
- no todos ejecutan
- pero todos pueden aprender del cierre y de la memoria tactica

### 3. Entrenamiento individual

JOHN o `SANTIAGO` ordenan forjar una capacidad puntual de un solo efectivo.

Ejemplos:
- precision de `FORGE` en backend
- criterio de `HOUSE` en QA
- disciplina de `WINSTON` en registro

Efecto:
- la ejecucion es individual
- el aprendizaje doctrinal se incorpora al batallon si demuestra valor repetido

## Colaboracion lateral

La colaboracion lateral entre soldados esta permitida y es deseable cuando mejora la mision o el entrenamiento.

Pero tiene reglas:

- no reemplaza a la cadena de mando
- no crea autoridad lateral
- no habilita a un agente a abrir un frente por su cuenta
- no convierte automaticamente una consulta entre soldados en `HANDOFF`

Regla operativa:

- un agente puede pedir aporte, contraste, revision o apoyo lateral a otro
- ese aporte es valido mientras el ownership siga claro
- solo `JOHN` puede transformar ese intercambio en cambio formal de frente o de responsable

## Claude Code y operacion lateral

Si una sesion en Claude Code permite que varios soldados aporten entre si, eso se considera compatible con BOPE siempre que:

- `JOHN` siga siendo el mando operativo
- quede claro quien tiene ownership principal
- la colaboracion lateral se registre como apoyo, contraste o revision
- el cierre final vuelva a `JOHN`

En otras palabras:

- si `FORGE` consulta a `HOUSE`, sigue siendo frente de `FORGE`
- si `PIXEL` pide contraste a `CERBERUS`, sigue siendo frente de `PIXEL`
- si `NEXUS` coordina con `WINSTON`, el cierre igual vuelve a `JOHN`

La ventaja de Claude Code no se pierde. Solo se encuadra.

## OpenHands en entrenamiento

`OpenHands` se considera una herramienta externa de entrenamiento, contraste y ejecucion guiada.

Puede entrar cuando:

- `JOHN` quiere poner a prueba un ejercicio con un actor externo al batallon
- `NEXUS` necesita validar integracion o flujo contra una herramienta distinta
- `SANTIAGO` ordena simulacro comparativo entre BOPE y otra plataforma
- el batallon quiere medir reaccion, disciplina o calidad de cierre frente a una herramienta hospedada

No cambia estas reglas:

- `OpenHands` no entra como autoridad
- `OpenHands` no reemplaza a `JOHN`
- `OpenHands` no define el cierre doctrinal
- `OpenHands` no convierte una mision de entrenamiento en canon operativo por si solo

Uso recomendado:

- simulacros
- ejercicios de crisis
- contraste de soluciones
- pruebas de velocidad
- validacion de prompts, skills o runbooks

Evidencia minima:

- que tarea se le dio
- que devolvio
- que hizo mejor que BOPE
- que hizo peor que BOPE
- que aprende el batallon de esa comparacion

## Aprendizaje por error

En BOPE los errores no se ocultan. Se explotan doctrinalmente.

Todo entrenamiento debe dejar, si corresponde:

- error observado
- causa probable
- decision que fallo
- correccion propuesta
- regla nueva o ajuste doctrinal

## After Action obligatorio

Todo entrenamiento relevante debe cerrar con:

- que salio bien
- que salio mal
- que se aprendio
- que cambia para la proxima
- que documento o skill debe ajustarse

## Destino del aprendizaje

El aprendizaje de entrenamiento puede terminar en:

- `logs/MEMORIA/MEMORIA-TACTICA.md`
- `logs/MEMORIA/ULTIMO-RESUMEN.md`
- `docs/setup/training-ingestion.md`
- prompts reutilizables
- skills
- notas doctrinales

## Regla final

- no todos tienen que ejecutar siempre
- todos si tienen que poder aprender siempre
- la colaboracion lateral fortalece al batallon
- la autoridad sigue entrando por `SANTIAGO` y bajando por `JOHN`

## Programa intensivo 2026

El entrenamiento intensivo del batallon para 2026 queda estructurado en:

- `docs/training/programa-intensivo-2026.md`
- `docs/training/tabla-general-score.md`

Ese programa define scoring, veredictos, cierre y tablero general del batallon.
