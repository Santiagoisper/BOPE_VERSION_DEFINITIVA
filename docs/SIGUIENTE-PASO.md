# SIGUIENTE PASO

## Donde quedamos

BOPE ya no se trata como un prototipo local ni como una pagina estatica.
La direccion activa es construir una plataforma seria con:

- frontend como interfaz central
- backend/orchestrator propio
- persistencia en Neon Postgres
- eventos en tiempo real por SSE
- integracion real con Claude, Codex/OpenAI y Gemini
- reglas operativas de intervencion, obediencia, handoff y escalamiento

Tambien quedo definido que:

- el COMMANDER unico sos vos
- el repo vigente para esta construccion es `BOPE`
- Neon ya fue provisionado con el schema inicial
- Vercel ya esta conectado al proyecto `bope`

## Estado actual

Lo que ya existe en BOPE:

- doctrina base en `docs/`
- bootstrap operativo en `docs/AGENT-BOOTSTRAP.md`
- reglas en `docs/BOPE-RULES.md`
- arquitectura inicial/documental en `docs/ARCHITECTURE.md`
- aprendizajes del caso PatientServices en `docs/APRENDIZAJES.md`
- base de monorepo en `app/` y `orchestrator/`
- schema inicial en `db/migrations/001_initial_schema.sql`

## Decision importante tomada

La arquitectura final buscada es:

- Next.js para frontend
- backend/orchestrator propio
- Neon para estado persistente
- SSE para streaming de eventos en el MVP

No se va a construir BOPE como dashboard estatico.

## Agentes que participan en esta mision

Nucleo principal:

- COMMANDER: decision final y reglas de mando
- GEMINI: arquitectura de plataforma
- CX: backend/orchestrator, contratos, integracion y ejecucion tecnica principal
- CC: frontend, interfaz central y UX operativa
- NEON: modelo de datos y persistencia
- GITHUB: ramas, PRs y trazabilidad
- PLAYWRIGHT: pruebas end-to-end

Apoyo tactico:

- INTEL: research puntual y evidencia externa
- PX: analisis tactico y flujo operativo
- DEEPSEEK: calidad y refactor
- REPLIT: prototipado rapido si hace falta
- MANUSIA: investigacion profunda en misiones grandes

## Pregunta de arquitectura ya respondida

INTEL ya cerro esta decision tactica:

- para el MVP, usar SSE
- no usar polling como base
- no usar WebSocket en fase 1 salvo necesidad real posterior

## Proximo trabajo exacto al volver

1. Crear el documento base de arquitectura de plataforma:

- `docs/PLATAFORMA-BOPE-vNEXT.md`

2. Ese documento debe dejar definidos:

- objetivo tecnico real del sistema
- componentes minimos del MVP
- estructura futura del repo
- modelo minimo de datos en Neon
- contrato estandar de eventos BOPE
- flujo operativo de una mision
- interfaz de adaptadores para Claude / Codex / Gemini
- riesgos arquitectonicos principales
- fases de construccion

3. Recien despues de eso:

- dar orden a GEMINI para arquitectura final
- bajar orden a CX para orchestrator + Neon + SSE
- bajar orden a CC para frontend Next.js

## Regla para retomar

Cuando vuelvas a abrir terminal:

1. Entrar a la carpeta `BOPE`
2. Leer:
   - `docs/MISION-ACTIVA.md`
   - `docs/SIGUIENTE-PASO.md`
   - `docs/APRENDIZAJES.md`
3. Arrancar por el documento `docs/PLATAFORMA-BOPE-vNEXT.md`

## Nota final

No arrancar implementacion grande antes de cerrar la arquitectura.
El siguiente paso correcto no es codigo primero.
Es dejar escrito el diseno de plataforma que todos los agentes van a obedecer.
