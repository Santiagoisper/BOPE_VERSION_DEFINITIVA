Param(
    [switch]$PrintOnly,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimePath = Join-Path $repoRoot "runtime"
$missionPath = Join-Path $repoRoot "logs\MISION-ACTIVA.md"
$templateName = if ($Full) { "template-sesion-codex.md" } else { "template-sesion-codex-lite.md" }
$templatePath = Join-Path $repoRoot ("docs\setup\" + $templateName)

if (-not (Test-Path $missionPath)) {
    throw "No existe logs\MISION-ACTIVA.md. Sin mision activa no arranca BOPE."
}

if (-not (Test-Path $templatePath)) {
    throw "No existe docs\setup\template-sesion-codex.md. Falta el template de arranque."
}

Write-Host "BOPE ONLINE" -ForegroundColor Red
Write-Host "SANTIAGO EN AUTORIDAD SUPREMA" -ForegroundColor Yellow
Write-Host "JOHN RAMBO EN MANDO OPERATIVO" -ForegroundColor Yellow
Write-Host ("Perfil de arranque: " + $(if ($Full) { "FULL" } else { "LITE" })) -ForegroundColor Cyan
Write-Host ""
Write-Host "Mision activa: $missionPath"
Write-Host "Template Codex: $templatePath"
Write-Host ""

if ($PrintOnly) {
    Write-Host "Modo print-only: no se ejecuta runtime." -ForegroundColor Cyan
    Write-Host ""
    Get-Content $templatePath
    exit 0
}

$env:PYTHONPATH = $runtimePath

Write-Host "Ejecutando runtime local de JOHN..." -ForegroundColor Cyan
Write-Host ""

python -m bope_agents.main
