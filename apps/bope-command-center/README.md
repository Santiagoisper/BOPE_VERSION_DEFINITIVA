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

## Normalizacion de entorno

- `BOPE` es el proyecto y entorno operativo.
- La base fisica real validada en Neon puede llamarse distinto.
- Al 3 de abril de 2026, el backend fue validado contra una base fisica llamada `neondb`.
- El frontend debe apuntar al backend correcto; no necesita conocer el nombre de la base fisica.

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
- El runtime proviene de Postgres en lugar de JSON local.

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
pnpm --dir apps/bope-command-center-server start
```

## Checklist Frontend

1. Confirmar que el backend remoto este arriba y responda `healthz`.
2. Definir `VITE_BOPE_COMMAND_CENTER_API_URL` en Vercel si se usa un backend fuera del proxy local.
3. Ejecutar `pnpm --dir apps/bope-command-center typecheck`.
4. Ejecutar `pnpm --dir apps/bope-command-center build`.
5. Abrir la UI y verificar bootstrap/login.
6. Verificar lectura de agentes y misiones.
7. Verificar ajuste de presupuesto y reflejo de auditoria.

## Checklist de despliegue operativo

1. Validar Neon con la `connection string` real.
2. Migrar base desde el server.
3. Levantar backend.
4. Apuntar frontend al backend correcto.
5. Verificar smoke completo antes de cualquier activacion de providers.

## Limites actuales

- Sin integracion real con proveedores externos.
- Los datos iniciales siguen naciendo de semillas operativas importadas si la base arranca vacia.
- No hay integracion con APIs externas reales.
- La activacion de proveedores permanece bloqueada por politica y kill switch.

## Cierre Fase 3.1

- documentacion de Neon normalizada
- variables de entorno aclaradas
- checklist de backend, frontend y Postgres documentado
- entorno operativo `BOPE` diferenciado de la base fisica real
