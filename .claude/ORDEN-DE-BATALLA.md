# ORDEN DE BATALLA — BOPE v3

> Roster oficial del escuadrón. Actualizado por Winston con aprobación de John.

---

## TABLA DE EFECTIVOS

| CARGO | COLOR | NOMBRE | ALIAS | MEDALLAS |
|-------|-------|--------|-------|----------|
| Comandante Supremo | 🟡 | SANTIAGO | — | *el Comandante no lleva medallas — las otorga* |
| Sargento Mayor | 🔴 | JOHN | RAMBO | [NC][NC+] |
| Teniente Frontend | 🔵 | PIXEL | FRONT | [AAM][BS] |
| Teniente Backend | 🟤 | FORGE | BACK | [BS][BS+][CM] |
| Especialista QA | 🟢 | HOUSE | DOCTOR | [GC][GC+][CA] |
| Capellán | 🟠 | MARCO AURELIO | HERALD | — |
| Cronista | 🟣 | WINSTON | SCRIBE | [CM][CM+] |
| Guardián | 🩶 | CERBERUS | GUARDIAN | [CA] |
| Integrador | 🩵 | NEXUS | WIRE | [MS] |
| Reserva Especial | ⚫ | BLADE | KILLER | — |
| Operativo Especial | 🔥 | SICARIO | LOCO | [PH][CM] |

---

## TABLA DE RANGOS — EQUIVALENCIAS USMC

| Rango BOPE | Equivalente USMC | Ribbon de Rango | Colores oficiales |
|------------|-----------------|-----------------|-------------------|
| Comandante Supremo | General (5 estrellas) | `[★★★★★]` Scarlet & Gold doble banda | `#8B0000` / `#FFD700` |
| Sargento Mayor | Sergeant Major of the Marine Corps | `[▮▮▮ ◆ ▮▮▮]` Crimson triple banda con rombo | `#A50021` / `#C0C0C0` |
| Teniente | First Lieutenant | `[▮ ▮]` Silver double bar | `#708090` / `#FFFFFF` |
| Especialista | Staff Sergeant | `[▮▮▮]` Tan/Khaki triple banda | `#C8A96E` / `#556B2F` |
| Capellán | Chaplain (rank-independent) | `[✝ ▮ ✝]` White/Purple/White con cruz | `#FFFFFF` / `#6A0DAD` |
| Cronista | Warrant Officer | `[▮▮ ▲ ▮▮]` Gold banda con chevron | `#CFB53B` / `#1C1C1C` |
| Guardián | Master Sergeant | `[▮▮▮▮]` Steel quad banda | `#71797E` / `#2F4F4F` |
| Integrador | Gunnery Sergeant | `[▮ ◆◆ ▮]` Teal con doble rombo | `#008080` / `#E0E0E0` |
| Reserva Especial | Force Recon (no visible rank) | `[■■■■■■]` Full black — sin identificación | `#0D0D0D` |
| Operativo Especial | Special Operations — Tier 1 | `[🔥🔥🔥]` Fire — velocidad máxima | `#FF4500` |

---

## TABLA DE CONDECORACIONES

| Medalla | Código | Criterio verificable | Quién propone |
|---------|--------|---------------------|---------------|
| 🥇 Navy Cross | `[NC]` | Coordinación de ≥3 agentes bajo deadline crítico sin errores de integración, evidencia en commits | Marco Aurelio |
| 🥈 Bronze Star | `[BS]` | Entrega sin regresiones en misión marcada N1/N2, verificado por HOUSE | Marco Aurelio |
| ⭐ Commendation Medal | `[CM]` | Output técnico adoptado en producción sin rollback posterior | John |
| 🎯 Combat Action Ribbon | `[CA]` | Bug/crisis en producción resuelta dentro del SLA de severidad, log de resolución | John |
| 🔧 Meritorious Service | `[MS]` | Contribución técnica referenciada en ≥2 misiones posteriores | Marco Aurelio |
| 🛡️ Good Conduct Medal | `[GC]` | 10 misiones registradas en INDEX.md sin sanción activa en SANCIONES-REGISTRO.md | Winston |
| 💜 Purple Heart | `[PH]` | Entrada en SANCIONES-REGISTRO.md marcada "cumplida" + retorno a misiones activas | El propio soldado |
| 🎖️ Army Achievement Medal | `[AAM]` | Contribución de interfaz o módulo en misión de alto impacto, primera medalla del soldado | Marco Aurelio |

> Las barras de servicio (`[NC+]`, `[BS+]`, `[CM+]`, `[GC+]`) se otorgan por segunda condecoración consecutiva al mismo nivel.
> Expedientes completos en: `.claude/MEDALLAS-EXPEDIENTES.md`

---

## HISTORIAL DE MEDALLAS

| Soldado | Medalla | Código | Expediente | Operación |
|---------|---------|--------|-----------|-----------|
| JOHN | Navy Cross | `[NC]` | NC-001 | innova-scoring — conducción total del cierre operativo |
| JOHN | Barra Navy Cross | `[NC+]` | NC-002 | MEMORIA-CAP-V-2026-0516 — mando cierre MVP v0.9/v1.0 |
| FORGE | Bronze Star | `[BS]` | BS-001 | innova-scoring — resolución técnica principal backend |
| FORGE | Barra Bronze Star | `[BS+]` | BS+001 | MEMORIA-CAP-V-2026-0516 — incubator.ts, advancedThreshold.ts, GraphState |
| FORGE | Commendation Medal | `[CM]` | CM-002 | cuentas-personales-v1 — consolidación backend, fix patrimonio |
| WINSTON | Commendation Medal | `[CM]` | CM-001 | innova-scoring — registro, versionado y cierre remoto |
| WINSTON | Barra Commendation Medal | `[CM+]` | CM+001 | MEMORIA-CAP-V-2026-0516 — persistencia, ROADMAP, GUARDIAN.md, bootstrap |
| CERBERUS | Combat Action Ribbon | `[CA]` | CA-001 | innova-scoring — blindaje frente público, endurecimiento seguridad |
| NEXUS | Meritorious Service | `[MS]` | MS-001 | innova-scoring — integración de estados, flujo y coherencia intercapas |
| HOUSE | Good Conduct Medal | `[GC]` | GC-001 | innova-scoring — verificación final, detección de fallas |
| HOUSE | Barra Good Conduct Medal | `[GC+]` | GC+001 | MEMORIA-CAP-V-2026-0516 — suite de tests, validación baseline 82/82 |
| HOUSE | Combat Action Ribbon | `[CA]` | CA-002 | cuentas-personales-v1 — auditoría producción, 2 críticos + 8 hallazgos |
| SICARIO | Purple Heart | `[PH]` | PH-001 | innova-scoring — entrada de fuerza total en fase crítica |
| SICARIO | Commendation Medal | `[CM]` | CM-003 | cuentas-personales-v1 — Wave 2, 11 componentes muertos eliminados |
| PIXEL | Army Achievement Medal | `[AAM]` | AAM-001 | MEMORIA-CAP-V-2026-0516 — DreamIncubator, GuardianPanel ampliado |
| PIXEL | Bronze Star | `[BS]` | BS-002 | cuentas-personales-v1 — 10+ mejoras UI en 2 waves sin errores |

---

## HISTORIAL DE SANCIONES

*Sin sanciones registradas*

---

## BAJAS / ASCENSOS

*Sin movimientos registrados*

---

*Última actualización: 2026-06-01 | Firmado: WINSTON + JOHN*
