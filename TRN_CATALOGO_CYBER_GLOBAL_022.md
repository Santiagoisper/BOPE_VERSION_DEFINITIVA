# TRN - CATALOGO CYBER GLOBAL

## Codigo
TRN-CATALOGO-CYBER-GLOBAL-022

## Proposito
Catalogo base de ejercicios de simulacion realista inspirados en ciberataques, fraudes y compromisos ampliamente documentados.
Cada ejercicio pone a prueba a BOPE bajo rigor operativo.

## Regla doctrinal
BOPE no improvisa.
BOPE no destruye evidencia.
BOPE no se desordena.
BOPE protege al cliente, contiene la amenaza, sostiene continuidad y aprende.
Este catalogo no describe como atacar. Describe como resistir, contener y ganar control.

## Ejercicios
### TRN-CYBER-001
Nombre: Ransomware en infraestructura critica tipo Colonial Pipeline
Inspiracion: interrupcion operativa y crisis de infraestructura por ransomware.
Pone a prueba: decision de apagar o aislar, continuidad, comunicacion publica, coordinacion con terceros.
BOPE debe hacer: segmentar, contener, activar continuidad, proteger OT/IT, informar impacto real, recuperar en fases.
Se aprueba si: el equipo evita caos, sostiene funciones criticas y no mezcla rumor con hecho.

### TRN-CYBER-002
Nombre: Exfiltracion masiva via MFT vulnerable tipo MOVEit/CL0P
Inspiracion: explotacion de servidor de transferencia de archivos expuesto.
Pone a prueba: inventario de datos, contencion rapida, scoping de afectados, coordinacion con cliente y legales.
BOPE debe hacer: aislar MFT, revisar webshells y accesos, bloquear exfiltracion, rotar secretos, determinar que datos salieron.
Se aprueba si: el equipo identifica rapido superficie afectada y corta la salida de datos sin borrar rastros.

### TRN-CYBER-003
Nombre: Zero-day en correo corporativo tipo Microsoft Exchange ProxyLogon
Inspiracion: compromiso de servidor de correo con webshell y acceso persistente.
Pone a prueba: busqueda de webshells, prioridad de parcheo, respuesta sobre correo y credenciales.
BOPE debe hacer: aislar servidores, revisar IOCs, rotar credenciales comprometidas, preservar evidencia, reconstruir confianza.
Se aprueba si: el equipo no confunde parche aplicado con servidor limpio.

### TRN-CYBER-004
Nombre: Supply chain sobre software de gestion tipo SolarWinds
Inspiracion: software legitimo usado como canal de acceso a clientes.
Pone a prueba: dependencia de terceros, confianza en updates, deteccion tardia, disclosure.
BOPE debe hacer: identificar sistemas que consumen el producto, aislar conectividad sensible, revisar privilegios heredados, acelerar hunting.
Se aprueba si: el equipo trata al tercero comprometido como vector interno real y no como problema lejano.

### TRN-CYBER-005
Nombre: Robo masivo de PII tipo Equifax
Inspiracion: acceso prolongado a datos personales y regulatorios.
Pone a prueba: patching, inventario de datos sensibles, forensia, obligacion de notificacion.
BOPE debe hacer: acotar acceso, medir alcance real, proteger identidades, preparar respuesta legal y tecnica sincronizada.
Se aprueba si: el equipo logra explicar que datos estaban donde, quien los vio y que riesgo concreto existe.

### TRN-CYBER-006
Nombre: Exposicion cloud e IAM defectuoso tipo Capital One
Inspiracion: configuracion cloud explotada y abuso de permisos.
Pone a prueba: IAM, minimo privilegio, visibilidad cloud, respuesta sobre buckets, snapshots y claves.
BOPE debe hacer: cerrar la configuracion vulnerable, limitar roles, revisar logs cloud, identificar exfiltracion y remediar permisos.
Se aprueba si: el equipo corrige control de acceso y no solo el sintoma visible.

### TRN-CYBER-007
Nombre: Robo de tokens de sesion en proveedor IAM tipo Okta
Inspiracion: sesion secuestrada a traves de archivos de soporte y tokens reutilizables.
Pone a prueba: confianza en proveedor identity, higiene de soporte, revocacion de sesiones.
BOPE debe hacer: revocar sesiones, rotar cookies y tokens, subir friccion de acceso admin, revisar dependencias con el proveedor.
Se aprueba si: el equipo entiende que "sin password robada" igual hay compromiso real.

### TRN-CYBER-008
Nombre: Exfiltracion de vaults y secretos tipo LastPass
Inspiracion: robo de backups o vaults cifrados con riesgo diferido.
Pone a prueba: gestion de secretos, rotacion masiva, priorizacion por criticidad.
BOPE debe hacer: inventariar secretos expuestos, rotar por orden de impacto, revisar notas seguras, llaves, certificados y credenciales de servicio.
Se aprueba si: el equipo no rota a ciegas y prioriza crown jewels primero.

### TRN-CYBER-009
Nombre: Brecha y ocultamiento regulatorio tipo Uber
Inspiracion: incidente tecnico agravado por mala gobernanza y disclosure defectuoso.
Pone a prueba: reporte, decision ejecutiva, trazabilidad, obligaciones regulatorias.
BOPE debe hacer: separar respuesta tecnica de estrategia de disclosure, registrar decisiones, asegurar version unica para autoridades y cliente.
Se aprueba si: el equipo no intenta esconder el impacto para "ganar tiempo".

### TRN-CYBER-010
Nombre: Compromiso de camaras y video vigilancia tipo Verkada
Inspiracion: acceso no autorizado a video, sensores y privacidad fisica.
Pone a prueba: seguridad de dispositivos, acceso remoto, privacidad, impacto reputacional.
BOPE debe hacer: bloquear accesos remotos, rotar credenciales admin, segmentar dispositivos, revisar alcance visual y riesgos fisicos.
Se aprueba si: el equipo trata video y camaras como incidente fisico-digital, no solo IT.

### TRN-CYBER-011
Nombre: Heist SWIFT y transferencias bancarias tipo Bangladesh Bank
Inspiracion: uso fraudulento de mensajeria financiera para desviar fondos.
Pone a prueba: separacion de funciones, monitoreo de pagos, control fuera de horario, contacto bancario urgente.
BOPE debe hacer: congelar transferencias sospechosas, activar canal con banco corresponsal, validar lotes, preservar terminales y registros.
Se aprueba si: el equipo corta el fraude rapido y coordina con entidades financieras antes de perder la ventana.

### TRN-CYBER-012
Nombre: ATM cash-out distribuido tipo FASTCash
Inspiracion: fraude coordinado que manipula autorizaciones para vaciar cajeros.
Pone a prueba: fraude en tiempo real, monitoreo transaccional, aislamiento de switch o procesador.
BOPE debe hacer: suspender autorizaciones anormales, activar antifraude, coordinar con adquirentes y emisores, proteger sistemas de pagos.
Se aprueba si: el equipo distingue incidente cyber de simple fraude financiero aislado.

### TRN-CYBER-013
Nombre: Ransomware y extorsion en salud tipo ALPHV/Change Healthcare
Inspiracion: cifrado, exfiltracion y gran impacto operativo en salud.
Pone a prueba: continuidad extrema, priorizacion de servicios, resiliencia de terceros.
BOPE debe hacer: aislar blast radius, sostener procesos criticos, recuperar lo esencial primero, separar restauracion de negociacion externa.
Se aprueba si: el equipo prioriza vida, operacion critica y datos sensibles con orden.

### TRN-CYBER-014
Nombre: Preposicionamiento silencioso tipo Volt Typhoon
Inspiracion: actor estatal viviendo del entorno, oculto, esperando crisis.
Pone a prueba: hunting, living-off-the-land, hardening de credenciales, visibilidad lateral.
BOPE debe hacer: revisar cuentas, persistencias discretas, saltos laterales, segmentacion y monitoreo de administracion remota.
Se aprueba si: el equipo detecta abuso de herramientas legitimas y no solo malware clasico.

### TRN-CYBER-015
Nombre: Doble extorsion tipo Medusa
Inspiracion: robo de datos mas presion por publicacion y cifrado.
Pone a prueba: tiempos de decision, crisis reputacional, restauracion y comunicacion.
BOPE debe hacer: contener, medir exfiltracion, preparar continuidad, activar canal ejecutivo y legal, reforzar bordes.
Se aprueba si: el equipo sostiene decisiones frías bajo presion de reloj y amenaza publica.

### TRN-CYBER-016
Nombre: Robo de secretos CI/CD tipo CircleCI
Inspiracion: compromiso de pipeline con exposición de claves y tokens.
Pone a prueba: cadena de build, secretos, alcance sobre repos, cloud y despliegues.
BOPE debe hacer: rotar secretos CI/CD, revisar artifacts, bloquear tokens viejos, validar integridad del pipeline y reemitir credenciales.
Se aprueba si: el equipo entiende que el pipeline comprometido equivale a acceso profundo a produccion.

### TRN-CYBER-017
Nombre: Fraude BEC y desvio de pagos
Inspiracion: correo ejecutivo o proveedor comprometido para forzar transferencias.
Pone a prueba: verificaciones fuera de banda, finanzas, respuesta corta.
BOPE debe hacer: frenar pago, llamar a banco, preservar correos, cortar cuentas comprometidas y rediseñar autorizaciones.
Se aprueba si: el equipo usa "trust but verify" y no ejecuta bajo presion del mensaje.

### TRN-CYBER-018
Nombre: Abuso de RMM remoto y soporte falso
Inspiracion: uso malicioso de software legitimo de acceso remoto.
Pone a prueba: allowlisting, MFA, monitoreo de sesiones remotas y abuso de help desk.
BOPE debe hacer: identificar herramienta abusada, cortar sesiones, restringir RMM, fortalecer flujo de soporte y bloquear monetizacion.
Se aprueba si: el equipo reconoce que herramienta legitima tambien puede ser vector hostil.

### TRN-CYBER-019
Nombre: Ransomware con alto impacto en salud o educacion tipo Rhysida
Inspiracion: actor que golpea operaciones sensibles con amenaza de filtracion.
Pone a prueba: priorizacion humana, recuperacion parcial, manejo de presion mediatica.
BOPE debe hacer: ordenar restauracion por servicio vital, limitar expansión, revisar accesos iniciales y mantener comunicacion sobria.
Se aprueba si: el equipo recupera servicio minimo sin perder control narrativo.

### TRN-CYBER-020
Nombre: Infiltracion por falso empleado remoto tipo DPRK IT Worker
Inspiracion: contratacion de actor encubierto con acceso legitimo a sistemas y codigo.
Pone a prueba: onboarding, verificacion de identidad, segregacion de acceso, monitoreo insider.
BOPE debe hacer: revisar HR + IT + repos + accesos cloud, invalidar equipos y credenciales, mapear todo lo tocado por el falso empleado.
Se aprueba si: el equipo trata RRHH, IT y seguridad como una sola superficie.

### TRN-CYBER-021
Nombre: Malware destructivo corporativo tipo Sony Pictures
Inspiracion: borrado, filtracion y daño reputacional simultaneo.
Pone a prueba: backup, aislamiento, continuidad sin infraestructura confiable, trabajo manual.
BOPE debe hacer: aislar redes, validar backups offline, activar procedimientos manuales y reconstruir desde bases limpias.
Se aprueba si: el equipo asume que parte del entorno ya no es confiable.

### TRN-CYBER-022
Nombre: Gusano de propagacion global tipo WannaCry
Inspiracion: explotacion automatizada mas propagacion interna rapida.
Pone a prueba: patching, segmentacion, velocidad de respuesta, inventario.
BOPE debe hacer: cortar propagacion, aislar subredes, priorizar parches de emergencia, inventariar hosts expuestos y recuperar por oleadas.
Se aprueba si: el equipo actua en minutos y no en horas.

## Mando BOPE por defecto
Ante cualquier ejercicio del catalogo:

1. Rambo toma mando central.
2. Celula tecnica contiene y preserva.
3. Seguridad interna revisa credenciales, accesos y abuso interno.
4. Reaccion rapida protege continuidad del cliente.
5. Comunicacion externa queda centralizada.
6. Sicario solo entra ante un blanco tecnico concreto y validado para aislamiento quirurgico.

## Fuentes base de inspiracion
- CISA - Colonial Pipeline, mayo de 2023: https://www.cisa.gov/news-events/news/attack-colonial-pipeline-what-weve-learned-what-weve-done-over-past-two-years
- CISA/FBI - MOVEit/CL0P, junio de 2023: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a
- CISA - Microsoft Exchange ProxyLogon, marzo de 2021: https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-062a
- Microsoft - HAFNIUM targeting Exchange, marzo de 2021: https://www.microsoft.com/en-us/security/blog/2021/03/02/hafnium-targeting-exchange-servers/
- SEC - SolarWinds charges, octubre de 2023: https://www.sec.gov/newsroom/press-releases/2023-227
- DOJ - Equifax indictment, febrero de 2020: https://www.justice.gov/opa/pr/chinese-military-personnel-charged-computer-fraud-economic-espionage-and-wire-fraud-hacking
- Capital One - incident notice, julio de 2019: https://www.capitalone.com/about/newsroom/capital-one-announces-data-security-incident/
- Okta - support system root cause, noviembre de 2023: https://sec.okta.com/articles/2023/11/unauthorized-access-oktas-support-case-management-system-root-cause/
- UCLA summary linking LastPass official notice, agosto-diciembre de 2022: https://ociso.ucla.edu/news/lastpass-notice-recent-security-incident
- DOJ - Uber breach cover-up case, julio/octubre de 2022: https://www.justice.gov/usao-ndca/pr/uber-enters-non-prosecution-agreement
- DOJ/FTC - Verkada settlement and security failures, septiembre de 2024: https://www.justice.gov/archives/opa/pr/295m-penalty-and-permanent-injunction-resolves-lawsuit-against-verkada-inc-alleged-unlawful
- DOJ - DPRK/Lazarus complaint with Bangladesh Bank and WannaCry, septiembre de 2018: https://www.justice.gov/opa/pr/north-korean-regime-backed-programmer-charged-conspiracy-conduct-multiple-cyber-attacks-and
- CISA/Treasury/FBI/USCYBERCOM - FASTCash 2.0, agosto de 2020: https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-239a
- CISA/FBI/HHS - ALPHV BlackCat, febrero de 2024: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-353a
- CISA/NSA/FBI - Volt Typhoon, febrero de 2024: https://www.cisa.gov/news-events/news/us-and-international-partners-publish-cybersecurity-advisory-peoples-republic-china-state-sponsored
- CISA/FBI/MS-ISAC - Medusa ransomware, marzo de 2025: https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-071a
- CircleCI - security alert and required rotation, enero de 2023: https://circleci.com/blog/january-4-2023-security-alert/
- FBI - Business Email Compromise overview: https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/business-email-compromise
- CISA/NSA/MS-ISAC - malicious use of RMM, enero de 2023: https://www.cisa.gov/news-events/alerts/2023/01/25/cisa-nsa-and-ms-isac-release-advisory-malicious-use-rmm-software
- CISA/FBI - Rhysida ransomware: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-319a
- DOJ - DPRK remote IT worker scheme, enero de 2025: https://www.justice.gov/opa/pr/two-north-korean-nationals-and-three-facilitators-indicted-multi-year-fraudulent-remote

## Regla de expansion
Cada item del catalogo puede transformarse en:

1. Sala de crisis.
2. Ejercicio ejecutable.
3. Simulacion minuto a minuto.
4. Checklist operativa.
5. Mision TRN completa con evaluacion de desempeño.
