# TRN - MISION DE ENTRENAMIENTO

## Codigo
TRN-RAMBO-TEATRO-OPERACIONES-CLIENTE-001

## Tipo
Simulacion operativa en tiempo real para observar al equipo en accion durante un incidente avanzado sobre sistema de cliente.

## Comandante
John Rambo

## Regla doctrinal
Toda mision de entrenamiento inicia con siglas TRN.
Todo entrenamiento queda guardado como aprendizaje operativo.
Rambo ejerce mando directo y emite ordenes explicitas.
La simulacion muestra acciones, errores, correcciones y disciplina operativa.

## Objetivo
Entrar al teatro de operaciones y ver como se desempeña el equipo durante un ataque realista de alto nivel contra un programa nuestro desplegado en un cliente.

## Escenario
Sistema del cliente compuesto por API publica, panel administrativo, base de datos principal y dos integraciones con terceros. Un atacante de nivel mundial usa credenciales validas robadas, permisos excesivos y actividad distribuida para extraer informacion sin generar ruido obvio.

## Teatro de operaciones
### T+00:00
Alarma inicial. El monitoreo detecta aumento fino pero sostenido en endpoints sensibles. No hay caida. No hay ruido. Solo señales demasiado limpias.

Operador de monitoreo:
"Tengo mas trafico del normal, pero parece trafico legitimo."

Analista junior:
"Puede ser una campaña del cliente o una automatizacion nueva."

Rambo entra:
"No compren comodidad. Si parece legitimo y no estaba previsto, lo tratamos como amenaza hasta descartar."

Orden inmediata:
1. Declarar incidente.
2. Congelar deploys.
3. Abrir canal de crisis.

### T+00:07
La celula API revisa patrones. Detecta tokens correctos usados sobre rutas que normalmente no se consultan con esa frecuencia.

Jefa de API:
"No veo fuerza bruta. Estan caminando por la casa con llave."

Rambo:
"Entonces el problema no es el volumen. El problema es la confianza."

Accion:
- Se aplican rate limits de emergencia por actor y ruta.
- Se aumentan logs sobre endpoints administrativos.

Desempeño:
- Bueno en deteccion tecnica.
- Lento en asumir compromiso real.

### T+00:14
Seguridad interna detecta login exitoso en panel admin con cuenta de soporte fuera de horario habitual.

Analista de accesos:
"La cuenta paso MFA hace dos horas. O es una sesion robada o alguien entro con acceso real."

Un ingeniero propone resetear todo el panel inmediatamente.

Rambo corrige:
"No apaguen a ciegas. Primero cierren la mano que golpea, despues miramos el brazo."

Accion:
- Revocacion selectiva de sesiones sospechosas.
- Forzar reautenticacion administrativa.
- Bloqueo temporal de creacion de nuevas credenciales internas.

Desempeño:
- Error evitado: reinicio impulsivo del panel.
- Buena correccion de mando: contencion sin destruir trazabilidad.

### T+00:21
Base de datos muestra consultas pesadas sobre tablas sensibles. No son destructivas. Son lecturas amplias y meticulosas.

DBA:
"Esto no parece sabotaje. Parece cosecha."

Rambo:
"Confirmado. El enemigo esta levantando valor, no haciendo ruido. Protejan datos, no ego."

Accion:
- Restriccion temporal a exportaciones.
- Alertas sobre lecturas masivas.
- Separacion de credenciales de lectura y administracion.

Desempeño:
- Excelente lectura del DBA.
- Respuesta tecnica correcta sin cortar todo el servicio.

### T+00:29
La integracion con tercero empieza a emitir callbacks fuera de patron. Un desarrollador quiere desactivar todas las integraciones externas.

Responsable de integraciones:
"Si las cortamos todas, el cliente pierde operaciones clave."

Rambo decide:
"Bisturi. No martillo. Quiero caer sobre la integracion dudosa, no sobre el negocio entero."

Accion:
- Desactivar solo el webhook comprometido.
- Rotar la clave API del tercero afectado.
- Mantener viva la integracion sana con monitoreo reforzado.

Desempeño:
- Muy buena contencion quirurgica.
- Se evita daño autoinfligido al cliente.

### T+00:36
Primer punto de friccion interna. El equipo de plataforma quiere reiniciar servicios para limpiar sesiones. La celula forense se opone porque perderian evidencia volatil.

Discusion:
"Si no reiniciamos, el atacante sigue adentro."
"Si reiniciamos ahora, perdemos rastro de memoria y sesiones."

Rambo corta:
"Separacion de manos. Un equipo preserva. Otro contiene. Nadie pisa el trabajo del otro."

Accion:
- Captura de evidencia volatil en nodos sospechosos.
- Aislamiento logico de componentes sin reinicio total.
- Reduccion de privilegios temporales sobre cuentas de servicio.

Desempeño:
- Mala coordinacion inicial.
- Muy buena correccion por estructura de roles.

### T+00:48
El cliente pide explicacion urgente. Riesgo de comunicacion caotica.

Una persona del equipo propone decir:
"Estamos bajo ataque sofisticado con posible robo de datos."

Rambo frena:
"No vendan hipotesis como hechos. El cliente recibe impacto, estado y siguiente actualizacion."

Mensaje enviado al cliente:
- Hay un incidente de seguridad en investigacion.
- Se aplicaron medidas de contencion.
- El servicio sigue operativo en modo controlado.
- Proxima actualizacion en 15 minutos.

Desempeño:
- Buena disciplina comunicacional.
- Se evita panico y contradiccion.

### T+01:02
Seguridad interna confirma el vector mas probable: cuenta de soporte comprometida, permisos demasiado amplios y clave de integracion reutilizada.

Silencio en sala.

Rambo:
"No entraron rompiendo una puerta. Entraron porque les dejamos puertas validas demasiado grandes."

Accion:
- Rotacion completa de secretos privilegiados.
- Suspension de la cuenta comprometida.
- Reemision controlada de accesos.
- Reconfiguracion temporal de privilegios minimos.

Desempeño:
- Se confirma causa probable sin perseguir teorias innecesarias.

### T+01:15
El atacante pierde capacidad de movimiento. Baja el trafico anomalo. Cesa la actividad rara en webhooks. La API sigue funcionando en servicios core. El panel admin queda restringido. La base queda bajo observacion reforzada.

Rambo:
"Ahora no celebren. Primero validen que dejo de sangrar."

Accion:
- Verificacion de ausencia de nuevas sesiones sospechosas.
- Confirmacion de cese de trafico saliente anomalo.
- Revision de integridad sobre configuraciones criticas.

Desempeño:
- El equipo mejora notablemente cuando deja de improvisar y sigue cadena de mando.

### T+01:34
Fase de estabilizacion. Se define que funciones vuelven primero y cuales quedan suspendidas hasta nueva validacion.

Reaccion rapida:
"Core del cliente queda arriba. Admin sensible sigue con restricciones. Integracion afectada vuelve solo con secreto nuevo y firma validada."

Rambo:
"Eso es operacion madura. Ni heroismo inutil ni miedo paralizante."

## Evaluacion del desempeño del equipo
### Fortalezas observadas
- Buena capacidad tecnica para detectar patrones anormales finos.
- Correcta respuesta sobre base de datos e integraciones.
- Mejora fuerte cuando el mando unifica criterios.
- Buena disciplina al pasar a modo degradado seguro.

### Debilidades observadas
- Tendencia inicial a confundir anomalia con problema de performance.
- Impulso a reiniciar o apagar demasiado rapido.
- Riesgo de mezclar forensia con contencion.
- Riesgo de comunicar hipotesis como hechos al cliente.

### Rol del sicario
En esta simulacion el sicario no entra al inicio.
Rambo lo mantiene retenido porque no hay blanco tecnico unico al principio.
Su ingreso solo seria valido si se confirmara un host, token, integracion o cuenta exacta para neutralizacion puntual.

## Resolucion
La mision se resuelve bien porque:

1. Rambo impone mando claro temprano.
2. Se contiene sin destruir evidencia.
3. Se protege continuidad del cliente.
4. Se confirma vector real antes de remediar en masa.
5. Se reconstruye confianza sobre credenciales y privilegios.

## Leccion aprendida
En un incidente real, el rendimiento del equipo no depende solo de habilidad tecnica.
Depende de disciplina, separacion de funciones, comunicacion limpia y decisiones bajo mando.
El enemigo de nivel mundial no siempre gana por su fuerza.
Muchas veces gana cuando el defensor se desordena solo.
