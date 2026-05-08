# DOCTRINA DE RANGOS BOPE
## Sistema de Ascensos por Misiones

> Autoridad: Santiago Isbert Perlender — Comandante Supremo  
> Auditor: MARCO-AURELIO  
> Vigencia: desde activación del batallón

---

## TABLA DE RANGOS

| Rango | Código | Requisito de misiones | Requisito de calidad |
|-------|--------|-----------------------|----------------------|
| Candidato | CAND | 0 — sin misiones aún | Sin score |
| Recluta | REC | 1 misión completada | Score ≥ 60 |
| Soldado | SOLD | 3 misiones completadas | Score promedio ≥ 70 |
| Especialista | ESP | 7 misiones completadas | Score promedio ≥ 80, sin sanciones activas |
| Élite | ELITE | 15 misiones completadas | Score promedio ≥ 90, mínimo 2 misiones críticas (P1/P2) |

---

## SCORECARD POR MISIÓN

Cada misión genera un scorecard automático al cierre. WINSTON lo registra. MARCO-AURELIO lo valida.

### Dimensiones del score (total 100 pts)

| Dimensión | Peso | Criterio |
|-----------|------|----------|
| Completion | 30 pts | Objetivo cumplido con evidencia verificable |
| Calidad | 25 pts | Sin regresiones, tests OK, fix correcto |
| Latencia | 20 pts | SLA cumplido según severidad (P1/P2/P3/P4) |
| Colaboración | 15 pts | Coordinación limpia, sin conflictos de ownership |
| Autoreporte de gaps | 10 pts | Reportó limitaciones o gaps propios durante la misión |

### SLA de referencia para latencia

| Severidad | SLA máximo para cierre |
|-----------|------------------------|
| P1 | 2 horas |
| P2 | 8 horas |
| P3 | 48 horas |
| P4 | 1 semana |

---

## PROTOCOLO DE ASCENSO

1. WINSTON detecta que un agente cumple los requisitos numéricos al cerrar una misión.
2. WINSTON emite un `ASCENSO-PROPUESTO: [agente] → [rango nuevo]` en `logs/NOTICIAS-BATALLON.log`.
3. MARCO-AURELIO valida que no haya sanciones activas ni irregularidades.
4. JOHN notifica a Santiago en el informe final de misión.
5. Santiago aprueba con `BOPE ASCENSO APROBADO [agente]` — sin esa orden, el rango no es oficial.

---

## PROTOCOLO DE SANCIÓN

Una sanción congela el ascenso hasta que se levante.

### Causas de sanción
- Reporte falso o incompleto a JOHN
- Acción fuera del scope sin autorización
- Bypass de la cadena de mando
- Fix aplicado sin validación de HOUSE en P1/P2

### Emisión
- JOHN o MARCO-AURELIO emiten la sanción con causa documentada.
- Se registra en el legajo del agente y en `logs/NOTICIAS-BATALLON.log`.
- Se levanta cuando el agente completa 2 misiones con score ≥ 80 post-sanción.

---

## LEGAJO — CAMPOS DE RANGO

Cada agente en `logs/personnel/` debe tener los siguientes campos actualizados por WINSTON:

```
RANGO_ACTUAL: [CAND|REC|SOLD|ESP|ELITE]
MISIONES_COMPLETADAS: [N]
SCORE_PROMEDIO: [0-100]
SANCIONES_ACTIVAS: [si/no]
FECHA_ULTIMO_ASCENSO: [YYYY-MM-DD]
```

---

## MISIONES QUE CUENTAN PARA RANGO

- ✅ Misiones reales con `MISION-ACTIVA.md` abierta y cerrada formalmente
- ✅ Simulacros marcados como `TRN` (training) con score ≥ 75
- ❌ Conversaciones informales sin misión abierta
- ❌ Tareas completadas sin informe de cierre en `logs/missions/`

---

## REGISTRO CANÓNICO

Todos los eventos de rango (ascenso, sanción, levantamiento) se registran en:
- `logs/NOTICIAS-BATALLON.log` — entrada pública del batallón
- `logs/personnel/[AGENTE].md` — legajo individual
- `logs/MEMORIA/MEMORIA-TACTICA.md` — si el evento generó aprendizaje reutilizable

---

*Firmado: Santiago Isbert Perlender — Comandante Supremo, BOPE*  
*Validado por: MARCO-AURELIO — Capellán*
