param(
  [Parameter(Mandatory = $true)]
  [string]$TunnelId,
  [string]$Profile = "santiago-factory",
  [switch]$Run
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$bridge = Join-Path $repoRoot "apps\factory-bridge\src\server.mjs"

function Require-Command([string]$Name) {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Required command not found: $Name" }
  return $cmd.Source
}

Write-Host "Factory Bridge setup - safe/read-only bootstrap" -ForegroundColor Cyan
Require-Command node | Out-Null
Require-Command git | Out-Null
Require-Command herdr | Out-Null
Require-Command tunnel-client | Out-Null

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node 22+ is required. Found Node $nodeMajor." }
if (-not (Test-Path $bridge)) { throw "Factory Bridge server not found: $bridge" }

if (-not $env:CONTROL_PLANE_API_KEY) {
  $secure = Read-Host "Paste the OpenAI Runtime API key (Tunnels Read + Use)" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $env:CONTROL_PLANE_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

$env:FACTORY_BRIDGE_WRITE_ENABLED = "false"
if (-not $env:FACTORY_BRIDGE_AGENT_ALLOWLIST) {
  $env:FACTORY_BRIDGE_AGENT_ALLOWLIST = "architect,claude-glm,claude-deepseek,codex,claude,hermes-glm"
}
if (-not $env:FACTORY_BRIDGE_REPO_ROOTS) {
  $env:FACTORY_BRIDGE_REPO_ROOTS = "C:\Users\Santiago\source\repos\Santiagoisper"
}
if (-not $env:FACTORY_BRIDGE_KILL_SWITCH_PATH) {
  $env:FACTORY_BRIDGE_KILL_SWITCH_PATH = "C:\Users\Santiago\.factory-os\KILL_SWITCH"
}
New-Item -ItemType Directory -Force -Path (Split-Path $env:FACTORY_BRIDGE_KILL_SWITCH_PATH) | Out-Null

Write-Host "Checking Factory Bridge locally..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "apps\factory-bridge")
try { node --test test/*.test.mjs }
finally { Pop-Location }

$mcpCommand = "node `"$bridge`""
Write-Host "Creating/updating tunnel-client profile '$Profile'..." -ForegroundColor Cyan
& tunnel-client init --sample sample_mcp_stdio_local --profile $Profile --tunnel-id $TunnelId --mcp-command $mcpCommand
if ($LASTEXITCODE -ne 0) { throw "tunnel-client init failed." }

Write-Host "Running tunnel diagnostics..." -ForegroundColor Cyan
& tunnel-client doctor --profile $Profile --explain
if ($LASTEXITCODE -ne 0) { throw "tunnel-client doctor failed. Do not enable writes." }

Write-Host "Bootstrap complete. Writes remain DISABLED." -ForegroundColor Green
Write-Host "Next gate: run the tunnel, connect it in ChatGPT, and verify read-only tools first." -ForegroundColor Yellow

if ($Run) {
  Write-Host "Starting tunnel-client in foreground. Keep this window open." -ForegroundColor Cyan
  & tunnel-client run --profile $Profile
}
