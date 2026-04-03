# BOPE Command Center

Base operativa de `apps/bope-command-center/` dentro de `BOPE VERSION DEFINITIVA`.

## Estado actual

- UI React/Vite conservada y recableada a persistencia local real.
- Persistencia en IndexedDB con estado normalizado del dominio.
- Autenticacion local con PBKDF2 SHA-256, bloqueo por intentos fallidos y sesion temporal.
- Presupuesto vivo global, por proveedor y por mision con alertas de umbral.
- Logging operativo y auditoria interna dentro del estado persistido.
- Sin integracion externa con Claude o Codex en esta fase.

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

## Persistencia

- `src/lib/persistence.ts` usa IndexedDB con una sola clave primaria (`state/primary`).
- `src/seeds/bootstrap.ts` inicializa el estado a partir de los datasets historicos existentes.
- `src/context/CommandCenterContext.tsx` carga, sincroniza y persiste el estado.

## Autenticacion

- Primer arranque: obliga a crear usuario y contraseña.
- Password hashing: PBKDF2 SHA-256 con salt y 210000 iteraciones.
- Sesion: `sessionStorage`, expira a las 12 horas.
- Bloqueo: 5 intentos fallidos activan un lock temporal de 15 minutos.

## Presupuesto y auditoria

- Se recalculan alertas en cada mutacion del estado.
- Se generan entradas de auditoria para:
  - bootstrap de auth
  - login/logout
  - creacion de misiones
  - ordenes directas
  - alertas de presupuesto nuevas

## Comandos

```bash
pnpm --dir apps/bope-command-center typecheck
pnpm --dir apps/bope-command-center build
```

## Limites actuales

- Persistencia solo local del navegador.
- Sin backend remoto ni multiusuario.
- Los datos iniciales siguen naciendo de semillas locales importadas.
- No hay integracion con APIs externas reales.

## Proximos pasos

1. Extraer la capa de repositorio para soportar backend sin reescribir la UI.
2. Conectar un servicio API real para auth, sesiones y auditoria centralizada.
3. Agregar mutaciones de presupuesto por proveedor y por mision desde la UI.
4. Incorporar filtros avanzados y exportes de auditoria.
