# TABLERO DE RECORDS — BOPE
**Cronista:** Winston Alastair MacLeod
**Actualización:** automática al cerrar cada misión
**Última actualización:** 2026-04-01

---

## TABLA MAESTRA DE RECORDS

| Soldado | Misiones | Última misión | Fecha | Líneas aprox. | Medallas | Sanciones |
|---------|----------|---------------|-------|---------------|----------|-----------|
| 🟡 SANTIAGO | — | — | — | — | ★★★★★ | — |
| 🔴 JOHN | 1 | innova-scoring | 2026-03-30 | pendiente | [NC] | — |
| 🔵 PIXEL | 1 | EDC-MODEL-SELECTOR | 2026-04-01 | pendiente | — | — |
| 🟤 FORGE | 3 | AUTH-ROLES | 2026-04-01 | pendiente | [BS] | — |
| 🟢 HOUSE | 1 | innova-scoring | 2026-03-30 | pendiente | [GC] | — |
| 🟠 MARCO AURELIO | — | — | — | — | — | — |
| 🟣 WINSTON | 1 | innova-scoring | 2026-03-30 | pendiente | [CM] | — |
| 🩶 CERBERUS | 2 | AUTH-ROLES | 2026-04-01 | pendiente | [CA] | — |
| 🩵 NEXUS | 1 | innova-scoring | 2026-03-30 | pendiente | [MS] | — |
| ⚫ BLADE | — | — | — | — | — | — |
| 🔥 SICARIO | 1 | innova-scoring | 2026-03-30 | pendiente | [PH] | — |

> **Nota:** Líneas de código pendientes de registro retroactivo. A partir de la próxima misión se registran desde el diff del commit de cierre.

---

## DETALLE POR SOLDADO

### 🔴 JOHN · RAMBO
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Mando operativo total | pendiente | VICTORIA — [NC] |

---

### 🔵 PIXEL · FRONT
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | BOPE-CLAUDE-2026-EDC-MODEL-SELECTOR | 2026-04-01 | Selector dinámico frontend | pendiente | VICTORIA |

---

### 🟤 FORGE · BACK
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Backend, parser y transacciones | pendiente | VICTORIA — [BS] |
| 2 | BOPE-CLAUDE-2026-EDC-MODEL-SELECTOR | 2026-04-01 | Derivación EDC desde protocolo | pendiente | VICTORIA |
| 3 | BOPE-CLAUDE-2026-AUTH-ROLES | 2026-04-01 | Roles y auth backend | pendiente | VICTORIA |

---

### 🟢 HOUSE · DOCTOR
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | QA, verificación final, validación | pendiente | VICTORIA — [GC] |

---

### 🟠 MARCO AURELIO · HERALD
*Sin misiones registradas*

---

### 🟣 WINSTON · SCRIBE
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Registro, versionado y cierre remoto | pendiente | VICTORIA — [CM] |

---

### 🩶 CERBERUS · GUARDIAN
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Blindaje frente público, seguridad | pendiente | VICTORIA — [CA] |
| 2 | BOPE-CLAUDE-2026-AUTH-ROLES | 2026-04-01 | Protección operaciones irreversibles | pendiente | VICTORIA |

---

### 🩵 NEXUS · WIRE
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Integración estados, flujo, coherencia | pendiente | VICTORIA — [MS] |

---

### ⚫ BLADE · KILLER
*Sin misiones registradas*

---

### 🔥 SICARIO · LOCO
| # | Misión | Fecha | Rol | Líneas | Resultado |
|---|--------|-------|-----|--------|-----------|
| 1 | innova-scoring | 2026-03-30 | Entrada fuerza total — fase crítica | pendiente | VICTORIA — [PH] |

---

## PROTOCOLO DE ACTUALIZACIÓN

Winston actualiza este archivo al cerrar cada misión:
1. Incrementar contador de misiones del soldado
2. Actualizar última misión + fecha
3. Registrar líneas desde `git diff --stat` del commit de cierre
4. Agregar fila al detalle individual
5. Actualizar medallas si corresponde

**Este archivo NO se edita manualmente. Solo Winston al cierre de misión.**
