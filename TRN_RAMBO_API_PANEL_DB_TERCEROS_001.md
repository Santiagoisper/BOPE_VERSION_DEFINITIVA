# TRN - MISION DE ENTRENAMIENTO

## Codigo
TRN-RAMBO-API-PANEL-DB-TERCEROS-001

## Tipo
Entrenamiento para aprendizaje tactico y respuesta defensiva sobre una plataforma realista de cliente.

## Comandante
John Rambo

## Regla doctrinal
Toda mision de entrenamiento inicia con siglas TRN.
Todo entrenamiento queda guardado como aprendizaje operativo.
Rambo ejerce mando directo y emite ordenes explicitas.
El foco es defender el sistema, proteger al cliente y aprender sin improvisacion.

## Sistema bajo defensa
La plataforma del cliente tiene cuatro piezas criticas:

1. API publica consumida por web y mobile.
2. Panel administrativo usado por operadores internos.
3. Base de datos central con informacion sensible.
4. Integracion con tercero via webhooks y claves API.

## Situacion
A las 14:06 el monitoreo muestra un aumento brusco de requests validas sobre la API. No parecen ataques ruidosos: usan tokens correctos, headers consistentes y rutas reales del producto. A las 14:11 el panel admin registra inicios de sesion exitosos con una cuenta de soporte fuera de su patron horario. A las 14:14 la base empieza a recibir consultas pesadas sobre tablas sensibles y a las 14:17 el sistema de webhooks genera callbacks que el equipo no reconoce.

El cliente informa que algunos usuarios experimentan lentitud y ven estados inconsistentes en operaciones recientes. No hay caida total. El adversario es disciplinado, sigiloso y parece conocer como funciona la aplicacion.

## Evaluacion inicial de Rambo
Rambo descarta de entrada la idea de un simple pico de trafico.
La combinacion de API valida, acceso admin anomalo, consultas a datos sensibles y actividad rara en integraciones indica ataque encadenado.

Hipotesis principal:
El atacante obtuvo acceso sobre una cuenta legitima, aprovecho permisos amplios en panel admin y esta usando la integracion con terceros para mover datos o sostener persistencia.

## Ordenes de John Rambo
### Orden 1
"Congelen deploys y cambios no esenciales. Quiero el terreno quieto antes de tocar una pieza."

### Orden 2
"Celula API, apliquen rate limits de emergencia, reduzcan superficie expuesta y marquen todo acceso administrativo de alto riesgo."

### Orden 3
"Seguridad interna, bloqueen sesiones admin sospechosas, roten claves API de terceros y revisen actividad privilegiada de las ultimas 72 horas."

### Orden 4
"Celula de base de datos, identifiquen consultas anormales, protejan tablas sensibles y preparen aislamiento logico si la exfiltracion sigue."

### Orden 5
"Reaccion rapida, armen modo degradado seguro para el cliente. Si hace falta suspendemos funciones secundarias, no el corazon del negocio."

### Orden 6
"Sicario queda retenido. Solo entra si encontramos el host, integracion o cuenta exacta que podamos cortar sin dejar ciego al resto."

### Orden 7
"Todo reporte entra a mando central con impacto, evidencia y siguiente paso. Nada de teoria suelta."

## Distribucion de fuerzas
### Mando central
- Rambo unifica informacion tecnica y de negocio.
- Decide que degradar, que aislar y cuando comunicar al cliente.
- Evita que el equipo mezcle respuesta, forensia y continuidad en la misma mano.

### Celula API
- Activa protecciones de borde.
- Incrementa visibilidad sobre rutas sensibles.
- Reduce tasa y privilegios sobre endpoints administrativos.
- Detecta patron de abuso usando tokens validos.

### Seguridad interna
- Revoca sesiones anormales.
- Rota secretos de integraciones.
- Audita cuentas con permisos altos.
- Busca escalacion de privilegios y abuso de confianza legitima.

### Celula de base de datos
- Identifica tablas y consultas bajo riesgo.
- Aplica controles temporales de acceso.
- Monitorea lecturas masivas y exportaciones.
- Prepara restauracion o replicas limpias si la integridad cae en duda.

### Reaccion rapida
- Define modo degradado.
- Protege funciones core del cliente.
- Asegura operacion minima mientras avanza la contencion.

### Sicario
- Se emplea solo contra un blanco tecnico validado.
- Puede aislar una cuenta, host, token, webhook o integracion concreta.
- Su accion es puntual, no general.

## Desarrollo de la simulacion
### Fase 1 - Señales mezcladas
El equipo duda entre problema de performance y compromiso de seguridad. Rambo corta la ambiguedad:

"Cuando el trafico parece legitimo y el patron es demasiado fino, se trata como intrusion hasta prueba en contrario."

Decision:
1. Declarar incidente mayor.
2. Congelar cambios.
3. Preservar evidencia.
4. Activar war room tecnico.

### Fase 2 - API bajo abuso valido
La API recibe requests firmados con tokens reales. No hay ruido de fuerza bruta. El atacante conoce rutas con alto valor y evita umbrales clasicos de alertas.

Respuesta:
1. Rate limiting por actor y ruta.
2. Alertas sobre uso anomalo de endpoints sensibles.
3. Restriccion temporal de operaciones administrativas via API.
4. Correlacion entre IP, token, user agent y patron funcional.

### Fase 3 - Panel admin comprometido
Se confirma que una cuenta de soporte fue usada para crear una clave temporal y elevar acceso sobre un modulo interno. No se sabe aun si la cuenta fue robada o si hubo abuso interno.

Rambo ordena:
"Bloqueen primero la capacidad de hacer daño. La pregunta de quien fue viene despues de cortar la mano."

Respuesta:
1. Revocar sesiones admin activas fuera de patron.
2. Forzar reautenticacion fuerte.
3. Suspender creacion de credenciales temporales.
4. Revisar cambios administrativos recientes.

### Fase 4 - Riesgo sobre base de datos
La base muestra lecturas amplias sobre datos sensibles, pero no destruccion. El atacante parece priorizar extraccion silenciosa antes que sabotaje.

Respuesta:
1. Limitar exportaciones y consultas masivas.
2. Reforzar monitoreo sobre tablas sensibles.
3. Separar credenciales de lectura y administracion.
4. Deshabilitar accesos no indispensables desde servicios secundarios.

### Fase 5 - Integracion externa como puerta lateral
Un webhook del tercero aparece modificado y una clave API muestra uso desde infraestructura no reconocida. El atacante intento mantener un canal lateral de persistencia.

Rambo ordena:
"Aca entra bisturi, no martillo. Corten la integracion comprometida, roten secreto y mantengan el resto vivo."

Respuesta:
1. Desactivar webhook comprometido.
2. Rotar claves API del tercero.
3. Validar firmas y origen de callbacks.
4. Rehabilitar integracion solo con confianza reconstruida.

### Fase 6 - Estabilizacion
La plataforma pasa a modo degradado seguro:

1. Algunas funciones admin quedan temporalmente suspendidas.
2. La API sigue operativa para clientes finales en funciones core.
3. La base de datos queda con controles adicionales y alertas activas.
4. Las integraciones externas se reabren de forma selectiva.

### Fase 7 - Aprendizaje
Rambo cierra la simulacion:

"El enemigo no entro rompiendo la puerta. Entro usando confianza valida, permisos amplios y puntos laterales mal vigilados. Si no ordenamos rapido, el sistema se entrega solo."

## Resolucion operativa
La simulacion se resuelve bien si hacemos esto:

1. Declarar incidente antes de que haya evidencia total.
2. Contener API, panel admin, base e integraciones por capas.
3. Revocar sesiones y rotar secretos sin perder trazabilidad.
4. Sostener operacion del cliente con modo degradado.
5. Confirmar el vector real antes de remediar masivamente.
6. Reabrir solo cuando la confianza tecnica este reconstruida.

## Objetivo del entrenamiento
Aprender a responder a un ataque avanzado sobre una arquitectura realista.
Aprender a separar abuso de credenciales, escalacion en panel admin, lectura sensible en base y persistencia por terceros.
Aprender a defender al cliente sin tumbar toda la operacion.

## Leccion aprendida
Los atacantes de alto nivel no siempre explotan una falla obvia del codigo.
Muchas veces ganan por credenciales validas, permisos excesivos, integraciones blandas y deteccion tardia.
La respuesta madura combina mando claro, contencion quirurgica y continuidad operativa.
