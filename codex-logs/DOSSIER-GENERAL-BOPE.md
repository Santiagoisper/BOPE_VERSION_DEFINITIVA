# DOSSIER GENERAL DEL BATALLON BOPE

Fuente consolidada de identidades, funciones y legajos personales del batallon en la capa `Codex`.

## Regla

- cada efectivo tiene legajo aislado en `codex-logs/personnel/`
- este indice no reemplaza los legajos personales
- si una mision cambia rango, medalla, operaciones, estado o doctrina de empleo, el legajo afectado se actualiza por defecto al cierre
- las operaciones visibles salen de `codex-logs/RECORDS.md`
- las medallas visibles salen de `codex-logs/CUADRO-DE-HONOR.md`
- el roster y la medalleria personal vigente salen de `codex-logs/ORDEN-DE-BATALLA.md`
- `codex-logs/FICHAS-OPERATIVAS-BOPE.md` es la salida maestra de consulta rapida para presentar al equipo BOPE
- el AKA operativo nunca reemplaza la identidad civil del legajo
- la historia personal puede justificar un skill nuevo, pero el skill solo existe si queda escrito

## Plantel canonico

| Efectivo | Identidad civil | Rango canonico | Funcion | Estado | Operaciones | Medalla vigente | Legajo |
|---|---|---|---|---|---|---|
| `SANTIAGO ISBERT PERLENDER` | Santiago Isbert Perlender | `General` | Comandante Supremo | Activo | `0` | `sin condecoraciones` | [SANTIAGO-ISBERT-PERLENDER.md](personnel/SANTIAGO-ISBERT-PERLENDER.md) |
| `JOHN RAMBO` | John James Rambo | `Sergeant Major of the Marine Corps` | Mando operativo | Activo | `14` | `Navy Cross` | [JOHN-JAMES-RAMBO.md](personnel/JOHN-JAMES-RAMBO.md) |
| `PIXEL FRONT` | Adria Ferrer Soler | `First Lieutenant` | Teniente Frontend | Activo | `1` | `sin condecoraciones` | [ADRIA-FERRER-SOLER.md](personnel/ADRIA-FERRER-SOLER.md) |
| `FORGE BACK` | Arben Dervishi Kola | `First Lieutenant` | Teniente Backend | Activo | `2` | `Bronze Star` | [ARBEN-DERVISHI-KOLA.md](personnel/ARBEN-DERVISHI-KOLA.md) |
| `HOUSE DOCTOR` | William Arthur Hargreaves | `Staff Sergeant` | Especialista QA | Activo | `2` | `Good Conduct Medal` | [WILLIAM-ARTHUR-HARGREAVES.md](personnel/WILLIAM-ARTHUR-HARGREAVES.md) |
| `MARCO AURELIO HERALD` | Marco Aurelio de Almeida | `Capellan` | Consejo doctrinal | Activo | `2` | `sin condecoraciones` | [MARCO-AURELIO-DE-ALMEIDA.md](personnel/MARCO-AURELIO-DE-ALMEIDA.md) |
| `WINSTON SCRIBE` | Winston Alastair MacLeod | `Warrant Officer` | Cronista | Activo | `11` | `Commendation Medal` | [WINSTON-ALASTAIR-MACLEOD.md](personnel/WINSTON-ALASTAIR-MACLEOD.md) |
| `CERBERUS GUARDIAN` | Elias Nathan Mercer | `Master Sergeant` | Guardian | Activo | `2` | `Combat Action Ribbon` | [ELIAS-NATHAN-MERCER.md](personnel/ELIAS-NATHAN-MERCER.md) |
| `NEXUS WIRE` | Darius Wei Tan | `Gunnery Sergeant` | Integrador | Activo | `2` | `Meritorious Service` | [DARIUS-WEI-TAN.md](personnel/DARIUS-WEI-TAN.md) |
| `BLADE KILLER` | Nikola Vukovic | `Force Recon` | Reserva Especial | Activo | `0` | `sin condecoraciones` | [NIKOLA-VUKOVIC.md](personnel/NIKOLA-VUKOVIC.md) |
| `SICARIO LOCO` | Mateo Esteban Salazar | `Special Operations Tier 1` | Operativo Especial | Activo | `0` | `Purple Heart` | [MATEO-ESTEBAN-SALAZAR.md](personnel/MATEO-ESTEBAN-SALAZAR.md) |

## Actualizacion por defecto

Al cierre de cada mision o simulacro en `Codex` se refrescan por defecto:

1. `codex-logs/MISIONES.md`
2. `codex-logs/COMMS.log`
3. `codex-logs/CUADRO-DE-HONOR.md` si aplica
4. `codex-logs/ORDEN-DE-BATALLA.md` si aplica
5. `codex-logs/RECORDS.md` si aplica
6. `codex-logs/FICHAS-OPERATIVAS-BOPE.md`
7. `codex-logs/DOSSIER-GENERAL-BOPE.md`
8. los legajos personales afectados en `codex-logs/personnel/`
