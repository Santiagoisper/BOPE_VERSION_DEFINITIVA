# CATALOGO DE SIMULACROS BOPE

Biblioteca reusable de escenarios de guerra defensiva para `SIMULACRO` y `ENTRENAMIENTO`.

## Regla de uso

- esta biblioteca existe para entrenamiento defensivo autorizado
- no contiene instrucciones ofensivas reutilizables
- cada escenario debe ejecutarse con cadena de mando visible, evaluacion de desempeno y lecciones aprendidas
- la seleccion puede ser aleatoria o dirigida por `SANTIAGO`

## Escala de severidad

- `DIFICIL`
- `MUY DIFICIL`
- `EXTREMADAMENTE DIFICIL`
- `CATASTROFICO`

## Metodo de seleccion aleatoria

1. elegir entre 1 y 30
2. tomar el escenario correspondiente
3. adaptar solo sistema objetivo, superficies criticas y activos sensibles
4. no alterar el nucleo del escenario sin dejarlo escrito

## Escenarios

### 01. Autenticacion Bajo Asedio

- severidad: `DIFICIL`
- vector principal: abuso de login, enumeracion y lockout insuficiente
- objetivo defensivo: detectar, contener y endurecer autenticacion sin romper acceso legitimo
- senales tempranas: picos de intentos fallidos, patrones repetitivos, variacion de IP o fingerprint
- criterios de exito: bloqueo selectivo, trazabilidad y experiencia legitima preservada

### 02. Registro Publico Saturado

- severidad: `DIFICIL`
- vector principal: spam de altas, duplicacion y presion sobre formularios publicos
- objetivo defensivo: frenar abuso masivo sin degradar onboarding legitimo
- senales tempranas: altas repetidas, emails desechables, bursts por IP, payloads repetidos
- criterios de exito: contencion, registro de eventos y duplicados bajo control

### 03. Token de Un Solo Uso Reutilizado

- severidad: `DIFICIL`
- vector principal: reuso de tokens temporales, carreras y sesiones ambiguas
- objetivo defensivo: invalidar reuso y reforzar semantica de single-use
- senales tempranas: dobles consumos, sesiones simultaneas, reapertura de flujos cerrados
- criterios de exito: unicidad garantizada y auditoria completa del consumo

### 04. Escalada Silenciosa de Permisos

- severidad: `MUY DIFICIL`
- vector principal: abuso de endpoints admin, permisos heredados y bypass de role checks
- objetivo defensivo: sellar superficie administrativa y probar que el actor real viene de la sesion
- senales tempranas: acciones privilegiadas desde actores no esperados, discrepancia entre UI y backend
- criterios de exito: permisos consistentes en todas las capas y trazabilidad del actor real

### 05. Manipulacion de Scoring

- severidad: `MUY DIFICIL`
- vector principal: intento de alterar pesos, respuestas o score final desde cliente
- objetivo defensivo: recalculo server-side y validacion matematica del modelo
- senales tempranas: score imposible, category scores inconsistentes, payloads manipulados
- criterios de exito: score recalculado en servidor y divergencias detectadas

### 06. Corrupcion de Reporte Final

- severidad: `MUY DIFICIL`
- vector principal: desalineacion entre score, status y narrativa del informe
- objetivo defensivo: asegurar coherencia entre evaluacion, dominios y devolucion final
- senales tempranas: aprobados con dominios criticos, narrativa generica o contradictoria
- criterios de exito: informe consistente, trazable y alineado con respuestas reales

### 07. Parser de Adjuntos Saturado

- severidad: `MUY DIFICIL`
- vector principal: adjuntos grandes, invalidos o mal codificados que buscan romper ingestion
- objetivo defensivo: limitar tamanos, validar tipo y evitar perdida de datos preexistentes
- senales tempranas: errores de payload, timeouts, reemplazos truncos, transacciones a medias
- criterios de exito: rechazo seguro, persistencia integra y sin borrado accidental

### 08. Session Fixation de Sitio

- severidad: `MUY DIFICIL`
- vector principal: confusion de sesiones, cookies legadas o estado residual
- objetivo defensivo: renovar sesion, validar actor y cortar fijaciones
- senales tempranas: actor ambiguo, reapertura inesperada de flujo, permisos heredados
- criterios de exito: sesion fresca, actor univoco y superficies legadas aisladas

### 09. Configuracion Sensible Expuesta

- severidad: `MUY DIFICIL`
- vector principal: acceso indebido a settings, deploy o integraciones sensibles
- objetivo defensivo: ocultar UI, reforzar backend y apagar capacidades por defecto
- senales tempranas: settings visibles a mas roles de los debidos, endpoints sensibles sin flag
- criterios de exito: capacidad restringida, apagada por defecto y auditada

### 10. Enumeracion de Entidades Internas

- severidad: `DIFICIL`
- vector principal: diferencias de error que revelan emails, sites, usuarios o estados
- objetivo defensivo: opacar respuestas sin perder soporte operativo
- senales tempranas: 404/409 demasiado descriptivos, mensajes unicos por entidad
- criterios de exito: errores genericos, telemetria interna conservada

### 11. Stress Sobre Rate Limiting

- severidad: `MUY DIFICIL`
- vector principal: requests invalidos o variantes que buscan esquivar cuotas
- objetivo defensivo: cobrar costo de abuso tambien a payloads rotos o incompletos
- senales tempranas: olas de 400 antes de la cuota, bursts que no quedan registrados
- criterios de exito: guardrails contabilizan abuso valido e invalido

### 12. Envenenamiento de Estado Legacy

- severidad: `MUY DIFICIL`
- vector principal: valores viejos o corruptos que se normalizan en silencio
- objetivo defensivo: exponer corrupcion sin maquillar datos invalidos
- senales tempranas: estados desconocidos que reaparecen como pendientes, coerciones silenciosas
- criterios de exito: deteccion explicita y rechazo o migracion controlada

### 13. Carrera de Doble Submit

- severidad: `DIFICIL`
- vector principal: doble envio de formularios, clicks repetidos o peticiones paralelas
- objetivo defensivo: idempotencia y cierre de carrera
- senales tempranas: evaluaciones duplicadas, reportes dobles, cambios de estado inconsistentes
- criterios de exito: unica mutacion valida y repetidos sin efecto

### 14. Cadena de Dependencias Quebrada

- severidad: `MUY DIFICIL`
- vector principal: build, parser, libreria o toolchain comprometida por fallo externo o version defectuosa
- objetivo defensivo: detectar, aislar y degradar con seguridad
- senales tempranas: builds divergentes, checks inestables, cambios inesperados en salida
- criterios de exito: dependencia aislada, build estable y camino de rollback claro

### 15. Falla de Secreto en Entorno

- severidad: `EXTREMADAMENTE DIFICIL`
- vector principal: secretos ausentes, rotados, mezclados o expuestos indirectamente
- objetivo defensivo: verificar entorno correcto sin revelar secretos y restaurar continuidad
- senales tempranas: accesos a DB inconsistentes, diferencias entre local y produccion
- criterios de exito: secreto correcto, entorno confirmado y evidencia sin exposicion

### 16. Inconsistencia Front/Back de Validacion

- severidad: `DIFICIL`
- vector principal: cliente y servidor aceptan cosas distintas
- objetivo defensivo: que el backend sea autoridad sin romper experiencia
- senales tempranas: UI rechaza algo que server acepta o viceversa
- criterios de exito: validacion alineada y mensajes consistentes

### 17. Pipeline de Reportes Firmados Roto

- severidad: `MUY DIFICIL`
- vector principal: generacion, firma, render o persistencia del reporte final falla en punto critico
- objetivo defensivo: mantener integridad del informe y evidencia del fallo
- senales tempranas: PDFs incompletos, firmas ausentes, reportes no bloqueados
- criterios de exito: firma coherente, bloqueo correcto y recuperacion documentada

### 18. Bypass de Terminos o Consentimiento

- severidad: `DIFICIL`
- vector principal: cliente fuerza submit sin aceptar terminos
- objetivo defensivo: exigir consentimiento en servidor y registrar evidencia
- senales tempranas: evaluaciones cerradas sin bandera de aceptacion, rutas no esperadas
- criterios de exito: backend rechaza sin terminos y evento queda auditado

### 19. Inundacion de Logs y Observabilidad

- severidad: `MUY DIFICIL`
- vector principal: volumen que ahoga logs utiles o encubre señales reales
- objetivo defensivo: conservar señal, priorizar y no perder trazabilidad
- senales tempranas: spam de eventos irrelevantes, rotacion agresiva, alerts inutiles
- criterios de exito: logs utiles sobreviven y lo critico escala

### 20. Ransomware Simulado de Datos Operativos

- severidad: `CATASTROFICO`
- vector principal: indisponibilidad o cifrado simulado de datos clave
- objetivo defensivo: continuidad, aislamiento y recuperacion
- senales tempranas: corrupcion masiva, acceso denegado, checksums anormales
- criterios de exito: contencion del radio, restauracion priorizada y cadena de mando intacta

### 21. Exfiltracion Simulada de Informes

- severidad: `EXTREMADAMENTE DIFICIL`
- vector principal: acceso indebido a reportes, PDFs o evaluaciones sensibles
- objetivo defensivo: cortar salida, rastrear actor y medir alcance
- senales tempranas: descargas anormales, consultas fuera de patron, rutas de export abusadas
- criterios de exito: fuga contenida, alcance acotado y plan de notificacion listo

### 22. Toma de Cuenta Administrativa

- severidad: `CATASTROFICO`
- vector principal: uso indebido de cuenta admin por secreto debil o flujo de reset mal blindado
- objetivo defensivo: revocar, resetear, revalidar y auditar
- senales tempranas: cambios administrativos no explicados, accesos desde contexto anomalo
- criterios de exito: cuenta recuperada, superficie endurecida y postmortem completo

### 23. Borrado Logico Encubierto

- severidad: `EXTREMADAMENTE DIFICIL`
- vector principal: cambios aparentemente legitimos que eliminan o degradan informacion valiosa
- objetivo defensivo: detectar destruccion sutil y restaurar trazabilidad
- senales tempranas: registros ausentes, adjuntos huerfanos, estado cambiado sin actor claro
- criterios de exito: reconstruccion del timeline y bloqueo del patron

### 24. Sabotaje de Integridad de Base

- severidad: `CATASTROFICO`
- vector principal: relaciones cruzadas, migraciones defectuosas o escrituras conflictivas en DB
- objetivo defensivo: preservar integridad referencial y servicio critico
- senales tempranas: constraints rotas, joins vacios, lecturas imposibles
- criterios de exito: integridad restaurada, migracion segura y humo end-to-end en verde

### 25. Cadena de Supply-Chain de Frontend

- severidad: `EXTREMADAMENTE DIFICIL`
- vector principal: paquete UI comprometido, build alterado o bundle con comportamiento anomalo
- objetivo defensivo: aislar componente, verificar salida y contener exposicion
- senales tempranas: diferencias entre builds, assets inesperados, warnings nuevos
- criterios de exito: bundle limpio, componente reemplazado o bloqueado

### 26. Ataque Combinado de Reputacion y Spam

- severidad: `DIFICIL`
- vector principal: abuso visible del producto que degrada confianza del cliente sin tumbar la app
- objetivo defensivo: limpiar superficie, proteger marca y sostener servicio
- senales tempranas: formularios contaminados, datos basura, cola de revision saturada
- criterios de exito: interfaz limpia, abuso filtrado y respuesta al cliente preparada

### 27. Insider Hostil Simulado

- severidad: `EXTREMADAMENTE DIFICIL`
- vector principal: actor con acceso legitimo que opera fuera de rol o con intencion hostil
- objetivo defensivo: minimo privilegio, trazabilidad y corte de confianza
- senales tempranas: cambios fuera de horario, acciones fuera de mision, descargas impropias
- criterios de exito: privilegios revocados, evidencia preservada y blast radius acotado

### 28. Doctrina y Registro Bajo Sabotaje

- severidad: `MUY DIFICIL`
- vector principal: desorden intencional en logs, indices o historia operativa
- objetivo defensivo: preservar memoria de combate y fuente canonica
- senales tempranas: misiones sin indice, cierres sin push, versiones contradictorias
- criterios de exito: historia saneada, fuentes canonicas restauradas y responsabilidad clara

### 29. Campana Multiobjetivo Coordinada

- severidad: `CATASTROFICO`
- vector principal: varios intrusos atacan autenticacion, scoring, reportes y admin al mismo tiempo
- objetivo defensivo: priorizar, contener por capas y conservar mando bajo presion maxima
- senales tempranas: alertas simultaneas en varias superficies, colisiones de ownership, saturacion de equipo
- criterios de exito: cadena de mando visible, frentes estabilizados y ningun cierre falso

### 30. Escenario Terror de Continuidad Total

- severidad: `CATASTROFICO`
- vector principal: combinacion de indisponibilidad, posible exfiltracion, cuenta comprometida, datos corruptos y perdida parcial de observabilidad
- objetivo defensivo: sostener operacion minima, salvar activos criticos y reconstruir control
- senales tempranas: alarmas en cascada, telemetria incompleta, dudas sobre integridad general
- criterios de exito: continuidad minima restablecida, mando firme, activos criticos protegidos, plan de recuperacion completo y memoria tactica extraordinaria

## Reglas de cierre por escenario

Todo escenario ejecutado debe dejar:

- intrusos o vectores usados
- despliegue del batallon
- comunicaciones visibles
- neutralizaciones por combatiente
- MVP
- efectivos por debajo del estandar
- propuesta de medallas si aplica
- memoria tactica
- lecciones aprendidas
- persistencia en logs, mision formal, git y GitHub
