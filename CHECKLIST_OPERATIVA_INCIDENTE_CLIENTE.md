# CHECKLIST OPERATIVA - INCIDENTE SOBRE SISTEMA DE CLIENTE

## Uso
Checklist defensiva para responder a un incidente real sin improvisacion.
Aplicar junto a la cadena de mando y registrar hora, responsable y resultado de cada paso.

## Fase 1 - Declaracion y control inicial
- Declarar incidente y asignar comandante.
- Congelar deploys, cambios de infraestructura y reinicios no autorizados.
- Abrir canal unico de crisis.
- Definir una sola voz para contacto con el cliente.
- Registrar hora exacta de deteccion y sintomas iniciales.

## Fase 2 - Preservacion de evidencia
- Guardar logs disponibles antes de tocar configuraciones.
- Tomar snapshots o backups forenses de sistemas criticos si es viable.
- Registrar sesiones activas, IPs, tokens y accesos privilegiados recientes.
- Proteger evidencia para no sobrescribirla durante la respuesta.
- Documentar cada accion ejecutada y por quien fue realizada.

## Fase 3 - Contencion inmediata
- Identificar servicios comprometidos o sospechosos.
- Bloquear trafico saliente no esencial o no reconocido.
- Revocar sesiones privilegiadas sospechosas.
- Rotar secretos expuestos o con riesgo alto.
- Aislar componentes comprometidos sin apagar toda la plataforma si no es necesario.
- Activar protecciones temporales en borde, WAF, firewall o controles de acceso.

## Fase 4 - Continuidad del cliente
- Definir funciones criticas que deben seguir operativas.
- Pasar a modo degradado seguro si hace falta.
- Deshabilitar funciones secundarias de alto riesgo.
- Confirmar integridad de datos visibles al cliente.
- Informar impacto real, no especulativo, con proximo hito de actualizacion.

## Fase 5 - Investigacion del vector
- Revisar credenciales privilegiadas, cuentas de servicio y tokens API.
- Auditar cambios recientes de configuracion.
- Verificar accesos administrativos fuera de patron.
- Analizar consultas anormales sobre datos sensibles.
- Revisar integraciones externas y webhooks.
- Confirmar si el vector fue credencial, configuracion, software o tercero.

## Fase 6 - Erradicacion y recuperacion
- Eliminar persistencia detectada.
- Rotar secretos y credenciales comprometidas.
- Aplicar minimo privilegio sobre cuentas y servicios.
- Revalidar integridad de binarios, imagenes, pipelines y configuraciones.
- Restaurar componentes desde origen confiable si hay duda de integridad.
- Recuperar operacion normal de forma escalonada.

## Fase 7 - Cierre y aprendizaje
- Confirmar que ceso actividad maliciosa.
- Verificar que no continue exfiltracion.
- Emitir resumen tecnico interno.
- Emitir resumen ejecutivo para el cliente.
- Registrar causa raiz y brechas de control.
- Crear acciones correctivas con responsable y fecha.

## Reglas de disciplina
- No asumir que es un bug hasta descartar intrusion.
- No tocar todo al mismo tiempo.
- No destruir evidencia por apuro.
- No comunicar hipotesis como hechos.
- No volver a operacion normal sin revalidar confianza tecnica.

## Indicadores de incidente avanzado
- Uso de cuentas validas en horarios o geografias no habituales.
- Cambios discretos en configuracion.
- Trafico saliente hacia destinos no conocidos.
- Alteracion o vaciado parcial de logs.
- Errores intermitentes mezclados con acciones administrativas reales.
- Accesos a datos sensibles sin patron funcional claro.
