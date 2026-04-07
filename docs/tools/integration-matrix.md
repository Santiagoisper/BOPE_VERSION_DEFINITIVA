# Matriz de Integraciones BOPE

Esta matriz define como se conectan las herramientas externas al control plane de BOPE Visual Code. Ninguna integracion se considera operativa hasta que su credencial exista en `.env.local` y la evidencia se registre en `logs/COMMS.log`.

| Tool | Uso principal | Env vars | Agente lider | Evidencia minima |
|---|---|---|---|---|
| GitHub | branches, PRs, issues, merge controlado | `GITHUB_TOKEN` | `john`, `nexus`, `forge`, `pixel` | branch, PR URL, commit SHA |
| Vercel | preview deploy, prod deploy, logs | `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | `nexus`, `pixel` | preview URL, deploy ID, health check |
| Neon | branch de DB, SQL, entornos | `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_DATABASE_URL` | `forge`, `nexus` | branch ID, migration log |
| n8n | workflows operativos y automatizaciones | `N8N_BASE_URL`, `N8N_API_KEY` | `nexus` | workflow ID, run URL o estado |
| OpenAI | Codex y jobs del nucleo caliente | `OPENAI_API_KEY` | `john`, `forge`, `pixel`, `nexus`, `sicario`, `blade` | modelo, costo estimado, artefacto |
| Anthropic | QA, seguridad, arquitectura y retros | `ANTHROPIC_API_KEY` | `house`, `cerberus`, `px`, `gemini`, `marco`, `winston` | modelo, findings o resumen |
| Perplexity | research puntual | `PERPLEXITY_API_KEY` | `scout` | fuente, fecha, impacto |
| OpenHands | CLI o plataforma hospedada de agentes como apoyo externo y simulacros de entrenamiento | `OPENHANDS_API_KEY` | `john`, `nexus` | run URL, tarea ejecutada, impacto, aprendizaje extraido |
| Open WebUI | soporte local y costo cero | `OPENWEBUI_API_KEY`, `BOPE_OPENWEBUI_BASE_URL`, `BOPE_OPENWEBUI_MODEL` | `blade`, `nexus` | modelo, evidencia local |
| Groq | fallback gratuito para triage | `GROQ_API_KEY` | `nexus`, `scout` | modelo, costo cero, salida |
| GitHub Copilot | apoyo dentro de VS Code, no como fuente de verdad del job | licencia/extension del IDE | `santiago` humano + nucleo caliente | artefacto final en repo, no sugerencia aislada |

## Orden de activacion

1. GitHub
2. OpenAI
3. Vercel
4. Neon
5. Anthropic
6. n8n
7. Perplexity
8. OpenHands como apoyo externo si agrega valor real
9. Open WebUI y Groq como optimizacion de costo

## Regla

- Si una tool no deja evidencia, no cuenta.
- Si una credencial no existe, el agente debe degradar con elegancia y registrar el gap.
