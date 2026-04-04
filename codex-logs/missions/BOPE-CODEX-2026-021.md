# BOPE-CODEX-2026-021

## Titulo

Consolidacion de repositorios y criterio de deploy

## Objetivo

- fijar una sola fuente de verdad para BOPE
- clasificar `PRUEBA` y `BOPE 2026` sin destruir material util
- dejar por escrito el estado conocido de GitHub y Vercel
- evitar que nuevas misiones productivas nazcan en repos ambiguos

## Archivos afectados

- `README.md`
- `REPOSITORIOS-Y-DEPLOY.md`
- `codex-logs/COMMS.log`
- `codex-logs/MISIONES.md`
- `codex-logs/missions/BOPE-CODEX-2026-021.md`

## Resultado

`BOPE VERSION DEFINITIVA` queda asentado como unico frente operativo real. `PRUEBA` queda clasificado como sandbox tecnico con artefacto estatico listo para deploy manual en Vercel. `BOPE 2026` queda clasificado como archivo/laboratorio de exploracion con APIs. Tambien queda asentado que no existe hoy un link local persistido a un proyecto Vercel especifico para el repo canonico.

## Efectivos desplegados

- `JOHN RAMBO`
- `WINSTON`

## Evidencia

- remoto GitHub canonico detectado en `BOPE VERSION DEFINITIVA`: `https://github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA.git`
- remoto GitHub detectado en `PRUEBA`: `https://github.com/Santiagoisper/PRUEBA.git`
- `BOPE 2026` no expone repo git propio en su raiz
- no existe `.vercel/project.json` ni `vercel.json` en `BOPE VERSION DEFINITIVA`, `PRUEBA` o `BOPE 2026`
- `PRUEBA/artifacts/bope-command-center/README.md` documenta deploy manual en Vercel para un frontend estatico
