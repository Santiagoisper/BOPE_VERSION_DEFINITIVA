# Next.js en raíz (`app/`) — legado

Este paquete **no forma parte del stack operativo** del Command Center.

- **Stack canónico:** `apps/bope-command-center` (Vite/React) + `apps/bope-command-center-server` (Node HTTP).
- **Decisión:** archivar bajo `archive/app-nextjs-legacy/` cuando quieras limpiar la raíz del repo.

Desde la raíz del monorepo (Git preserva historial):

```powershell
New-Item -ItemType Directory -Force -Path archive | Out-Null
git mv app archive/app-nextjs-legacy
```

Ver también `docs/PLATAFORMA-BOPE-vNEXT.md`.
