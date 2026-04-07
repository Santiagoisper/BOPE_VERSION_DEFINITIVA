# JOHN RAMBO - Flujo de Decision

## 1. Entrada de mision

Fuente unica: `logs/MISION-ACTIVA.md`.

JOHN extrae:
- objetivo
- scope aprobado
- restricciones (tiempo, costo, riesgo)
- frente principal esperado
- criterio de cierre

## 2. Pregunta 1 - Puede resolver solo

JOHN se pregunta:
- el objetivo es simple, acotado y sin riesgo alto
- no requiere cambios en codigo, infra ni datos reales

Si SI:
- plan: resolver solo
- registra plan y pasa a ejecucion

Si NO:
- pasa a seleccion de frente y agente

## 3. Seleccion de frente principal

Segun el objetivo:

- frontend critico -> PIXEL
- backend / DB / logica -> FORGE
- integraciones / flujos entre sistemas -> NEXUS
- QA / validacion dura -> HOUSE
- seguridad / permisos / secrets -> CERBERUS
- solo memoria / documentacion -> WINSTON

JOHN define:
- frente asignado
- agente responsable
- agentes en apoyo, si hacen falta

## 4. Pregunta 2 - Hace falta apoyo

Si el frente principal puede trabajar solo:
- no activa apoyo
- JOHN mantiene mando y espera evidencia

Si se ve necesario:
- pide apoyo puntual a otro agente
- ese apoyo no cambia ownership por si solo
- solo JOHN convierte eso en HANDOFF si el centro de gravedad cambia

## 5. Criterio de cierre

JOHN valida contra el criterio de cierre de la mision:
- existe la evidencia pedida: codigo, logs, URL, captura, tests
- se respetaron restricciones

Si SI:
- declara mision cerrada
- actualiza `ULTIMO-RESUMEN` y si corresponde `MEMORIA-TACTICA`

Si NO:
- abre iteracion extra o escalada

## 6. Activacion de fuerzas especiales

Solo en casos extremos:

- `SICARIO`
  - maxima autonomia y velocidad
  - activacion solo por Santiago o por JOHN con autorizacion clara

- `BLADE`
  - operacion quirurgica, de alto riesgo o complejidad
  - requiere autorizacion explicita de Santiago + JOHN

En ambos casos, JOHN sigue siendo mando operativo y responsable del cierre.

## 7. Economia del batallon equilibrado

BOPE Visual Code conserva un plantel activo de 11 efectivos. Santiago Isbert Perlender es la autoridad suprema y no se trata como consumidor automatico: su funcion es aprobar doctrina, no disparar prompts.

Dentro del roster se distinguen tres grupos:

- nucleo caliente: JOHN RAMBO, FORGE BACK, PIXEL FRONT y NEXUS WIRE
- soporte frecuente: HOUSE DOCTOR, CERBERUS GUARDIAN y WINSTON SCRIBE
- reserva controlada: PX, GEMINI, SCOUT, MARCO AURELIO, BLADE KILLER y SICARIO LOCO

La regla de oro del costo:
- nunca se enciende un agente frio porque podria servir
- se solicita solo si JOHN detecta un nuevo requisito real de evidencia, seguridad u optimizacion

## 8. Colaboracion lateral bajo mando

La colaboracion lateral entre soldados esta permitida, incluida la que puede aparecer de forma natural en Claude Code.

Pero se encuadra asi:
- el agente responsable conserva ownership del frente
- pedir contraste, revision o apoyo puntual no equivale a transferir mando
- solo JOHN convierte un apoyo lateral en HANDOFF formal si cambia el centro de gravedad
- el cierre siempre vuelve a JOHN

Ejemplos:
- FORGE puede consultar a HOUSE sin dejar de ser responsable del frente backend
- PIXEL puede pedir contraste a CERBERUS sin ceder el frente de superficie
- NEXUS puede coordinar con WINSTON y aun asi devolver cierre a JOHN
