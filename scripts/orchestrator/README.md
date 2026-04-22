# BOPE Orchestrator MVP

Local CLI that lets **JOHN (Codex CLI)** plan and dispatch tasks to worker agents (Codex or Claude Code), with live progress visible in the **War Room** via SSE.

---

## Architecture

```
You ──→ bope:orchestrator
           │
           ├─ fetches mission from Next.js backend  (GET /api/v1/missions/:id)
           ├─ asks JOHN (Codex CLI) for a JSON plan
           ├─ for each task:
           │    ├─ creates branch  mission/<id>/<task-id>
           │    ├─ runs codex or claude CLI
           │    ├─ commits changes
           │    └─ posts progress events  (POST /api/v1/missions/:id/events)
           └─ War Room shows events live via SSE  (GET /api/mission/:slug/sse)
```

---

## Prerequisites

| Tool | Install |
|------|---------|
| **bun** | https://bun.sh |
| **git** | already in PATH on most systems |
| **codex** CLI | `npm install -g @openai/codex` |
| **claude** CLI | https://docs.anthropic.com/claude/docs/claude-cli |
| **Next.js app** | running at `http://localhost:3000` |

Only `codex` is strictly required as JOHN; `claude` is only needed if a task plan assigns `engine: "claude"`.

---

## How to run

### 1. Start the Next.js app

```bash
cd app
pnpm dev
# → running at http://localhost:3000
```

### 2. Create a mission in War Room

Open http://localhost:3000/warroom → **MISIONES** tab → create a new mission.  
Note the mission ID (e.g. `M-2026-04-07-00001`) or UUID.

You can also copy the ready-made command from the **"Copy orchestrator command"** button next to each mission.

### 3. Run the orchestrator

```bash
# From repo root:
pnpm bope:orchestrator --mission M-2026-04-07-00001

# With explicit options:
pnpm bope:orchestrator \
  --mission M-2026-04-07-00001 \
  --base-url http://localhost:3000 \
  --repo /path/to/repo \
  --base-branch main
```

Or directly with Bun:
```bash
bun scripts/orchestrator/bope-orchestrator.ts --mission <id>
```

### 4. Watch in War Room

Open http://localhost:3000/warroom → **APROBACIONES** tab → scroll to **COMMS — MONITOREO PASIVO**.  
Events stream in real-time via SSE.

---

## Plan contract (PlanV1)

JOHN is instructed to output this JSON:

```json
{
  "parallelism": 2,
  "tasks": [
    {
      "id": "task-1",
      "title": "Implement feature X",
      "engine": "codex",
      "agent": "FORGE",
      "instructions": "Full self-contained instructions for the worker...",
      "branch": "optional-override-branch-name"
    }
  ],
  "merge": {
    "strategy": "john-integrates",
    "base": "main"
  }
}
```

| Field | Description |
|-------|-------------|
| `parallelism` | Max concurrent tasks (1–4) |
| `tasks[].engine` | `codex` or `claude` |
| `tasks[].instructions` | Self-contained prompt for the worker agent |
| `merge.strategy` | Currently `john-integrates` (JOHN reviews and merges) |

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOPE_BASE_URL` | `http://localhost:3000` | Backend URL |
| `BOPE_BASE_BRANCH` | `main` | Branch to create task branches from |

---

## Validating events in War Room

1. Run `pnpm bope:orchestrator --mission <id>`.
2. Go to War Room → **APROBACIONES** tab (where SSE is active).
3. You should see lines like:
   - `[HH:MM:SS] AGENT_REPLIED: {"summary":"Orchestrator started..."}`
   - `[HH:MM:SS] HANDOFF_INITIATED: {"summary":"Starting task 'X' on branch..."}`
   - `[HH:MM:SS] AGENT_REPLIED: {"summary":"Task 'X' completed"}`

Events are also stored permanently in `bope_messages` in Neon.

---

## File structure

```
scripts/orchestrator/
├── bope-orchestrator.ts   # CLI entry point
├── http-client.ts         # HTTP client for POST /api/v1/missions/:id/events
├── mission-runner.ts      # MissionRunner orchestration logic
├── types.ts               # PlanV1 type contract
├── engines/
│   └── cli-runner.ts      # runCodex() and runClaude() spawn helpers
└── README.md              # This file
```
