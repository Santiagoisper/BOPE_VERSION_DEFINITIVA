# Levanta en localhost: Command Center API (3100), UI (3000), Next app (3001).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/dev-local-all.ps1
# Requiere: pnpm install en la raiz. Server: copiar apps/bope-command-center-server/.env.example -> .env

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$serverRel = "apps\bope-command-center-server"
$uiRel     = "apps\bope-command-center"
$appRel    = "app"
$serverDir = Join-Path $root $serverRel

if (-not (Test-Path (Join-Path $serverDir ".env"))) {
  Write-Host "AVISO: Falta .env en $serverRel - el API no arrancara. Copia .env.example a .env y completa DB + JWT_SECRET." -ForegroundColor Yellow
}

Write-Host "Build servidor (tsc)..." -ForegroundColor Cyan
pnpm --dir $serverRel run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Iniciando API :3100 (nueva ventana)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit", "-NoProfile", "-Command",
  "Set-Location '$root'; pnpm --dir '$serverRel' run start:local"
)

Start-Sleep -Seconds 2

Write-Host "Iniciando Command Center UI :3000 (nueva ventana)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit", "-NoProfile", "-Command",
  "Set-Location '$root'; pnpm --dir '$uiRel' run dev"
)

Write-Host "Iniciando Next app :3001 (nueva ventana)..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit", "-NoProfile", "-Command",
  "Set-Location '$root'; pnpm --dir '$appRel' exec next dev -p 3001"
)

Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Command Center UI   http://localhost:3000"
Write-Host "  Command Center API  http://localhost:3100/api/healthz"
Write-Host "  Next (app)          http://localhost:3001"
Write-Host ""
Write-Host "Abriendo navegador..."
Start-Sleep -Seconds 1
Start-Process 'http://localhost:3000/'
Start-Process 'http://localhost:3001/'
Start-Process 'http://localhost:3100/api/healthz'
