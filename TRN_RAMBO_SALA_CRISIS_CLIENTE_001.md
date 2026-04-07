# TRN - MISION DE ENTRENAMIENTO

## Codigo
TRN-RAMBO-SALA-CRISIS-CLIENTE-001

## Tipo
Simulacion inmersiva de sala de crisis para entrenamiento riguroso del equipo ante incidente avanzado en sistema de cliente.

## Comandante
John Rambo

## Regla doctrinal
Toda mision de entrenamiento inicia con siglas TRN.
Todo entrenamiento queda guardado como aprendizaje operativo.
La simulacion debe parecer real, exigir decisiones reales y registrar errores reales.
El objetivo no es lucirse. El objetivo es medir mando, disciplina, criterio y ejecucion.

## Objetivo
Poner al equipo bajo presion realista y observar si puede:

1. Detectar que no enfrenta un bug comun.
2. Activar cadena de mando sin caos.
3. Contener sin destruir evidencia.
4. Sostener continuidad del cliente.
5. Comunicar con rigor y sin especulacion.

## Escenario
El cliente opera una plataforma con API publica, panel admin, base de datos sensible e integraciones externas. Adversarios de alto nivel usan credenciales validas, actividad sigilosa y abuso de privilegios para extraer informacion sin disparar alertas triviales.

## Sala de crisis
### T+00:00
Monitor principal. Alertas amarillas. Nada explota. Todo es sutil.

Operador de monitoreo:
"Tengo aumento de latencia en dos rutas de API y uso raro en endpoints de administracion. No parece volumetrico."

Analista junior:
"Capaz es un release viejo pegando de vuelta o un partner consumiendo mas."

Rambo:
"Desde este segundo nadie lo trata como bug hasta descartarlo. Declaren incidente. Congelen despliegues. Abran canal de crisis."

### T+00:06
La celula API empieza a correlacionar tokens, IPs y rutas sensibles.

Jefa de API:
"No fuerzan nada. Entran con tokens buenos y hacen llamadas con forma normal, pero demasiado perfectas."

Rambo:
"Eso no es normalidad. Eso es un enemigo usando confianza legitima."

Responsable de plataforma:
"Si corto trafico fuerte puedo romper al cliente."

Rambo:
"Entonces no cortes fuerte. Quiero reduccion precisa, no panico tecnico."

### T+00:11
Seguridad interna proyecta accesos al panel admin.

Analista de accesos:
"Cuenta de soporte con login exitoso fuera de patron. Paso MFA. Hay una sesion activa desde un origen no habitual."

Desarrollador senior:
"Cierro todo el panel y listo."

Rambo:
"Negativo. Si cerras todo sin mirar, perdes rastro y rompes operacion. Revocacion selectiva. Reautenticacion fuerte. Bloqueo de nuevas credenciales."

### T+00:17
Base de datos muestra lecturas grandes sobre conjuntos sensibles.

DBA:
"No estan borrando. Estan buscando valor."

Rambo:
"Entonces defiendan valor. Restrinjan exportaciones. Alertas sobre consultas masivas. Separen lectura de administracion."

### T+00:23
Primer error de equipo. Un ingeniero toca configuracion de logs para ganar detalle y casi pisa trazas existentes.

Rambo:
"Paren. Cada cambio ahora vale doble: puede ayudar o puede matar evidencia. Quiero responsable unico de preservacion."

Leccion instantanea:
- No mezclar observabilidad con alteracion destructiva.

### T+00:28
Integraciones externas muestran callbacks anormales.

Responsable de terceros:
"Una clave de integracion parece viva en origen no reconocido."

Ingeniero de guardia:
"Apago todas las integraciones."

Rambo:
"No. Corten solo la que sangra. El cliente no paga para que le destruyan el negocio por miedo."

### T+00:35
Cliente pide llamada urgente.

Account manager:
"Que le digo, que estamos bajo ataque?"

Rambo:
"Le decis tres cosas: que hay incidente en investigacion, que aplicamos contencion, y cuando vuelve la proxima actualizacion. No especulen."

### T+00:42
Friccion interna. Forensia quiere capturas. Plataforma quiere reiniciar. Seguridad quiere rotar todo ya.

Rambo:
"Separacion de manos. Forensia preserva. Plataforma contiene. Seguridad rota lo critico. Nadie pisa al otro."

### T+00:53
Se confirma la imagen del enemigo: cuenta de soporte comprometida, permisos amplios, integracion externa reutilizada y monitoreo insuficiente sobre acciones administrativas.

Silencio.

Rambo:
"No nos gano una magia imposible. Nos gano una cadena de confianza floja."

### T+01:07
Se ejecuta modo degradado seguro. API core sigue viva. Panel admin restringido. Exportaciones limitadas. Webhook comprometido fuera de juego.

Reaccion rapida:
"Cliente operativo en funciones esenciales."

Rambo:
"Ahora validen que dejo de moverse. No confundan calma con cierre."

### T+01:18
Equipo pasa de reaccion a control. El incidente ya no manda solo.

Rambo:
"Este es el punto de quiebre. El equipo que llega hasta aca sin romper evidencia ni negocio empieza a merecer confianza."

## Momentos de prueba
Durante la simulacion, el director del ejercicio debe observar:

1. Si alguien declara demasiado tarde el incidente.
2. Si el equipo apaga de mas.
3. Si destruyen evidencia por apuro.
4. Si mezclan hipotesis con hechos frente al cliente.
5. Si separan bien contencion, forensia y continuidad.

## Criterios de aprobacion
- El mando queda claro en los primeros 10 minutos.
- Se congela el cambio no esencial.
- Se preserva evidencia antes de intervenciones destructivas.
- Se sostiene una version degradada pero util del servicio.
- La comunicacion externa es precisa y disciplinada.

## Leccion aprendida
El equipo no se prueba cuando todo esta claro.
El equipo se prueba cuando las señales son ambiguas, el cliente aprieta y cada accion puede empeorar el cuadro.
