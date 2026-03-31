# LIVE-FIRE - MEMORIA TACTICA

Registro permanente de campanas de entrenamiento ejecutadas sobre programas reales.

## Regla

- todo live-fire debe quedar asentado aqui y en su mision formal asociada
- si el live-fire no queda en nuestros logs, no existe como memoria tactica del batallon
- el objetivo es releer antes de futuras misiones y acelerar reaccion, criterio y coordinacion

## Campana: innova-scoring

### Frente real

- programa: `innova-scoring`
- host vivo confirmado: `https://innova-scoring.vercel.app`

### Campanas ejecutadas

#### Fase 1 - live-fire inicial

- payload invalido en registro publico: bloqueado con `400`
- alta temporal real: aceptada
- duplicado del mismo registro: bloqueado
- login admin real: aceptado
- generacion de token real: aceptada
- primer login site con token: aceptado
- segundo login con el mismo token: bloqueado con `401`
- submit sin terminos: bloqueado con `400`
- aceptacion de terminos: aceptada
- submit de evaluacion: aceptado
- reporte auto-generado: visible
- acknowledge con hash falso: bloqueado con `400`
- acknowledge con hash correcto: aceptado y bloqueo del reporte confirmado

#### Fase 2 - presion concurrente

- dos escenarios simultaneos ejecutados sobre la app viva
- segundo login con el mismo token: bloqueado en ambos
- submit sin terminos: bloqueado en ambos
- evaluacion completa posterior: aceptada en ambos
- reporte auto-generado: visible en ambos
- hash falso: bloqueado en ambos
- segundo `acknowledge`: bloqueado en ambos
- conclusion: la coherencia end-to-end se sostuvo bajo doble presion real

#### Fase 3 - asalto profundo

- `duplicateProbe`: alta valida `200`, segundo intento `429`
- superficie sensible `/api/system/deploy`: `403` con permiso `readwrite`
- dos escenarios simultaneos completos sobre la app viva
- segundo login con el mismo token: bloqueado en ambos
- submit sin terminos: bloqueado en ambos
- adjunto invalido u hostil: bloqueado en ambos
- adjunto valido: aceptado y descargable en ambos
- evaluacion posterior: aceptada en ambos
- hash falso: bloqueado en ambos
- segundo `acknowledge`: bloqueado en ambos

### Defensas confirmadas

- token de site de un solo uso
- terminos obligatorios antes de submit
- integridad del reporte via hash
- bloqueo de segundo acknowledge
- rechazo de adjuntos invalidos
- descarga autenticada de adjuntos validos
- endurecimiento de permisos sensibles
- rate limit en registro publico

### Riesgos y observaciones

- el cuerpo resistio bien las fases ejecutadas
- el foco mas fino sigue siendo coherencia total bajo presion extrema y combinada
- una sonda de honeypot quedo invalida por payload de prueba, no por derrota del cuerpo
- la siguiente evolucion del entrenamiento debe aumentar distribucion y concurrencia, no solo profundidad local

### Aprendizajes reutilizables

- usar siempre el host vivo confirmado antes del asalto
- medir tanto bloqueo como recuperacion limpia del flujo legitimo
- sostener cleanup total de artefactos temporales al final
- separar fallas de herramienta de verdaderos hallazgos del cuerpo
- registrar por fase que tumor fue detectado, que defensa respondio y que organo quedo preservado

### Resultado doctrinal

La campana `innova-scoring` queda incorporada como referencia permanente de live-fire en nuestros logs.
