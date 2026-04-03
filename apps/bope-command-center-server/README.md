# BOPE Command Center Server

Backend remoto de Fase 3 para `bope-command-center`.

## Arquitectura

- Servidor HTTP nativo en Node.
- Persistencia central en Postgres.
- Migraciones SQL reproducibles en `db/migrations/`.
- Bootstrap inicial desde datasets historicos del frontend canonico.
- Sesion central por cookie `HttpOnly`.
- Auditoria central, presupuesto y proveedores persistidos en base real.

## Variables

- `BOPE_COMMAND_CENTER_DATABASE_URL`
- `BOPE_COMMAND_CENTER_DATABASE_SSL`
- `BOPE_COMMAND_CENTER_SERVER_PORT`

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
```

## Estado de Fase 3

- el backend ya no depende de `data/command-center.json`
- la fuente de verdad pasa a Postgres
- auth central persiste en `bope_auth_config` y `bope_sessions`
- las mutaciones usan transaccion y advisory lock para serializar escrituras

## Fase 4

1. Incorporar activacion controlada de tokens por proveedor.
2. Agregar rotacion segura de credenciales y secretos externos.
3. Instrumentar consumo real, cuotas y kill switch por operador.
4. Conectar llamadas reales a motores solo despues de smoke operativo y limites auditados.
