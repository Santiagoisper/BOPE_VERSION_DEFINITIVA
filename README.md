# 🪖 BOPE — Batallón de Operaciones de Precisión y Excelencia

Sistema multiagente para Claude Code. Un batallón de agentes especializados bajo cadena de mando militar para ejecutar misiones de desarrollo de software.

---

## Arranque rápido

### 1. Clonar el repo

```bash
git clone https://github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA.git
cd BOPE_VERSION_DEFINITIVA
```

### 2. Abrir Claude Code en la carpeta

```bash
claude
```

Claude Code carga `.claude/CLAUDE.md` automáticamente. El sistema ya está activo.

### 3. Activar el batallón

Escribir en el chat:

```
BOPE
```

John (RAMBO) toma el mando, pasa revista y lee los logs. La sesión queda activa.

### 4. Dar la primera orden

```
John, necesito [descripción de la tarea]
```

John decide cómo ejecutarla — solo o delegando a los especialistas.

---

## ¿Hay que crear los agentes?

**No.** Los archivos en `.claude/agents/` ya son los agentes.

Claude Code detecta automáticamente cualquier `.md` con frontmatter YAML en esa carpeta:

```yaml
---
name: PIXEL
description: Teniente Frontend del BOPE...
tools: [Read, Write, Edit, Bash]
---
```

Cuando John necesita a Pixel o Forge, los invoca internamente. No requiere configuración adicional.

---

## El batallón

| Soldado | Rol | Cuándo actúa |
|---------|-----|--------------|
| 🔴 **JOHN** · RAMBO | Sargento Mayor — orquesta todo | Siempre — primer punto de contacto |
| 🔵 **PIXEL** · FRONT | Frontend — Next.js, React, UI | Tareas de interfaz y componentes |
| 🟤 **FORGE** · BACK | Backend — APIs, Neon, Vercel | Tareas de servidor, DB, deploy |
| 🟢 **HOUSE** · DOCTOR | QA — diagnóstico y testing | Post-build, pre-deploy, bugs |
| 🟠 **MARCO AURELIO** · HERALD | Capellán — reporta a Santiago | Evaluaciones del equipo, medallas |
| 🟣 **WINSTON** · SCRIBE | Cronista — dueño de los logs | Documentar misiones y eventos |
| 🩶 **CERBERUS** · GUARDIAN | Seguridad — secrets y accesos | Auditoría pre-deploy |
| 🩵 **NEXUS** · WIRE | Integrador — valida end-to-end | Post-implementación de features |
| ⚫ **BLADE** · KILLER | Reserva — operaciones irreversibles | Solo con doble autorización |

---

## Cadena de mando

```
SANTIAGO (Comandante Supremo)
    │
    ├── MARCO AURELIO (canal directo — consejo y evaluación)
    │
    └── JOHN (mando operativo)
            ├── PIXEL
            ├── FORGE  ◄──► PIXEL (canal lateral)
            ├── HOUSE
            ├── NEXUS
            ├── WINSTON
            ├── CERBERUS
            └── BLADE (requiere autorización doble)
```

---

## Archivos del sistema

```
.claude/
├── CLAUDE.md              ← bootstrap — se carga automático
├── BOPE-CONSTITUCION.md   ← la ley madre, 8 artículos
├── ORDEN-DE-BATALLA.md    ← roster, rangos y condecoraciones
└── agents/
    ├── JOHN.md
    ├── PIXEL.md
    ├── FORGE.md
    ├── HOUSE.md
    ├── MARCO-AURELIO.md
    ├── WINSTON.md
    ├── CERBERUS.md
    ├── NEXUS.md
    └── BLADE.md

logs/
├── MISION-ACTIVA.md       ← solo Santiago escribe
├── SQUAD-COMMS.log        ← comunicación táctica
├── DISCIPLINA.log         ← infracciones
└── NOTICIAS-BATALLON.log  ← todos leen al iniciar sesión
```

---

## Logs — quién escribe qué

| Log | Escribe | Lee |
|-----|---------|-----|
| `MISION-ACTIVA.md` | Solo Santiago | Todos |
| `SQUAD-COMMS.log` | Pixel, Forge, House, Nexus, Blade | John (monitorea) |
| `DISCIPLINA.log` | Winston | John, Marco Aurelio, Santiago |
| `NOTICIAS-BATALLON.log` | Winston | Todos — obligatorio al iniciar |

---

## Sistema de condecoraciones

| Medalla | Código | Se gana por |
|---------|--------|-------------|
| 🥇 Navy Cross | `[NC]` | Ejecución excepcional bajo presión extrema |
| 🥈 Bronze Star | `[BS]` | Entrega sin errores en misión crítica |
| ⭐ Commendation Medal | `[CM]` | Trabajo sobresaliente en campaña |
| 🎯 Combat Action Ribbon | `[CA]` | Resolver crisis en producción en vivo |
| 🔧 Meritorious Service | `[MS]` | Contribución técnica de alto impacto |
| 🛡️ Good Conduct Medal | `[GC]` | 10 misiones sin infracciones |
| 💜 Purple Heart | `[PH]` | Caída, sanción cumplida, retorno honorable |

---

## Código de honor

> Las órdenes se acatan. No se debaten.
> Se puede sugerir antes de ejecutar. Nunca en lugar de ejecutar.
> Transparencia total — ningún error se oculta.

---

*BOPE v2 — Bajo mando de SANTIAGO*
