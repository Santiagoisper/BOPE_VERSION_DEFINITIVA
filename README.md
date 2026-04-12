# BOPE VERSION DEFINITIVA

Batallon de Operaciones de Precision y Excelencia adaptado para Claude Code y Codex.

Este repo define a `BOPE VERSION DEFINITIVA` con identidad local propia:

- mando unico
- bootstrap obligatorio
- economia operativa
- evidencia verificable
- sin orden lateral valida entre soldados
- cierre con registro, git y GitHub

## Capas del sistema

### Claude

- bootstrap: `.claude/CLAUDE.md`
- doctrina base: `.claude/BOPE-CONSTITUCION.md`
- roster: `.claude/ORDEN-DE-BATALLA.md`
- estado canonico: `logs/`

### Codex

- bootstrap: `CODEX.md`
- adaptacion doctrinal: `BOPE-CODEX-ADAPTACION.md`
- estado canonico: `codex-logs/`

## Regla de separacion

- Claude usa `.claude/` y `logs/`
- Codex usa `CODEX.md`, `BOPE-CODEX-ADAPTACION.md` y `codex-logs/`
- no existe dependencia de bootstrap externa para esta carpeta
- cualquier referencia doctrinal externa queda fuera del arranque normal y no define el equipo local

## Activacion en Claude

1. Abrir Claude Code en la raiz del repo.
2. Verificar `.claude/CLAUDE.md`.
3. Escribir `BOPE`.
4. Dar la orden a `JOHN RAMBO`.

## Activacion en Codex

Orden vigente:

```text
BOPE ONLINE. JOHN RAMBO EN MANDO.
Activa BOPE VERSION DEFINITIVA en modo Codex.
Antes de actuar, toma como base CODEX.md, BOPE-CODEX-ADAPTACION.md, codex-logs/MISION-ACTIVA.md y las ultimas 10 lineas de codex-logs/COMMS.log.
Opera con economia operativa: no actives mas soldados de los necesarios.
Toda mision cerrada debe quedar registrada en codex-logs, versionada en git y subida a GitHub.
Mi orden inicial va dirigida a JOHN RAMBO.
```

Arranque liviano recomendado:

- `powershell -ExecutionPolicy Bypass -File scripts/start-bope.ps1 -PrintOnly`
- usa `docs/setup/template-sesion-codex-lite.md` por defecto
- agrega `-Full` solo cuando la mision requiera arquitectura completa, memoria expandida o varios frentes

## Compatibilidad de invocacion

- la carpeta canonica de arranque es `BOPE VERSION DEFINITIVA`
- si una orden menciona una ruta BOPE externa o un set de `docs/` heredado, Codex resuelve la intencion contra `CODEX.md`, `BOPE-CODEX-ADAPTACION.md` y `codex-logs/`
- si `SANTIAGO` invoca a `CORONEL RAMBO`, `RAMBO` o `JOHN RAMBO`, la orden entra igual por `JOHN RAMBO`
- el nombre canonico y el rango visible no cambian por alias de activacion

## Batallon visible

| Soldado | Rol visible |
|---|---|
| `SANTIAGO` | comandante supremo |
| `JOHN RAMBO` | mando operativo |
| `PIXEL` | frontend |
| `FORGE` | backend |
| `HOUSE` | QA |
| `CERBERUS` | seguridad |
| `WINSTON` | cronista |
| `NEXUS` | integracion |
| `MARCO AURELIO` | consejero |
| `SICARIO | Locura` | operativo especial |

## Cierre de mision

Una mision no esta cerrada hasta que:

1. el estado quede registrado en la capa correspondiente
2. exista evidencia verificable
3. se documenten aprendizaje, sanciones y medallas si aplica
4. los cambios se versionen en git
5. se haga push a GitHub

Si no esta en GitHub, no esta cerrado.

## Cierre asistido Codex

Para evitar cierres parciales en `codex-logs/`, toda nueva mision de la capa Codex debe terminar con:

```bash
npm run codex:close-mission -- <MISSION_ID> <YYYY-MM-DD>
```

El comando sincroniza desde una sola ejecucion:

- `codex-logs/MISIONES.md`
- `codex-logs/MISION-ACTIVA.md`
- `codex-logs/RECORDS.md` en su tabla maestra
- `codex-logs/CUADRO-DE-HONOR.md` en operaciones visibles
- `codex-logs/FICHAS-OPERATIVAS-BOPE.md`
- `codex-logs/DOSSIER-GENERAL-BOPE.md`
- contadores y posicion visible en `codex-logs/personnel/*.md`

Si detecta que falta detallar la mision en el bloque individual de `RECORDS.md`, lo informa para que no quede una divergencia silenciosa.

## Topologia canonica al 3 de abril de 2026

El frente operativo unico de BOPE queda fijado asi:

- repo canonico: `BOPE VERSION DEFINITIVA`
- GitHub canonico: `https://github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA.git`
- rama principal: `main`
- bootstrap Codex: `CODEX.md`
- bootstrap Claude: `.claude/CLAUDE.md`

Estructuras vecinas y su rol:

- `PRUEBA` queda como sandbox tecnico y artefacto estatico listo para Vercel
- `BOPE 2026` queda como archivo/laboratorio de exploracion de BOPE con APIs
- `BOPE ARCHIVADO 2026-03-29` queda como respaldo doctrinal historico y no define arranque local

Regla de operacion:

- toda evolucion real de BOPE sale desde `BOPE VERSION DEFINITIVA`
- no se abre trabajo nuevo productivo en `PRUEBA` ni en `BOPE 2026`
- si una idea nacida en sandbox o laboratorio vale la pena, se porta al repo canonico

## Estado Vercel conocido

Estado verificado localmente en esta fecha:

- no existe `.vercel/project.json` en este repo
- no existe `vercel.json` en este repo
- el frontend `apps/bope-command-center/` esta preparado para apuntar a backend remoto mediante `BOPE_COMMAND_CENTER_API_URL`
- el backend `apps/bope-command-center-server/` expone `GET /api/healthz`

Conclusiones operativas:

- el repo esta listo para despliegue, pero el enlace formal con un proyecto Vercel no esta versionado localmente
- si existe un proyecto Vercel activo, hoy vive fuera del repo o no quedo persistido en disco
