# Slash Commands — Guía de Referencia Claude Code

Todos los comandos disponibles al tipear `/` en Claude Code.
Organizados por categoría con descripción y utilidad práctica.

---

## Sesión y conversación

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/clear` | Borra el historial de la conversación actual | Empezar fresco sin contexto viejo que confunda al modelo |
| `/compact [instrucciones]` | Comprime la conversación, opcionalmente con foco | Cuando el contexto creció mucho y querés seguir sin perder el hilo |
| `/resume [sesión]` | Retoma una conversación anterior | Continuar trabajo de otra sesión sin perder estado |
| `/branch [nombre]` | Crea una rama de la conversación actual | Explorar una alternativa sin perder el camino principal |
| `/rename [nombre]` | Renombra la sesión actual | Organizar sesiones por proyecto o tarea |
| `/rewind` | Vuelve la conversación a un punto anterior | Deshacer respuestas o código que salió mal |
| `/btw <pregunta>` | Hace una pregunta lateral sin agregarla al contexto | Consulta rápida sin ensuciar la conversación principal |
| `/exit` | Cierra Claude Code | Salir limpio |

---

## Código y proyecto

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/init` | Inicializa el proyecto con un archivo `CLAUDE.md` | Darle instrucciones permanentes a Claude sobre tu proyecto |
| `/memory` | Edita los archivos de memoria (`CLAUDE.md`) | Agregar o modificar instrucciones persistentes entre sesiones |
| `/add-dir <path>` | Agrega un directorio de trabajo a la sesión | Trabajar con múltiples repos o carpetas en la misma sesión |
| `/plan [descripción]` | Entra en modo planificación | Que Claude diseñe el enfoque antes de tocar código |
| `/diff` | Muestra los cambios sin commitear de forma visual | Revisar qué cambió antes de hacer commit |
| `/security-review` | Analiza los cambios pendientes buscando vulnerabilidades | Pre-deploy o ante cualquier duda de seguridad |

---

## Modelo y rendimiento

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/model [modelo]` | Cambia el modelo de IA activo | Elegir entre Opus, Sonnet o Haiku según costo/velocidad |
| `/effort [nivel]` | Ajusta el nivel de esfuerzo del modelo | `max` para tareas complejas, `low` para respuestas rápidas |
| `/fast [on\|off]` | Activa/desactiva modo rápido | Más velocidad de respuesta cuando no necesitás máxima calidad |

---

## Costo y uso

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/cost` | Muestra estadísticas de tokens usados en la sesión | Controlar el consumo por tarea |
| `/usage` | Muestra límites del plan y estado de rate limits | Saber cuánto te queda antes de que frene |
| `/context` | Visualiza el uso del contexto actual en colores | Ver cuánto contexto disponible te queda |

---

## Información y diagnóstico

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/help` | Muestra la ayuda general y comandos disponibles | Primera parada cuando no sabés qué hacer |
| `/doctor` | Diagnostica la instalación de Claude Code | Cuando algo no funciona y no sabés por qué |
| `/status` | Muestra versión, modelo, cuenta y conectividad | Verificar que todo esté bien configurado |
| `/release-notes` | Muestra el changelog completo | Ver qué cambió en las últimas versiones |
| `/tasks` | Lista y maneja tareas en segundo plano | Ver el estado de agentes corriendo en background |
| `/insights` | Genera un reporte de tus sesiones de Claude Code | Analizar cómo estás usando el tool y qué mejorar |
| `/stats` | Visualiza uso diario, historial, rachas y modelos | Dashboard de actividad personal |

---

## GitHub e integraciones

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/pr-comments [PR]` | Trae y muestra comentarios de un PR de GitHub | Revisar feedback de un PR sin salir del CLI |
| `/install-github-app` | Configura la app de Claude en GitHub Actions | Automatizar reviews de código en tu repo |

---

## Permisos y seguridad

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/permissions` | Ver o actualizar permisos de herramientas | Controlar qué puede hacer Claude sin pedirte permiso |
| `/sandbox` | Activa/desactiva modo sandbox | Aislar ejecución de comandos peligrosos |

---

## Personalización y visual

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/config` | Abre la configuración (tema, modelo, preferencias) | Ajustar Claude Code a tu gusto |
| `/theme` | Cambia el tema de color (claro, oscuro, ANSI) | Adaptar la interfaz a tu terminal |
| `/color [color]` | Cambia el color de la barra de prompt en esta sesión | Distinguir visualmente sesiones por proyecto |
| `/keybindings` | Abre o crea el archivo de atajos de teclado | Personalizar shortcuts propios |
| `/vim` | Alterna entre modo Vim y modo normal | Para quienes usan Vim y quieren editar en ese modo |
| `/statusline` | Configura la línea de estado en el shell | Mostrar info de Claude en tu prompt del terminal |
| `/terminal-setup` | Configura el terminal para Shift+Enter | Si tu terminal no tiene salto de línea sin enviar |

---

## Extensiones y MCP

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/mcp` | Gestiona conexiones a servidores MCP | Agregar o configurar herramientas externas (Calendar, Gmail, Vercel, etc.) |
| `/plugin` | Gestiona plugins de Claude Code | Instalar o desinstalar extensiones |
| `/reload-plugins` | Recarga plugins activos sin reiniciar | Aplicar cambios en plugins sin cerrar la sesión |
| `/agents` | Gestiona configuraciones de agentes | Ver y administrar subagentes disponibles |
| `/skills` | Lista los skills disponibles | Ver qué skills tenés activos en el proyecto |
| `/hooks` | Muestra configuraciones de hooks | Ver qué comandos se disparan automáticamente ante eventos |

---

## IDE y trabajo remoto

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/ide` | Gestiona integraciones con IDEs | Conectar Claude Code con VS Code, Cursor, etc. |
| `/desktop` | Continúa la sesión en la app Desktop | Pasar del CLI a la app gráfica sin perder contexto |
| `/remote-control` | Hace la sesión disponible para control remoto desde claude.ai | Compartir sesión con alguien o acceder desde el browser |

---

## Cuenta y autenticación

| Comando | Qué hace | Para qué te sirve |
|---------|----------|-------------------|
| `/login` | Inicia sesión en tu cuenta de Anthropic | Primer uso o si se cerró la sesión |
| `/logout` | Cierra sesión | Cambiar de cuenta o cerrar de forma segura |
| `/upgrade` | Abre la página para cambiar de plan | Pasar a Pro o Max si necesitás más capacidad |
| `/privacy-settings` | Ver y actualizar configuración de privacidad | Controlar qué datos comparte Claude Code |

---

## Comandos de MCP configurados en este proyecto

Estos comandos aparecen dinámicamente según los servidores MCP activos:

| Prefijo | Servidor | Ejemplos de uso |
|---------|----------|-----------------|
| `/mcp__claude_ai_Vercel__*` | Vercel | Deploy, logs, proyectos, dominios |
| `/mcp__claude_ai_Gmail__*` | Gmail | Leer mensajes, crear borradores |
| `/mcp__claude_ai_Google_Calendar__*` | Google Calendar | Crear eventos, buscar disponibilidad |
| `/mcp__claude_ai_Supabase__*` | Supabase | Ejecutar SQL, gestionar proyectos |
| `/mcp__claude_ai_PubMed__*` | PubMed | Buscar artículos científicos |
| `/mcp__claude_ai_Clinical_Trials__*` | Clinical Trials | Buscar ensayos clínicos |
| `/mcp__claude_ai_LunarCrush__*` | LunarCrush | Datos de mercado crypto/stocks |

---

## Skills disponibles en este proyecto

Los skills se activan como comandos y expanden el prompt con instrucciones especializadas:

| Skill | Para qué |
|-------|----------|
| `/locura` | Ejecución total sin confirmaciones — máxima velocidad |
| `/frontend-master` | Tareas de UI, React, Next.js, diseño |
| `/backend-master` | APIs, base de datos, lógica de servidor |
| `/ops-agent` | GitHub CLI, Vercel, Neon, procesos locales |
| `/god-mode` | Orquestación end-to-end de tareas complejas |
| `/analysis-master` | Diagnóstico avanzado de problemas complejos |
| `/writing-master` | Redacción y edición profesional |
| `/pdf` | Todo lo relacionado con archivos PDF |
| `/xlsx` | Todo lo relacionado con hojas de cálculo |
| `/pptx` | Todo lo relacionado con presentaciones PowerPoint |
| `/docx` | Todo lo relacionado con documentos Word |

---

*Generado: 2026-03-31 | Proyecto: BOPE VERSION DEFINITIVA*
