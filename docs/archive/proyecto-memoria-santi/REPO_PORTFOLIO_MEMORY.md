# Memoria de Repositorio (Santiagoisper)

Origen: `Santiagoisper/Proyecto-Memoria-Santi/docs/REPO_PORTFOLIO_MEMORY.md`.

Actualizado: 2026-04-21
Objetivo: centralizar contexto operativo para que agentes entiendan rapido que repo usar, que no tocar y que patrones reutilizar.

## Mapa por rol

### CORE
- `BOPE_VERSION_DEFINITIVA`: canon operativo BOPE, doctrina + estructura principal.
- `bope-agents`: squad y bootstrap de agentes para Claude/Codex.
- `bope-war-room`: direccion de producto y especificaciones BOPE.
- `Cuentaspersonales`: workspace operativo personal en TypeScript.

### PRODUCT
- `Asistente-CRF`: Next.js + API unificada para flujo CRF/submissions/review.
- `innova-scoring`: app interna de scoring (client/server/shared, Express + React + DB).
- `Ichtys-Facturador-Exterior`: facturador exterior en Next.js + Neon.
- `portalcinmeconsultorios`: plataforma TS con e2e y estructura fullstack.
- `latamseg`: sitio web estatico.

### SUPPORT
- `BOPE_DOTFILES`: scripts de entorno y dotfiles.

### SANDBOX
- `BOPE-SANDBOX`: unico repo para pruebas y experimentos nuevos.

## Repos archivados (historico)
- `BOPE` (laboratorio API anterior)
- `PRUEBA`
- `PRUEBA2`
- `patient-services-app`
- `BOPE-VISUAL-CODE`
- `monday-learning-skill`

## Reglas de enrutamiento para agentes
1. Si la tarea afecta doctrina/operacion BOPE real, entrar por `BOPE_VERSION_DEFINITIVA`.
2. Si la tarea es exploratoria o incierta, usar `BOPE-SANDBOX` primero.
3. No revivir repos archivados para feature work nuevo; solo lectura/migracion puntual.
4. Si una prueba en sandbox funciona, portar al repo destino con commit limpio y trazable.

## Criterio de migracion (Sandbox -> Productivo)
- Debe tener objetivo claro, evidencia de prueba y rollback definido.
- Debe incluir impacto esperado en: seguridad, rendimiento y mantenibilidad.
- Debe entrar por PR o cambio auditable (sin copy-paste opaco).
