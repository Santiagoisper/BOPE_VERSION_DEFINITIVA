# PROTOCOLO DE SINCRONIZACIÓN INTERCAPAS — CAPA CLAUDE
## Réplica canónica de BOPE-CODEX-2026-010

---

## PRINCIPIO FUNDAMENTAL

Codex, Claude y Gemini operan como capas separadas del mismo batallón.
Cada capa tiene su propia fuente canónica de estado y registro.
Ningún hecho se considera compartido por reflejo entre capas.

---

## FUENTES CANÓNICAS POR CAPA

| Capa | Fuente canónica |
|------|----------------|
| Codex | `codex-logs/` |
| Claude | `logs/` |
| Gemini | `gemini-logs/` |

---

## REGLAS PARA LA CAPA CLAUDE

- Claude **nunca** escribe en `codex-logs/` ni en `gemini-logs/`
- Claude solo deja constancia de: origen, necesidad de réplica y estado local de sincronización
- Si un hecho de otra capa debe existir en Claude, Claude lo replica en `logs/`
- Si no está escrito en `logs/`, no existe en Claude

---

## CAPA LÍDER

- La capa que ejecutó la misión actúa como **capa líder** del hecho
- La capa líder fija: id, fecha, resultado, responsables y resumen canónico a replicar
- Si hay conflicto entre capas, manda la capa líder hasta nueva orden de SANTIAGO

---

## PROTOCOLO DE RÉPLICA CANÓNICA

```
1. Cerrar la misión local con evidencia completa en logs/
2. Marcar en logs/ el hecho que requiere réplica canónica
3. Registrar origen, id original y resumen canónico
4. Esperar constancia escrita de cada capa destino en su propia memoria
5. Considerar sincronización completa solo cuando cada capa destino
   deje constancia escrita
```

---

## FORMATO MÍNIMO DE RÉPLICA FIEL

```
ORIGEN:             [capa que generó el hecho]
ID ORIGINAL:        [id canónico de la misión o hecho]
FECHA:              [fecha del hecho original]
RESUMEN CANÓNICO:   [descripción fiel sin adaptación]
IMPACTO:            [medallas / sanciones / cambio doctrinal — si aplica]
ESTADO:             replicado fiel
FIRMA LOCAL:        [JOHN + WINSTON]
```

---

## RIESGOS DOCUMENTADOS

| Riesgo | Descripción |
|--------|-------------|
| Divergencia entre capas | Una capa tiene estado diferente sobre el mismo hecho |
| Doble verdad | Dos versiones del mismo hecho coexisten sin capa líder definida |
| Contaminación doctrinal | Una capa escribe en los logs de otra |
| Cierre falso | Una misión se marca cerrada cuando solo una capa fue actualizada |

---

## QUÉ HECHOS REQUIEREN RÉPLICA INTERCAPAS

- Misiones que afectan al batallón como unidad
- Medallas adjudicadas por SANTIAGO
- Sanciones registradas por WINSTON
- Cambios doctrinales aprobados por SANTIAGO

---

*Origen canónico: BOPE-CODEX-2026-010*
*Replicado fiel en capa Claude: 2026-03-31*
*Firmado: JOHN + WINSTON*
