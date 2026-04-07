# BOPE - Programa de Entrenamiento Intensivo 2026

## Estado

Este documento canoniza la estructura operativa del programa intensivo 2026 para uso dentro de `BOPE VISUAL CODE`.

La fuente ampliada del programa existe fuera del repo como documento de trabajo extenso. Aqui se integra la estructura valida para el batallon:

- sistema de scoring
- veredictos de Rambo
- ciclo de cierre
- plantilla universal de ejercicio
- distribucion de misiones por soldado

## Teatro de operaciones

- alta exigencia
- defensivo + constructivo

## Autoridades del programa

- autoridad suprema: `SANTIAGO ISBERT PERLENDER`
- mando operativo y cronometrista: `JOHN RAMBO`
- cronista oficial: `WINSTON SCRIBE`
- evaluacion doctrinal: `MARCO AURELIO HERALD`
- doctrina madre: `MISION DADA, MISION CUMPLIDA`

## Sistema de scoring BOPE

### Puntuacion por mision

Cada mision vale `100 puntos`, distribuidos en 8 ejes.

| Eje | Puntos |
|---|---:|
| Velocidad de lectura | 10 |
| Claridad de decision | 15 |
| Tiempo de produccion | 15 |
| Calidad del resultado | 20 |
| Economia de recursos | 10 |
| Estabilidad posterior | 15 |
| Disciplina de mando | 10 |
| Aprendizaje capturado | 5 |
| **Total por mision** | **100** |

### Totales posibles

| Tipo | Calculo | Maximo |
|---|---|---:|
| Misiones individuales | 40 x 100 pts | 4000 |
| Misiones de batallon | 40 x 100 pts | 4000 |
| **Gran total por soldado** |  | **8000** |

### Bonificaciones y penalizaciones

| Condicion | Ajuste |
|---|---|
| Baja en simulacion | 0 pts en esa mision |
| Error ya documentado en memoria tactica que se repite | -10 pts |
| Aprendizaje nuevo incorporado al skill | +5 pts bonus |
| Leccion compartida al batallon | +5 pts bonus |
| Baja evitable en mision conjunta por soldado responsable | -5 pts |
| Mision conjunta | puntaje promediado entre participantes activos, no entre todos |

## Veredictos de Rambo

| Veredicto | Condicion |
|---|---|
| `VICTORIA` | objetivo cumplido dentro del tiempo y con calidad |
| `VICTORIA COSTOSA` | objetivo cumplido pero con errores o bajas evitables |
| `EMPATE TACTICO` | objetivo parcialmente cumplido |
| `BAJA` | soldado eliminado, 0 pts |

## Ciclo de cierre de cada mision

1. `JOHN RAMBO` emite veredicto y puntua los 8 ejes.
2. El soldado documenta el aprendizaje nuevo incorporado a su skill.
3. El soldado define la leccion compartible al batallon.
4. `MARCO AURELIO` evalua si se gano con dignidad.
5. `WINSTON SCRIBE` actualiza tablero, score, dossier y memoria tactica.

## Plantilla universal de ejercicio

Cada mision presenta escenario y condiciones, pero no anticipa la solucion.

| Campo | Descripcion |
|---|---|
| ID | `BOPE-TRAIN-[SOLDADO]-[NRO]` |
| Tipo | defensiva / constructiva / correctiva / mixta |
| Soldado | nombre operativo |
| Skill principal | nucleo que se entrena |
| Skill secundario | skill reforzado como bonus |
| Escenario | contexto sin solucion escrita |
| Condiciones | recursos disponibles y restricciones activas |
| Objetivo | resultado esperado sin indicar como lograrlo |
| Tiempo de lectura | maximo 5 min |
| Tiempo de decision | maximo 10 min |
| Tiempo de produccion | indicado por mision |
| Criterio de exito | evidencia que prueba la victoria |
| Criterio de baja | condicion en que el soldado es eliminado |
| Handoffs posibles | que soldados puede activar Rambo |
| Aprendizaje post-mision | a completar al cierre |
| Leccion al batallon | a completar al cierre |
| Puntaje Rambo | 8 ejes x puntos |

## Distribucion intensiva de misiones

El programa fuente trabaja con baterias extensas por agente. En esta etapa se canoniza esta distribucion:

| Agente | Misiones individuales previstas | Misiones de batallon previstas |
|---|---:|---:|
| `JOHN RAMBO` | 40 | 40 |
| `FORGE BACK` | 40 | 40 |
| `PIXEL FRONT` | 40 | 40 |
| `HOUSE DOCTOR` | 40 | 40 |
| `CERBERUS GUARDIAN` | 40 | 40 |
| `NEXUS WIRE` | 40 | 40 |
| `WINSTON SCRIBE` | 40 | 40 |
| `MARCO AURELIO HERALD` | 40 | 40 |
| `BLADE KILLER` | 40 | 40 |
| `SICARIO LOCO` | 40 | 40 |
| `SANTIAGO ISBERT PERLENDER` | supervisa y puede ordenar ejercicios especiales |

## Regla de integracion

- este programa no reemplaza `docs/training/doctrina-entrenamiento-batallon.md`
- el score no reemplaza honores ni sanciones
- las medallas se siguen otorgando por accion real y evidencia, no por identidad fija
- la tabla de score puede incluir medallas precargadas como referencia visual, pero no crea exclusividad doctrinal

## Regla de migracion

La version extensa del programa queda como fuente de expansion futura.

Cuando se migren misiones completas al repo:
- se normalizan a UTF-8
- se conserva el ID original
- se respetan mando, cierre y after action del canon BOPE
