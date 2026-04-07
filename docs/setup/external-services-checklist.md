# Checklist Externo de Servicios

Este documento ordena lo que debe configurarse fuera del repo para que BOPE Visual Code pueda operar de punta a punta. Cada servicio se considera "listo" solo cuando:

1. existe la cuenta o plan activo
2. existe la credencial
3. la credencial fue pegada en `.env.local`
4. se registro una prueba minima en `logs/COMMS.log`

## OpenAI

- Crear API key.
- Pegar `OPENAI_API_KEY` en `.env.local`.
- Definir limite de gasto mensual.
- Registrar primer uso con `JOHN`, `FORGE`, `PIXEL` o `NEXUS`.

## Anthropic

- Crear API key.
- Pegar `ANTHROPIC_API_KEY`.
- Reservar para `HOUSE`, `CERBERUS`, `PX`, `GEMINI`, `MARCO`, `WINSTON`.
- Registrar findings o QA cuando se use.

## GitHub

- Crear token de acceso o usar CLI autenticada.
- Pegar `GITHUB_TOKEN`.
- Verificar branch, PR y permisos sobre el repo.

## Vercel

- Crear o vincular proyecto.
- Pegar `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`.
- Registrar preview deploy y health check.

## Neon

- Crear proyecto y branch inicial.
- Pegar `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_DATABASE_URL`.
- Registrar branch o migration de prueba.

## n8n

- Crear instancia o workspace.
- Pegar `N8N_BASE_URL`, `N8N_API_KEY`.
- Registrar un workflow de prueba.

## Perplexity

- Crear API key.
- Pegar `PERPLEXITY_API_KEY`.
- Reservar para research puntual de `SCOUT`.

## Groq

- Crear API key.
- Pegar `GROQ_API_KEY`.
- Usar como fallback barato para triage o validacion rapida.

## Open WebUI

- Preparar instancia local o remota.
- Pegar `OPENWEBUI_API_KEY`, `BOPE_OPENWEBUI_BASE_URL`, `BOPE_OPENWEBUI_MODEL`.
- Validar uso local con `BLADE` o `NEXUS`.

## GitHub Copilot

- Activar licencia del IDE.
- Verificar extension dentro de VS Code.
- Usarlo como apoyo humano dentro del editor, no como reemplazo del registro operativo.

## Cierre de onboarding

Cuando un servicio quede listo:

- agregar una linea en `logs/COMMS.log`
- anotar fecha y estado en `logs/MEMORIA/ULTIMO-RESUMEN.md`
- si el servicio impacta costo, reflejarlo en la planificacion del job siguiente
