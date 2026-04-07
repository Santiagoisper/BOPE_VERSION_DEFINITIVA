# TRN - MISION DE ENTRENAMIENTO

## Codigo
TRN-RAMBO-ATAQUE-APLICACION-CLIENTE-001

## Tipo
Entrenamiento para aprendizaje tactico y respuesta defensiva ante incidente realista de alto impacto.

## Comandante
John Rambo

## Regla doctrinal
Toda mision de entrenamiento inicia con siglas TRN.
Todo entrenamiento queda guardado como aprendizaje operativo.
Rambo ejerce mando directo y emite ordenes explicitas.
El foco es defender, contener, recuperar y aprender.

## Situacion
Un programa nuestro desplegado para un cliente empieza a comportarse de forma anomala un lunes a las 09:12. Al principio parece una degradacion normal: aumento de latencia, errores intermitentes y picos de CPU. A las 09:19 aparecen transacciones no esperadas, cambios de configuracion en segundo plano y accesos desde ubicaciones inusuales sobre cuentas con privilegios altos.

A las 09:27 el cliente reporta que algunos usuarios ven datos que no deberian ver. A las 09:31 se detecta que el sistema de logs fue parcialmente alterado y que parte del trafico saliente apunta a destinos no habituales. La hipotesis es grave: un grupo de atacantes de nivel mundial obtuvo acceso valido o semivalido, se movio con sigilo y ahora busca tres cosas al mismo tiempo:

1. Persistencia silenciosa.
2. Extraccion de informacion sensible.
3. Capacidad de sabotear la operacion para cubrir la retirada.

## Evaluacion inicial de Rambo
Rambo asume desde el primer minuto que no enfrenta un fallo tecnico comun.
No trata el evento como bug de aplicacion hasta descartar intrusion.
Tampoco permite que el equipo toque todo a la vez y destruya evidencia.

Riesgos principales:
1. Seguir operando y ampliar el daño.
2. Cortar de forma desordenada y romper al cliente sin plan.
3. Perder trazabilidad forense por intervenciones apuradas.

## Ordenes de John Rambo
### Orden 1
"Congelen cambios no esenciales. Desde ahora nadie despliega, nadie parchea y nadie reinicia sin autorizacion de mando."

### Orden 2
"Celula tecnica, separen contencion de diagnostico. Quiero reducir daño sin borrar rastros."

### Orden 3
"Seguridad interna, revisen credenciales, accesos privilegiados, integraciones externas y actividad administrativa de las ultimas 48 horas."

### Orden 4
"Reaccion rapida, preparen aislamiento parcial del servicio, failover controlado y proteccion de datos criticos. Si tenemos que degradar, degradamos con plan."

### Orden 5
"Sicario queda retenido. Solo entra si detectamos un punto unico de compromiso que podamos neutralizar de forma quirurgica sin tumbar al cliente."

### Orden 6
"Todo reporte va a mando central cada quince minutos o ante cambio critico. Quiero hechos, impacto y siguiente accion."

### Orden 7
"Comunicacion con el cliente: una sola voz. Nada de mensajes contradictorios ni especulacion tecnica."

## Distribucion de fuerzas
### Mando central
- Rambo centraliza decisiones.
- Prioriza continuidad del cliente contra contencion del incidente.
- Autoriza aislamiento, rotacion de secretos y cambios de arquitectura temporales.

### Celula tecnica
- Toma snapshots y evidencia util.
- Identifica servicios afectados y rutas de exfiltracion.
- Limita trafico saliente no esencial.
- Aisla componentes comprometidos sin apagar toda la plataforma si no hace falta.

### Seguridad interna
- Revoca sesiones activas sospechosas.
- Fuerza rotacion de credenciales privilegiadas.
- Audita cuentas de servicio, tokens, claves API y accesos de terceros.
- Busca abuso de permisos legitimos.

### Reaccion rapida
- Prepara modo degradado seguro para el cliente.
- Habilita protecciones adicionales en borde, red y acceso administrativo.
- Garantiza capacidad minima operativa mientras avanza la contencion.

### Sicario
- Solo actua sobre blanco tecnico confirmado.
- Su empleo es puntual: aislar un host, desactivar una integracion o bloquear un canal especifico.
- No se usa como respuesta general ni impulsiva.

## Desarrollo de la simulacion
### Fase 1 - Deteccion
El monitoreo muestra sintomas dispersos y engañosos. Una parte del equipo cree que es problema de rendimiento. Otra parte ve patron de intrusión. Rambo corta la discusión con criterio operativo: se asume incidente de seguridad hasta demostrar lo contrario.

Decision:
1. Declarar incidente mayor.
2. Congelar despliegues.
3. Preservar evidencia.
4. Activar canal unico de crisis.

### Fase 2 - Contencion inicial
Se descubren tokens de acceso usados fuera del patron horario normal y desde infraestructura no habitual. Tambien hay consultas intensivas sobre conjuntos de datos sensibles. La prioridad pasa a ser impedir mas daño sin tumbar por completo el servicio del cliente.

Decision:
1. Revocar accesos privilegiados sospechosos.
2. Reducir permisos temporales.
3. Bloquear trafico saliente no conocido.
4. Separar componentes expuestos del resto del sistema.

### Fase 3 - Confirmacion del vector
La investigacion muestra que el punto mas probable fue una combinacion de credencial expuesta y permisos excesivos en una integracion operativa. No hay evidencia firme de exploit masivo del codigo principal; el daño vino de confianza mal distribuida y monitoreo insuficiente sobre acciones privilegiadas.

Rambo ordena:
"No persigan fantasmas. Si el vector confirmado hoy es credencial mas privilegio, cerramos eso primero antes de imaginar veinte puertas mas."

### Fase 4 - Estabilizacion
El servicio pasa a modo degradado seguro. Algunas funciones no criticas se suspenden. El cliente conserva operacion basica. Se rotan secretos, se restringen integraciones, se refuerzan controles de acceso y se habilita vigilancia intensiva sobre datos sensibles.

Resultado esperado:
- Baja la capacidad de movimiento del atacante.
- Se frena la exfiltracion.
- Se conserva servicio minimo.

### Fase 5 - Recuperacion
Con la intrusión contenida, el equipo recompone arquitectura de confianza:

1. Nuevos secretos y credenciales.
2. Revision de permisos por minimo privilegio.
3. Separacion mas estricta entre ambientes y funciones administrativas.
4. Alertas especificas para abuso de cuentas privilegiadas.
5. Revalidacion de integridad en servicios y pipelines.

### Fase 6 - Aprendizaje
Rambo cierra la simulacion con una conclusion dura:
"No perdimos por falta de fuerza. Casi perdemos por exceso de confianza, permisos anchos y lectura tardia del patron enemigo."

## Decision de empleo
Rambo no manda a todos juntos sobre el mismo problema.
Rambo separa funciones:
1. Un equipo contiene.
2. Un equipo investiga.
3. Un equipo protege continuidad del cliente.
4. Mando central evita decisiones caoticas.

El sicario no entra primero porque una accion quirurgica prematura puede destruir evidencia o dejar ciego al equipo. Solo entra cuando el blanco tecnico esta validado.

## Resolucion operativa
La simulacion se resuelve bien si hacemos esto:

1. Declarar incidente temprano.
2. Preservar evidencia.
3. Contener sin apagar todo por reflejo.
4. Revocar y rotar accesos privilegiados.
5. Pasar a modo degradado seguro.
6. Confirmar vector real antes de remediar en masa.
7. Reconstruir confianza tecnica antes de volver a operacion normal.

## Objetivo del entrenamiento
Aprender a responder a un ataque avanzado sin improvisacion.
Aprender a proteger al cliente mientras se investiga.
Aprender a distinguir bug, falla operativa e intrusión real.
Aprender a tomar decisiones de contencion sin destruir evidencia.

## Leccion aprendida
Frente a atacantes de alto nivel, la victoria no viene de reaccionar mas fuerte sino mas claro.
La defensa madura separa mando, contencion, continuidad y forensia.
La mayor debilidad suele estar en credenciales, privilegios y confianza operativa mal distribuida.
