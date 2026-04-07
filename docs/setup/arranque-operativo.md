# Arranque Operativo BOPE

Este documento define como abrir BOPE Visual Code y dejar a JOHN RAMBO en condiciones de mando sin improvisar contexto.

## Objetivo

- entrar al cuartel
- leer el estado canonico
- validar el entorno minimo
- lanzar a JOHN
- registrar el primer movimiento

## Secuencia corta

1. Abrir `BOPE VISUAL CODE` en VS Code.
2. Confirmar que existe `.env.local` y que contiene solo las credenciales ya adquiridas.
3. Leer en este orden:
   - `logs/MISION-ACTIVA.md`
   - `docs/architecture/john-flow.md`
   - `docs/architecture/bope-control-plane.md`
   - `logs/COMMS.log`
4. Abrir `docs/setup/checklist-cabina.md`.
5. Pegar en Codex el template de `docs/setup/template-sesion-codex.md`.
6. Ejecutar la respuesta de JOHN:
   - si resuelve solo, registrar `JOB` y `CIERRE`
   - si delega, registrar `JOB`, `HANDOFF` y luego `CIERRE`
7. Cerrar la iteracion en `logs/MEMORIA/ULTIMO-RESUMEN.md`.

## Dos formas de arranque

### A. Arranque doctrinal en Codex

Usar cuando quieres trabajar por sesion conversacional y darle la orden directa a JOHN.

1. Abrir `docs/setup/template-sesion-codex.md`.
2. Pegar el template en Codex.
3. Dar la orden operativa.

### B. Arranque local del runtime

Usar cuando quieres probar el esqueleto ejecutable del batallon sin depender del prompt manual.

1. Abrir una terminal en la raiz del repo.
2. Ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-bope.ps1
```

3. Si solo quieres imprimir el template de JOHN sin correr Python:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-bope.ps1 -PrintOnly
```

## Minimo para considerar que arranco

- `JOHN` ya leyo la mision activa
- existe `job_id`
- quedo asentada la decision de mando
- la evidencia esperada esta declarada
- el siguiente paso quedo escrito

## Regla

- Si falta contexto canonico, no se inventa: se lee.
- Si falta autoridad, no se avanza: se eleva.
- Si falta evidencia, no se cierra.
