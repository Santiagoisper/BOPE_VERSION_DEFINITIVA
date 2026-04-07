# ORDEN-DE-BATALLA - decideNextAgent()

Fuente operativa: aclaracion aprobada por COMMANDER para BOPE-PLATFORM-001.

## Firma

```ts
function decideNextAgent(
  reason: string,
  from: RouterId,
  to: RouterId | undefined
): RouterId
```

## Tipos validos de `reason`

- `commander-input`
- `agent-review`
- `auto-triggered`
- `performance-analyze`
- `architecture-design`
- `quality-refactor`

## Matriz de decision

### 1. Commander input

Condicion:
- `reason === 'commander-input'`
- `from === 'COMMANDER'`

Reglas:
- Si `to === 'CC'` -> retornar `CODEX`
- Si `to === 'CODEX'` -> retornar `CC`
- Si `to` no existe -> retornar `CODEX`

Nota:
- `CODEX` es el `DEFAULT_AGENT` por DECISION-006.

### 2. Agent review

Condicion:
- `reason === 'agent-review'`

Reglas:
- Si `from === 'CC'` y `to === 'CODEX'` -> retornar `COMMANDER`
- Si `from === 'CODEX'` y `to === 'CC'` -> retornar `COMMANDER`

### 3. Auto triggered

Condicion:
- `reason === 'auto-triggered'`

Regla:
- Retornar `COMMANDER`

### 4. Performance analyze

Condicion:
- `reason === 'performance-analyze'`

Regla:
- Retornar `COMMANDER`

### 5. Architecture design

Condicion:
- `reason === 'architecture-design'`
- `to === 'GEMINI'`

Regla:
- Retornar `COMMANDER`

### 6. Quality refactor

Condicion:
- `reason === 'quality-refactor'`
- `to === 'DEEPSEEK'`

Regla:
- Retornar `COMMANDER`

## Fallback inviolable

Todo caso no contemplado en la matriz debe retornar:

```ts
'COMMANDER'
```

## Regla de tipos

- `AgentId`: agentes con API real e invocable
  - `CLAUDE | CODEX | GEMINI`
- `RouterId`: actores completos del flujo de decision
  - `AgentId | COMMANDER | CC | DEEPSEEK`

## Implementacion de referencia

```ts
function decideNextAgent(reason, from, to) {
  if (reason === 'commander-input' && from === 'COMMANDER') {
    if (to === 'CC') return 'CODEX'
    if (to === 'CODEX') return 'CC'
    if (!to) return 'CODEX'
  }

  if (reason === 'agent-review') {
    if (from === 'CC' && to === 'CODEX') return 'COMMANDER'
    if (from === 'CODEX' && to === 'CC') return 'COMMANDER'
  }

  if (reason === 'auto-triggered') return 'COMMANDER'
  if (reason === 'performance-analyze') return 'COMMANDER'

  if (reason === 'architecture-design' && to === 'GEMINI')
    return 'COMMANDER'

  if (reason === 'quality-refactor' && to === 'DEEPSEEK')
    return 'COMMANDER'

  return 'COMMANDER'
}
```
