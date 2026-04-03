# BOPE Command Center

Base operativa de `apps/bope-command-center/` dentro de `BOPE VERSION DEFINITIVA`.

## Estado actual

- UI React/Vite recableada a backend remoto central.
- Sesion centralizada por cookie `HttpOnly`.
- Estado operativo obtenido desde API remota.
- Presupuesto central editable con trazabilidad.
- Auditoria central visible en la UI.
- Persistencia remota soportada por Postgres.
- Controles de activacion de proveedores visibles en la UI.
- Sin integracion externa real con Claude o Codex en esta fase.

## Modelo de datos

El estado normalizado vive en `src/domain/models.ts` e incluye:

- agentes
- performance de agentes
- misiones
- eventos de mision
- medallas
- sanciones
- proveedores
- configuraciones de proveedor
- herramientas
- ordenes directas
- politica presupuestaria
- alertas presupuestarias
- auditoria
- configuracion de autenticacion
- sesion local

## Persistencia y backend

- El backend remoto vive en `../bope-command-center-server/`.
- El frontend consume API mediante `src/lib/api.ts`.
- `src/context/CommandCenterContext.tsx` es el adaptador entre la API y la UI.
- La UI ya no depende de IndexedDB como fuente de verdad.
- El runtime ahora proviene de Postgres en lugar de JSON local.

## Autenticacion

- Primer arranque: bootstrap remoto de usuario y contrasena.
- Password hashing y lockout residen en el backend.
- La sesion viaja por cookie segura `HttpOnly` con expiracion de 12 horas.

## Presupuesto, auditoria y providers

- El backend recalcula alertas en cada mutacion.
- La UI permite editar presupuesto global y por proveedor.
- Cada cambio presupuestario exige motivo operativo y genera auditoria central.
- Los proveedores `codex` y `claude` quedan preparados en modo `disabled`.
- Cada proveedor expone kill switch, limites y trazabilidad para futura activacion controlada.

## Comandos

```bash
pnpm --dir apps/bope-command-center typecheck
pnpm --dir apps/bope-command-center build
pnpm --dir apps/bope-command-center-server typecheck
pnpm --dir apps/bope-command-center-server build
pnpm --dir apps/bope-command-center-server db:migrate
```

## Limites actuales

- Sin integracion real con proveedores externos.
- Los datos iniciales siguen naciendo de semillas operativas importadas si la base arranca vacia.
- No hay integracion con APIs externas reales.
- La activacion de proveedores permanece bloqueada por politica y kill switch.

## Proximos pasos

1. Anadir RBAC real y sesiones revocables por operador.
2. Conectar providers reales Codex y Claude sobre la capa de proveedores ya preparada.
3. Incorporar streaming de eventos y colas de trabajos.
4. Implementar activacion controlada de tokens con smoke operativo y quotas duras.
