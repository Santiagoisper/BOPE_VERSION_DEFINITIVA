param(
  [Parameter(Mandatory = $true, ParameterSetName = 'Enable')]
  [switch]$Enable,
  [Parameter(Mandatory = $true, ParameterSetName = 'Disable')]
  [switch]$Disable,
  [string]$Path = "C:\Users\Santiago\.factory-os\KILL_SWITCH"
)

$ErrorActionPreference = "Stop"
if ($Enable) {
  New-Item -ItemType Directory -Force -Path (Split-Path $Path) | Out-Null
  Set-Content -Path $Path -Value ("enabled " + (Get-Date).ToString("o")) -Encoding ascii
  Write-Host "Factory Bridge KILL SWITCH ENABLED: $Path" -ForegroundColor Red
} else {
  if (Test-Path $Path) { Remove-Item -Force $Path }
  Write-Host "Factory Bridge kill switch disabled: $Path" -ForegroundColor Green
}
