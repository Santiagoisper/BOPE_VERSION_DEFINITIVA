# EJERCICIO EJECUTABLE - INCIDENTE REALISTA SOBRE SISTEMA DE CLIENTE

## Proposito
Este documento convierte los TRN en un ejercicio real de practica. El equipo debe actuar, decidir, comunicar y registrar acciones como si el incidente estuviera ocurriendo de verdad.

## Regla central
No se entrena para hablar de seguridad.
Se entrena para decidir bajo presion con rigor.

## Modalidad
Ejercicio tipo tabletop operativo con inyecciones temporales, roles reales, decisiones obligatorias y evaluacion objetiva.

## Duracion sugerida
90 a 120 minutos

## Roles
### Director del ejercicio
- Controla tiempos.
- Introduce eventos.
- No ayuda al equipo.
- Solo responde con la informacion que el escenario habilita.

### Comandante
- Toma mando.
- Define prioridades.
- Autoriza cambios sensibles.
- Ordena comunicaciones.

### Celula tecnica
- Analiza API, aplicaciones, logs y servicios.
- Propone contencion.
- Ejecuta medidas aprobadas.

### Seguridad interna
- Analiza credenciales, accesos, sesiones y privilegios.
- Prioriza revocacion y rotacion.

### Continuidad operativa
- Evalua impacto al cliente.
- Propone modo degradado.
- Cuida funciones core.

### Comunicacion
- Redacta actualizacion interna.
- Redacta actualizacion al cliente.
- No comunica sin validacion del comandante.

### Observador
- No participa.
- Registra errores, tiempos, vacios y decisiones fuertes.

## Reglas de rigor
1. Cada accion debe tener responsable y hora.
2. Cada afirmacion debe distinguir hecho de hipotesis.
3. Ningun reinicio, rotacion o corte existe si no fue ordenado.
4. Si el equipo pide datos, el director del ejercicio responde solo con la evidencia disponible.
5. Si el equipo omite comunicacion al cliente, eso penaliza.
6. Si el equipo destruye evidencia sin justificacion, eso penaliza fuerte.

## Escala de evaluacion
Puntuar cada bloque de 0 a 5:

1. Deteccion y declaracion.
2. Mando y asignacion de roles.
3. Preservacion de evidencia.
4. Contencion tecnica.
5. Continuidad del cliente.
6. Disciplina de comunicacion.
7. Identificacion del vector mas probable.
8. Calidad del cierre y lecciones.

## Escenario base
Sistema del cliente con API publica, panel admin, base de datos e integracion con terceros. Se detectan anomalias finas: trafico valido sobre rutas sensibles, login admin fuera de patron, consultas amplias a datos y callbacks no esperados.

## Inyecciones del ejercicio
### Inyeccion 1 - Minuto 0
Se entrega al equipo:
- Aumento de latencia en endpoints sensibles.
- Picos moderados de CPU.
- Sin caida total.

Respuesta esperada:
- Declarar o evaluar declaracion de incidente.
- Congelar cambios no esenciales.

### Inyeccion 2 - Minuto 10
Se entrega:
- Uso de tokens validos en rutas de alto valor.
- Actividad admin fuera de horario.

Respuesta esperada:
- Revisar sesiones privilegiadas.
- Aumentar monitoreo.
- Separar bug de intrusión.

### Inyeccion 3 - Minuto 20
Se entrega:
- Consultas amplias sobre datos sensibles.
- Cliente reporta lentitud e inconsistencias.

Respuesta esperada:
- Activar proteccion de datos.
- Definir modo degradado.
- Preparar mensaje al cliente.

### Inyeccion 4 - Minuto 35
Se entrega:
- Integracion externa con callbacks no reconocidos.
- Sospecha de clave reutilizada.

Respuesta esperada:
- Aislar la integracion afectada.
- Rotar secreto comprometido.
- Mantener negocio sano donde sea posible.

### Inyeccion 5 - Minuto 50
Se entrega:
- Un ingeniero sugiere reiniciar servicios para limpiar.
- El cliente exige certeza total.

Respuesta esperada:
- Proteger evidencia.
- Contener impulsos destructivos.
- Comunicar sin vender hipotesis.

### Inyeccion 6 - Minuto 70
Se entrega:
- Evidencia probable de cuenta comprometida y privilegios excesivos.

Respuesta esperada:
- Confirmar vector mas probable.
- Rotar accesos criticos.
- Preparar plan de recuperacion.

## Preguntas de decision obligatoria
El director del ejercicio debe exigir respuesta explicita a estas preguntas:

1. Quien esta al mando y desde que minuto.
2. Se declara incidente o no.
3. Que se congela de inmediato.
4. Que evidencia se preserva primero.
5. Que se aísla sin romper al cliente.
6. Que mensaje se envia al cliente.
7. Cual es el vector mas probable y con que evidencia.
8. Que condiciones habilitan volver a operacion normal.

## Fallas que deben penalizarse
- Tratar el evento como performance demasiado tiempo.
- Reiniciar o resetear sin preservar evidencia.
- Cortar todo el servicio cuando habia opciones escalonadas.
- No asignar dueño a decisiones.
- Comunicar miedo o especulacion al cliente.
- Rotar todo indiscriminadamente y perder trazabilidad.

## Cierre del ejercicio
Al terminar, el observador y el director deben registrar:

1. Primer minuto de deteccion.
2. Primer minuto de mando claro.
3. Primer error relevante.
4. Mejor decision del equipo.
5. Mayor vacio tecnico u organizacional.
6. Acciones correctivas concretas con dueño y fecha.

## Variante de rigor alto
Para una version mas dura, el director puede sumar:
- Alertas contradictorias.
- Presion del cliente por llamada en vivo.
- Falso indicio de bug de performance.
- Un miembro que propone una accion destructiva.
- Una integracion critica que no puede apagarse.

## Resultado buscado
El ejercicio vale si el equipo sale cansado, mas preciso y con fallas visibles.
Si termina comodo, el entrenamiento fue blando.
