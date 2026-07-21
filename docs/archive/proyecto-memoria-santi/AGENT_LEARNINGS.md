# Aprendizajes Reutilizables para Agentes

Origen: `Santiagoisper/Proyecto-Memoria-Santi/docs/AGENT_LEARNINGS.md`.

Actualizado: 2026-04-21

## Patrones tecnicos que ya funcionaron

### 1) Fullstack TS modular (innova-scoring)
- Separacion `client/`, `server/`, `shared/` reduce deuda y facilita pruebas.
- `shared/` como contrato evita drift entre frontend y backend.

### 2) Next.js con API unificada (Asistente-CRF)
- `app/api/*` simplifica despliegue y reduce friccion de integracion.
- Bueno para productos que requieren velocidad de iteracion.

### 3) Prompt+Memoria con persistencia (Proyecto-Memoria-Santi)
- Patrón util: memoria estructurada (`hechos`, `principios`, `sintesis`) + historial de mensajes.
- Fallback local (`localStorage`) evita bloqueo cuando DB no esta disponible.

### 4) Regla operativa de repos
- Sandbox unico (`BOPE-SANDBOX`) evita fragmentacion y repos clonados sin control.
- Repos archivados = historico, no desarrollo activo.

## Riesgos recurrentes detectados
- Duplicacion de repos sandbox (ya mitigado).
- Mezcla de material doctrinal y experimental en el mismo frente.
- Repos sin descripcion clara (ya mitigado con prefijos por rol).

## Protocolo recomendado para agentes
1. Clasificar tarea: CORE / PRODUCT / SANDBOX.
2. Confirmar repo destino antes de editar.
3. Si hay incertidumbre tecnica, prototipar en `BOPE-SANDBOX`.
4. Solo promover a productivo con evidencia verificable.
5. Registrar decision y motivo de enrutamiento.

## Mensaje operativo para agentes (copy/paste)
"Usa este repositorio como memoria de decisiones y patrones. Antes de empezar una tarea, consulta el mapa de repos y valida si corresponde CORE, PRODUCT o SANDBOX. No abras trabajo nuevo en repos archivados."
