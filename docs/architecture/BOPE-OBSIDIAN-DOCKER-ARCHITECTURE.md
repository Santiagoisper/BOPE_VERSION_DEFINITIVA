# BOPE + Obsidian + Docker Architecture

Estado: draft operativo  
Fecha: 2026-06-28  
Propietario: Santiago / BOPE Command Center

## Objetivo

Convertir BOPE en un sistema operativo de ejecucion con memoria viva:

- `BOPE_VERSION_DEFINITIVA` es el nucleo ejecutable, doctrinal y versionado.
- `ObsidianVault` es el cerebro humano/estrategico y la memoria navegable.
- Docker es el runtime reproducible para backend, UI, base de datos y futuros servicios aliados.
- `CLAUDIO` se analiza como referencia de MCP, memoria y herramientas, no como sustituto de BOPE.

La arquitectura debe preservar la historia BOPE: jerarquia, mando, soldados, medallas, sanciones, cierres de mision y epica operativa. Eso no va como adorno: va como dato, regla y experiencia de producto.

## Principios

1. BOPE entra por mando: toda orden operativa pasa por JOHN RAMBO.
2. Obsidian no reemplaza la base transaccional; funciona como cerebro, fuente documental y memoria legible.
3. Postgres conserva estado vivo: sesiones, misiones, eventos, medallas, sanciones, proveedores, presupuesto y auditoria.
4. Markdown conserva doctrina e historia: legajos, records, cierre de mision, decisiones y narrativa.
5. Docker debe levantar el sistema sin depender de configuracion manual invisible.
6. La UI debe ser un Command Center usable, no una pagina decorativa.

## Fuentes canonicas

### Repo BOPE

- `bope/roster.json`: roster operativo exportable.
- `bope/agents/*.md`: prompts/identidad de soldados.
- `bope/skills/*.md`: capacidades doctrinales.
- `bope/doctrine/*.md`: reglas de colaboracion, declaracion, playbook y paridad Cursor/CLI.
- `codex-logs/RECORDS.md`: historial operativo Codex.
- `codex-logs/CUADRO-DE-HONOR.md`: medallero visible.
- `codex-logs/FICHAS-OPERATIVAS-BOPE.md`: pantalla ceremonial y estado del batallon.
- `codex-logs/personnel/*.md`: legajos.
- `logs/missions/INDEX.md`: indice de misiones historicas.
- `docs/honors/medallas-y-condecoraciones.md`: reglas de condecoracion.
- `apps/bope-command-center-server`: API, persistencia, ejecucion, auditoria.
- `apps/bope-command-center`: UI operativa.

### ObsidianVault

- `00 - Dashboard/Inicio.md`: entrada al cerebro.
- `00 - Dashboard/Stack Oficial.md`: stack oficial de herramientas.
- `10 - Proyectos/BOPE - Proyecto Maestro.md`: marco estrategico BOPE.
- `20 - Repos/BOPE_VERSION_DEFINITIVA.md`: ficha del repo.
- `40 - SOPs/*.md`: procedimientos.
- `50 - Decisiones/*.md`: decisiones.
- `70 - Agentes AI/*.md`: mapa de herramientas/agentes.
- `95 - Autopilot/*.md`: diseño del autopiloto.
- `96 - Autopilot Engine`: scripts/config/logs de automatizacion.

### Cerebro

Fuente secundaria. Debe migrarse o archivarse dentro de ObsidianVault. Hoy parece mas bandeja experimental que cerebro canonico.

### CLAUDIO

Referencia util:

- MCP local/remoto con token.
- Herramientas por capacidad: memoria, GitHub, Gmail, Calendar, documentos, web y shell.
- Flags de seguridad para escrituras reales.
- UI de memoria/documentos/correo.

Decision: absorber patrones, no fusionar repos sin necesidad. CLAUDIO puede quedar como servicio aliado o fuente de modulos, siempre detras de permisos explicitos.

## Arquitectura objetivo

```text
SANTIAGO
  |
  v
BOPE Command Center UI
  |
  v
BOPE Backend API
  |-- Postgres: estado vivo y transaccional
  |-- BOPE repo mounted: doctrina/version/historia
  |-- ObsidianVault mounted: cerebro, proyectos, decisiones, fuentes
  |-- Cerebro mounted read-only: migracion/archivo
  |-- optional CLAUDIO service: MCP/capabilities externas
```

## Modelo de memoria

### Capa 1: Estado vivo

Vive en Postgres.

- agentes
- performance
- misiones
- eventos
- medallas
- sanciones
- herramientas
- proveedores
- presupuesto
- sesiones
- auditoria

### Capa 2: Doctrina e historia

Vive en Markdown versionado.

- constitucion
- orden de batalla
- legajos
- cierre de misiones
- records
- cuadro de honor
- sanciones y KIA
- playbooks

### Capa 3: Cerebro estrategico

Vive en ObsidianVault.

- proyectos maestros
- mapa de repos
- decisiones
- SOPs
- ideas conectadas
- fuentes
- digest y cola de revision

### Capa 4: Indice incremental

Debe construirse.

Responsabilidades:

- escanear por `mtime`
- actualizar documentos cambiados
- eliminar entradas de archivos borrados
- producir `bope-memory-index.json`
- producir notas resumen para Obsidian
- detectar contradicciones entre repo y vault

## Docker runtime

Servicios actuales:

- `postgres`: Postgres 16.
- `backend`: BOPE Command Center Server.
- `frontend`: BOPE Command Center UI servida por Nginx.

Montajes definidos:

- repo BOPE en `/workspace/bope` como read-only para lectura doctrinal.
- ObsidianVault en `/data/obsidian-vault` para cerebro operativo.
- Cerebro en `/data/cerebro` como read-only para migracion.

Variables de contrato:

- `BOPE_WORKSPACE_PATH=/workspace/bope`
- `BOPE_OBSIDIAN_VAULT_PATH=/data/obsidian-vault`
- `BOPE_CEREBRO_PATH=/data/cerebro`

Siguiente paso Docker:

1. Agregar endpoint `/api/memory/status`. Estado: iniciado.
2. Agregar lector seguro de vault/repo con allowlist de extensiones. Estado: iniciado.
3. Agregar indexador incremental. Estado: iniciado.
4. Agregar job manual desde UI: "Sincronizar cerebro".
5. Opcional: agregar `claudio` como servicio separado con `CLAUDIO_ENABLE_*` en falso por defecto.

Endpoints Memory Core iniciados:

- `GET /api/memory/status`: informa montajes, readiness e indice actual.
- `POST /api/memory/sync`: escanea BOPE/Obsidian/Cerebro y actualiza `memory-index.json`.
- `GET /api/memory/search?q=...`: busqueda simple sobre titulo, ruta, resumen y links.
- `GET /api/memory/conflicts`: contradicciones conocidas detectadas desde el indice.
- `POST /api/memory/obsidian-sync`: actualiza notas controladas del vault usando bloques BOPE.

Reglas actuales del indice:

- extensiones permitidas: `.md`, `.txt`, `.json`, `.yaml`, `.yml`, `.canvas`
- ignora `.git`, `.vercel`, `.next`, `node_modules`, `dist`, `build`, `__pycache__`
- limite por archivo indexado: 200 KB
- actualizacion incremental por `mtime` y tamaño
- remueve entradas de archivos borrados en el siguiente sync
- escritura en ObsidianVault solo por bloques `<!-- BOPE:START -->` / `<!-- BOPE:END -->`
- no reemplaza contenido humano fuera de esos bloques

Notas objetivo de Obsidian Sync:

- `20 - Repos/BOPE_VERSION_DEFINITIVA.md`
- `10 - Proyectos/BOPE - Proyecto Maestro.md`
- `70 - Agentes AI/BOPE Command Center.md`
- `50 - Decisiones/BOPE Arquitectura Docker Obsidian.md`

## UI objetivo

La UI debe sentirse como una sala de mando seria:

- panel central de ordenes y ejecucion
- mapa de mision activa
- roster jerarquico con estado, rango, medallas y restricciones
- medallero visible y ceremonial, pero util
- timeline de eventos y cierres
- cerebro Obsidian: estado de sincronizacion, notas enlazadas, decisiones abiertas
- panel Docker/runtime: salud de backend, Postgres, vault, indexador, providers
- vista de doctrina: leer fuentes canonicas sin editar desde la UI inicial

Tono visual:

- sobrio, tactico, premium
- jerarquia fuerte
- menos terminal cruda, mas consola operativa
- medallas/ribbons como sistema visual propio
- responsive y usable en escritorio primero

## Plan de implementacion

### Fase 1: Contrato y Docker

- Consolidar `docker-compose.yml`.
- Validar build de backend/frontend.
- Montar ObsidianVault y Cerebro.
- Documentar variables en `.env.example`.
- Agregar healthcheck de memoria.

### Fase 2: Memory Core

- Crear modulo backend `memory/`.
- Leer vault/repo con allowlist.
- Indexar incrementalmente por `mtime`.
- Persistir indice en Postgres o archivo controlado.
- Exponer endpoints:
  - `GET /api/memory/status`
  - `POST /api/memory/sync`
  - `GET /api/memory/search?q=`
  - `GET /api/memory/conflicts`

### Fase 3: Obsidian Sync

- Generar o actualizar notas controladas:
  - `20 - Repos/BOPE_VERSION_DEFINITIVA.md`
  - `10 - Proyectos/BOPE - Proyecto Maestro.md`
  - `70 - Agentes AI/BOPE Command Center.md`
  - `50 - Decisiones/BOPE Arquitectura Docker Obsidian.md`
- No sobrescribir notas humanas sin bloque delimitado.
- Usar bloques `<!-- BOPE:START -->` / `<!-- BOPE:END -->`.

### Fase 4: Historia y condecoraciones

- Normalizar medallas y sanciones como entidades.
- Parsear `codex-logs` y legajos.
- Cruzar operaciones de `RECORDS.md` con `CUADRO-DE-HONOR.md`.
- Mostrar inconsistencias en UI antes de corregir.

### Fase 5: UI Command Center v2

- Rediseñar dashboard.
- Agregar vista Cerebro.
- Agregar vista Medallero.
- Agregar vista Doctrina.
- Agregar vista Runtime Docker.
- Verificar visualmente con navegador y screenshots.

### Fase 6: CLAUDIO como aliado

- Definir si corre como servicio Docker separado.
- Integrar solo capacidades aprobadas:
  - memoria
  - documentos
  - GitHub read
  - web/research
- Mantener shell/write integrations desactivadas por defecto.

## Riesgos

- Mezclar memoria narrativa con estado transaccional puede producir inconsistencias.
- Montar el vault con escritura directa exige reglas estrictas para no pisar notas humanas.
- Importar demasiado de CLAUDIO puede duplicar responsabilidades.
- Una UI demasiado teatral puede bajar utilidad. La epica debe orientar, no tapar el trabajo.

## Decision inicial

La arquitectura oficial sera:

```text
BOPE repo = ejecucion + doctrina versionada
Postgres = estado vivo
ObsidianVault = cerebro estrategico y memoria navegable
Docker = runtime reproducible
CLAUDIO = referencia/capability aliado, no nucleo
```
