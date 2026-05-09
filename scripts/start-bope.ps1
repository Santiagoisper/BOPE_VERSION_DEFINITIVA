Param(
    [switch]$PrintOnly,
    [switch]$Full,
    [switch]$RunRuntime
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$runtimePath = Join-Path $repoRoot "runtime"
$templateName = if ($Full) { "template-sesion-codex.md" } else { "template-sesion-codex-lite.md" }
$templatePath = Join-Path $repoRoot ("docs\setup\" + $templateName)

if (-not (Test-Path $templatePath)) {
    throw "No existe docs\setup\template-sesion-codex.md. Falta el template de arranque."
}

Write-Host "CODEX ONLINE" -ForegroundColor Red
Write-Host "Modo: selector simple de agentes BOPE" -ForegroundColor Yellow
Write-Host ("Perfil de arranque: " + $(if ($Full) { "FULL" } else { "LITE" })) -ForegroundColor Cyan
Write-Host ""
Write-Host "Template Codex: $templatePath"
Write-Host ""

if ($PrintOnly) {
    Write-Host "Modo print-only." -ForegroundColor Cyan
    Write-Host ""
    Get-Content $templatePath
    exit 0
}

if (-not $RunRuntime) {
    Get-Content $templatePath
    exit 0
}

$env:PYTHONPATH = $runtimePath
Write-Host "Ejecutando runtime BOPE..." -ForegroundColor Cyan
Write-Host ""

python -m bope_agents.main
