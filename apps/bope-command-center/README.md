# BOPE Command Center

Base operativa de `apps/bope-command-center/` dentro de `BOPE VERSION DEFINITIVA`.

## Estado actual

- UI React/Vite recableada a backend remoto central.
- Sesion centralizada por cookie `HttpOnly`.
- Estado operativo obtenido desde API remota.
- Presupuesto central editable con trazabilidad.
- Auditoria central visible en la UI.
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

## Autenticacion

- Primer arranque: bootstrap remoto de usuario y contraseña.
- Password hashing y lockout residen en el backend.
- La sesion viaja por cookie segura `HttpOnly` con expiracion de 12 horas.

## Presupuesto y auditoria

- El backend recalcula alertas en cada mutacion.
- La UI permite editar presupuesto global y por proveedor.
- Cada cambio presupuestario exige motivo operativo y genera auditoria central.

## Comandos

```bash
pnpm --dir apps/bope-command-center typecheck
pnpm --dir apps/bope-command-center build
pnpm --dir apps/bope-command-center-server typecheck
pnpm --dir apps/bope-command-center-server build
```

## Limites actuales

- Sin integracion real con proveedores externos.
- Persistencia central basada en archivo JSON local del servidor, no en base SQL todavia.
- Los datos iniciales siguen naciendo de semillas operativas importadas.
- No hay integracion con APIs externas reales.

## Proximos pasos

1. Migrar la persistencia del backend a Postgres o equivalente.
2. Añadir RBAC real y sesiones revocables por operador.
3. Conectar providers reales Codex y Claude sobre la capa de proveedores ya preparada.
4. Incorporar streaming de eventos y colas de trabajos.
