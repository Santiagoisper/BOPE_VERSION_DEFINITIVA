# Santiago Factory Bridge

Local MCP bridge between ChatGPT/Codex and Herdr. It exposes typed Factory actions instead of arbitrary shell access.

## Security model

- stdio only; no listening TCP port
- read-only by default
- writes require `FACTORY_BRIDGE_WRITE_ENABLED=true`
- allowlist of Herdr agent names
- allowlist of repository roots
- kill-switch file
- fixed binaries via `execFile`; no arbitrary shell tool
- SQLite audit ledger using Node `node:sqlite`
- prompt bodies are stored in the ledger as SHA-256 + character count, not plaintext

## V0/V1 tools

Read-only:

- `factory_health`
- `factory_agents`
- `factory_agent_status`
- `factory_agent_read`
- `factory_git_status`
- `factory_worktrees`
- `factory_events`

Write-gated:

- `factory_agent_prompt`

V0 must stay read-only until ChatGPT tunnel discovery, audit events and the kill switch have been verified end-to-end.

## Local validation

Requires Node 22+ and Herdr in PATH.

```powershell
cd apps/factory-bridge
node --test test/*.test.mjs
node src/server.mjs
```

Herdr commands used by this bridge follow the official automation interface: `herdr agent list`, `get`, `read`, and `prompt --wait --timeout`.

## OpenAI Secure MCP Tunnel

The official OpenAI tunnel supports a local stdio MCP server without exposing an inbound port.

Prerequisites:

1. Install a supported `tunnel-client` build from OpenAI.
2. Create/select a tunnel in OpenAI Platform Tunnels.
3. Create a Runtime API key with Tunnels Read + Use.
4. Never commit that key.

Safe bootstrap from the repository root:

```powershell
$env:CONTROL_PLANE_API_KEY = "<runtime-key>"
.\scripts\setup-factory-bridge.ps1 -TunnelId tunnel_0123456789abcdef0123456789abcdef -Run
```

The script deliberately forces `FACTORY_BRIDGE_WRITE_ENABLED=false` for the first connection.

Equivalent official tunnel flow:

```powershell
tunnel-client init --sample sample_mcp_stdio_local --profile santiago-factory --tunnel-id <tunnel_id> --mcp-command "node C:\path\to\apps\factory-bridge\src\server.mjs"
tunnel-client doctor --profile santiago-factory --explain
tunnel-client run --profile santiago-factory
```

Only report the bridge operational after the tunnel is healthy/ready and ChatGPT can discover and call the read-only tools.

## Human gate to enable writes

After read-only verification:

```powershell
$env:FACTORY_BRIDGE_WRITE_ENABLED = "true"
```

Restart the bridge/tunnel runtime, then use only a harmless prompt to an allowlisted test agent for the first write test.

Emergency stop:

```powershell
.\scripts\factory-kill-switch.ps1 -Enable
```

Writes stay blocked while the kill-switch file exists. Remove it explicitly with `-Disable` only after the incident/maintenance window is resolved.

## First benchmark after connection

The first real mission is the controlled comparison:

- Claude Code + GLM
- Hermes + GLM

Use the same repository SHA, separate worktrees, identical task contract, and Codex as independent judge. Record quality, autonomy, tool use, recovery, wall time and evidence. Do not interpret a harness as better merely because it reports completion first.
