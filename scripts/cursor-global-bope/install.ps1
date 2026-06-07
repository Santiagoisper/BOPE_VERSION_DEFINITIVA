# Instala BOPE global en Cursor (skill personal + config bopeHome)
# Ejecutar una vez: powershell -ExecutionPolicy Bypass -File scripts/cursor-global-bope/install.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$SkillDir = Join-Path $env:USERPROFILE ".cursor\skills\bope"
$BopeDir = Join-Path $env:USERPROFILE ".bope"
$ConfigPath = Join-Path $BopeDir "config.json"

New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null
Copy-Item -Force (Join-Path $PSScriptRoot "SKILL.md") (Join-Path $SkillDir "SKILL.md")
Copy-Item -Force (Join-Path $PSScriptRoot "reference.md") (Join-Path $SkillDir "reference.md")

if (-not (Test-Path $BopeDir)) {
    Write-Host "Aviso: ~/.bope no existe. Ejecuta 'bope init' desde bope-cli primero."
} else {
    $config = @{ profile = "default"; bopeHome = $RepoRoot; output = @{ writeBootstrapFileByDefault = $false } }
    if (Test-Path $ConfigPath) {
        try {
            $existing = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            $existing | Add-Member -NotePropertyName bopeHome -NotePropertyValue $RepoRoot -Force
            $config = $existing
        } catch {
            Write-Host "No se pudo fusionar config existente; se escribe plantilla nueva."
        }
    }
    $config | ConvertTo-Json -Depth 5 | Set-Content -Path $ConfigPath -Encoding UTF8
}

Write-Host "OK: skill en $SkillDir"
Write-Host "OK: bopeHome -> $RepoRoot"
Write-Host ""
Write-Host "Opcional: Cursor > Settings > Rules > User Rules — pegar user-rule-snippet.md"
Write-Host "Probar: abrir cualquier carpeta en Cursor y escribir /bope"
