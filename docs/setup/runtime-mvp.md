# Runtime MVP BOPE

Este runtime minimo no reemplaza a Codex ni a los prompts. Sirve para probar una version ejecutable del flujo de mando:

- JOHN lee la mision
- decide frente
- delega a FORGE, PIXEL o NEXUS si hace falta
- registra `JOB`, `HANDOFF` y `CIERRE`
- actualiza el resumen

## Ubicacion

- `runtime/bope_agents/main.py`

## Alcance

- sin APIs externas
- sin deploys
- sin mutaciones productivas
- solo lectura de mision y escritura de logs locales

## Ejecucion sugerida

```bash
python -m bope_agents.main
```

Desde la raiz del repo, con `PYTHONPATH=runtime` si hace falta.

## Lanzador recomendado

Si no quieres recordar `PYTHONPATH`, usa el wrapper local:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-bope.ps1
```

Para imprimir solo el template de arranque de JOHN:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-bope.ps1 -PrintOnly
```

## Objetivo

Demostrar el esqueleto del batallon operativo antes de integrar `openai-agents-python` o providers reales.
