# BOPE Command Center Server

Backend remoto inicial de Fase 2 para `bope-command-center`.

## Arquitectura

- Servidor HTTP nativo en Node.
- Persistencia central en `data/command-center.json`.
- Bootstrap inicial desde datasets historicos del frontend canonico.
- Sesion central por cookie `HttpOnly`.
- Auditoria central persistida en el mismo store.

## Endpoints

- `GET /api/healthz`
- `GET /api/bootstrap-status`
- `POST /api/auth/bootstrap`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/command-center/state`
- `POST /api/missions`
- `POST /api/orders/direct`
- `PATCH /api/budget/policy`

## Seguridad

- Hashing de password con PBKDF2 SHA-256.
- Lock temporal tras intentos fallidos.
- Sesion con expiracion de 12 horas.
- Cookie `HttpOnly`, `SameSite=Strict`.

## Persistencia

- Si no existe `data/command-center.json`, el servidor crea el store inicial desde semillas.
- El archivo runtime esta ignorado por git.
- El store persiste:
  - estado del command center
  - autenticacion central
  - auditoria
  - sesiones activas

## Proxima fase

- sustituir JSON file por base de datos
- agregar RBAC
- integrar proveedores reales Codex y Claude sin romper contratos actuales
