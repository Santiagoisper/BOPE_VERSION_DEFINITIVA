# BOPE Command Center Server

Backend remoto de Fase 3.1 para `bope-command-center`.

## Realidad operativa

- `BOPE` es el entorno y proyecto operativo.
- La base fisica real en Neon puede no llamarse `BOPE`.
- Al 3 de abril de 2026, la conexion validada opero contra una base fisica llamada `neondb`.
- La aplicacion no depende del nombre logico `BOPE` dentro de Neon; depende de la `connection string` real.

## Arquitectura

- Servidor HTTP nativo en Node.
- Persistencia central en Postgres Neon.
- Migraciones SQL reproducibles en `db/migrations/`.
- Bootstrap inicial desde datasets historicos del frontend canonico.
- Sesion central por cookie `HttpOnly`.
- Auditoria central, presupuesto y proveedores persistidos en base real.

## Variables de entorno

- `BOPE_COMMAND_CENTER_DATABASE_URL`
  Connection string real de Postgres. Debe apuntar a la base fisica existente en Neon.
- `BOPE_COMMAND_CENTER_DATABASE_SSL`
  `true` para Neon.
- `BOPE_COMMAND_CENTER_SERVER_PORT`
  Puerto HTTP del backend.

Referencia local: `.env.example`

## Esquema principal

- `bope_agents`
- `bope_agent_performance`
- `bope_missions`
- `bope_mission_events`
- `bope_medals`
- `bope_sanctions`
- `bope_budget_policy`
- `bope_providers`
- `bope_provider_configs`
- `bope_tools`
- `bope_direct_orders`
- `bope_budget_alerts`
- `bope_audit_logs`
- `bope_auth_config`
- `bope_sessions`
- `bope_meta`

## Providers preparados

- `codex` y `claude` quedan en modo `disabled`
- `enabled=false`
- `killSwitchActive=true`
- limites mensuales y anuales alineados al presupuesto del proveedor
- trazabilidad reforzada via `traceLevel=verbose`

## Comandos

```bash
pnpm --dir apps/bope-command-center-server typecheck
pnpm --dir apps/bope-command-center-server build
pnpm --dir apps/bope-command-center-server db:migrate
pnpm --dir apps/bope-command-center-server start
```

### Si “no levanta” en localhost

1. **Node:** 18+ (recomendado 20+). Ejecutá `node -v`.
2. **`.env`:** copiá `.env.example` → `.env` en esta carpeta y completá `BOPE_COMMAND_CENTER_DATABASE_URL` y `JWT_SECRET`.  
   En PowerShell: `Copy-Item .env.example .env -Force` (desde `apps/bope-command-center-server`).  
   El servidor carga ese `.env` aunque ejecutes Node con otro directorio de trabajo.
3. **Postgres:** tiene que estar accesible en la URL del paso 2 (local o Neon). Sin DB el proceso muere al iniciar (migraciones + store).
4. **Orden:** `pnpm install` en la raíz del monorepo, luego `build`, opcional `db:migrate`, luego `start` o `start:local`.
5. **UI:** en otra terminal, `pnpm --dir apps/bope-command-center dev` — la UI usa el puerto del `PORT` de Vite (por defecto **3000**) y proxifica `/api` al backend (**3100**).

## Checklist Neon

1. Confirmar la `connection string` real de Neon.
2. Confirmar el nombre de la base fisica incluida en esa URL.
3. Copiar `.env.example` a `.env`.
4. Cargar `BOPE_COMMAND_CENTER_DATABASE_URL` con la URL real validada.
5. Definir `BOPE_COMMAND_CENTER_DATABASE_SSL=true`.
6. Ejecutar `pnpm --dir apps/bope-command-center-server db:migrate`.
7. Levantar backend con `pnpm --dir apps/bope-command-center-server start`.
8. Verificar `GET /api/healthz`.
9. Verificar `GET /api/bootstrap-status`.

## Checklist Backend

1. `pnpm --dir apps/bope-command-center-server typecheck`
2. `pnpm --dir apps/bope-command-center-server build`
3. `pnpm --dir apps/bope-command-center-server db:migrate`
4. `pnpm --dir apps/bope-command-center-server start`
5. Verificar bootstrap o login.
6. Verificar lectura de estado.
7. Verificar alta de mision.
8. Verificar ajuste de presupuesto.
9. Verificar auditoria persistida.

## Estado de Fase 3.1

- el backend ya no depende de `data/command-center.json`
- la fuente de verdad es Postgres real
- Neon debe tratarse como infraestructura fisica, no como nombre logico de entorno
- `BOPE` queda normalizado como nombre operativo del proyecto
- los providers siguen bloqueados y no se ejecutan llamadas reales

## Antes de Fase 4

1. Reducir latencia de login y mutaciones evitando la reescritura completa del store.
2. Unificar puerto operativo del backend.
3. Mover la configuracion SSL a `verify-full` cuando la cadena y certificados queden cerrados.
4. Mantener `codex` y `claude` en `disabled` hasta la activacion controlada.
