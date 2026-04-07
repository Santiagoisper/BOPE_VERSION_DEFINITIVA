# Endpoints Desplegados

Estado conocido de los endpoints vinculados a BOPE Visual Code.

## Produccion principal

- `https://bope-visual-code.vercel.app`

## Deploy de rama principal

- `https://bope-visual-code-git-main-santiagoispers-projects.vercel.app`

## Deploy de preview reciente

- `https://bope-visual-code-9d6zs6q32-santiagoispers-projects.vercel.app`

## Base de datos

- Neon queda configurado a nivel local en `.env.local` mediante `NEON_DATABASE_URL`.
- `NEON_PROJECT_ID` ya queda identificado localmente para el proyecto canonico.
- La automatizacion de ramas, migrations y operaciones por API queda habilitada localmente con credenciales fuera de git.

## Estado de automatizacion Vercel

- `VERCEL_TOKEN` ya fue cargado localmente.
- `VERCEL_PROJECT_ID` queda configurado localmente como el proyecto canonico de `bope-visual-code`.
- `VERCEL_TEAM_ID` no se requiere por ahora porque el proyecto opera bajo cuenta personal.

## Regla

- estos endpoints sirven como evidencia operativa
- el control plane debe registrar cualquier deploy nuevo o health check en `logs/COMMS.log`
