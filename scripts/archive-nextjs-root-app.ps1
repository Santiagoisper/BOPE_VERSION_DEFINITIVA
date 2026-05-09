# Archiva el directorio legacy Next.js de la raíz (app/) a archive/app-nextjs-legacy/
# Ejecutar desde cualquier cwd; usa la raíz del repo (padre de scripts/).

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$src = Join-Path $root "app"
$dest = Join-Path $root "archive/app-nextjs-legacy"

if (-not (Test-Path $src)) {
  Write-Host "No existe $src — nada que archivar."
  exit 0
}
if (Test-Path $dest) {
  Write-Error "Ya existe $dest. Eliminá o renombrá antes de continuar."
  exit 1
}

New-Item -ItemType Directory -Force -Path (Join-Path $root "archive") | Out-Null
Set-Location $root
git mv app archive/app-nextjs-legacy
Write-Host "OK: app/ movido a archive/app-nextjs-legacy"
