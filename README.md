# BOPE - Batallon de Operaciones de Precision y Excelencia

Sistema multiagente para Claude Code y Codex. Un batallon de agentes especializados bajo cadena de mando militar para ejecutar misiones de desarrollo de software.

## Arranque rapido

### 1. Clonar el repo

```bash
git clone https://github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA.git
cd BOPE_VERSION_DEFINITIVA
```

### 2. Abrir Claude Code en la carpeta

```bash
claude
```

Claude Code carga `.claude/CLAUDE.md` automaticamente. El sistema de Claude queda activo.

### 3. Activar el batallon en Claude

Escribir en el chat:

```text
BOPE
```

John RAMBO toma el mando, pasa revista y lee los logs.

### 4. Dar la primera orden en Claude

```text
John, necesito [descripcion de la tarea]
```

### 5. Usar Codex en este repo

Codex no necesita cargar doctrina desde otro repositorio para arrancar.

Orden de activacion para Codex:

```text
BOPE ONLINE. JOHN RAMBO EN MANDO.
Activa BOPE VERSION DEFINITIVA en modo Codex.
Antes de actuar, toma como base CODEX.md, BOPE-CODEX-ADAPTACION.md, codex-logs/MISION-ACTIVA.md y codex-logs/COMMS.log.
Opera con economia operativa: no actives mas soldados de los necesarios.
Toda mision cerrada debe quedar registrada en codex-logs, versionada en git y subida a GitHub.
Mi orden inicial va dirigida a JOHN RAMBO.
```

`SICARIO | Locura` es el operativo especial para ejecucion total sin friccion dentro de la capa Codex.

## El batallon visible

| Soldado | Rol | Cuando actua |
|---|---|---|
| `JOHN RAMBO` | mando operativo | siempre |
| `PIXEL` | frontend | tareas de interfaz y UX |
| `FORGE` | backend | APIs, DB y backend |
| `HOUSE` | QA | validacion y auditoria |
| `CERBERUS` | seguridad | riesgo, accesos y secretos |
| `WINSTON` | cronista | registro y memoria |
| `NEXUS` | integracion | cruces entre capas |
| `MARCO AURELIO` | consejero | doctrina, medallas y evaluacion |
| `SICARIO | Locura` | operativo especial | maxima autonomia, sin friccion |

## Capas del sistema

### Claude

- bootstrap: `.claude/CLAUDE.md`
- estado: `logs/`
- agentes: `.claude/agents/`

### Codex

- bootstrap: `CODEX.md`
- adaptacion doctrinal: `BOPE-CODEX-ADAPTACION.md`
- estado: `codex-logs/`

## Regla operativa

- Claude y Codex comparten imagen visible del batallon.
- Codex no usa por defecto el repo madre `BOPE` como bootstrap.
- Toda mision cerrada en Codex debe quedar registrada, commiteada y subida a GitHub.
