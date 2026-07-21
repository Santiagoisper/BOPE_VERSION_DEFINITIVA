Param(
    [string]$BopeHome,
    [string]$ProfilePath
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($BopeHome)) {
    $BopeHome = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
    $BopeHome = (Resolve-Path $BopeHome).Path
}

if ([string]::IsNullOrWhiteSpace($ProfilePath)) {
    $ProfilePath = $PROFILE.CurrentUserCurrentHost
}

if (-not (Test-Path $BopeHome)) {
    throw "No existe BOPE_HOME: $BopeHome"
}

$startMarker = "# >>> BOPE terminal bootstrap >>>"
$endMarker = "# <<< BOPE terminal bootstrap <<<"

$block = @"
$startMarker
`$env:BOPE_HOME = "$BopeHome"

function bope-home {
    Set-Location `$env:BOPE_HOME
}

function bope-codex {
    powershell -ExecutionPolicy Bypass -File "`$env:BOPE_HOME\scripts\start-bope.ps1" -PrintOnly
}

function bope-codex-full {
    powershell -ExecutionPolicy Bypass -File "`$env:BOPE_HOME\scripts\start-bope.ps1" -PrintOnly -Full
}

function bope-check {
    bope doctor
}

`$bopeShellArgs = [Environment]::GetCommandLineArgs()
`$bopeNonInteractive = `$bopeShellArgs -contains "-Command" -or `$bopeShellArgs -contains "-File" -or `$bopeShellArgs -contains "-EncodedCommand"
if (-not `$bopeNonInteractive) {
    Write-Host "BOPE listo. Comandos: bope, bope-codex, bope-codex-full, bope-home, bope-check" -ForegroundColor Red
}
$endMarker
"@

$profileDir = Split-Path -Parent $ProfilePath
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

$existing = ""
if (Test-Path $ProfilePath) {
    $existing = Get-Content -Path $ProfilePath -Raw
}

$pattern = "(?s)" + [regex]::Escape($startMarker) + ".*?" + [regex]::Escape($endMarker)
if ($existing -match $pattern) {
    $updated = [regex]::Replace($existing, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block })
} elseif ([string]::IsNullOrWhiteSpace($existing)) {
    $updated = $block + [Environment]::NewLine
} else {
    $updated = $existing.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $block + [Environment]::NewLine
}

Set-Content -Path $ProfilePath -Value $updated -Encoding UTF8

Write-Host "OK: perfil PowerShell actualizado en $ProfilePath"
Write-Host "OK: BOPE_HOME -> $BopeHome"
Write-Host "Abri una terminal nueva o ejecuta: . `$PROFILE"
