// ============================================================
// n8n Adapter — dispara workflows vía webhook
// Funciona con trial y plan pago (no requiere API key)
// ============================================================

export type N8nEventType =
  | 'mission.created'
  | 'mission.advanced'
  | 'mission.completed'
  | 'mission.failed'
  | 'handoff'
  | 'approval.requested'
  | 'approval.resolved'
  | 'budget.alert'
  | 'agent.error';

export interface N8nPayload {
  event:      N8nEventType;
  source:     'BOPE';
  timestamp:  string;
  agent?:     string;
  mission_id?: string;
  data:       Record<string, unknown>;
}

// Mapa de evento → webhook URL
// Cuando el usuario active el plan y cree más workflows,
// agregar las URLs de producción acá.
function getWebhookUrl(event: N8nEventType): string | null {
  const base = process.env.N8N_BASE_URL ?? 'https://sisbert.app.n8n.cloud';
  const webhooks = process.env.N8N_WEBHOOKS
    ? JSON.parse(process.env.N8N_WEBHOOKS)
    : {};

  // Webhook genérico de entrada (el que ya creamos)
  const genericWebhook = process.env.N8N_WEBHOOK_GENERIC;
  if (!genericWebhook && !webhooks[event]) return null;

  return webhooks[event] ?? genericWebhook ?? null;
}

export async function triggerN8n(
  event: N8nEventType,
  data: Record<string, unknown>,
  opts?: { agent?: string; mission_id?: string }
): Promise<{ ok: boolean; response?: unknown; error?: string }> {
  const url = getWebhookUrl(event);
  if (!url) {
    // n8n no configurado — log silencioso, no rompe el flujo
    console.log(`[n8n] Webhook para "${event}" no configurado — skip`);
    return { ok: true };
  }

  const payload: N8nPayload = {
    event,
    source: 'BOPE',
    timestamp: new Date().toISOString(),
    agent: opts?.agent,
    mission_id: opts?.mission_id,
    data,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[n8n] Error ${res.status} para evento "${event}": ${text.slice(0, 200)}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const response = await res.json().catch(() => ({}));
    console.log(`[n8n] ✓ Evento "${event}" disparado`);
    return { ok: true, response };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[n8n] Fetch falló para evento "${event}": ${msg}`);
    return { ok: false, error: msg };
  }
}

// ── Helpers tipados por evento ────────────────────────────────

export function n8nMissionCreated(mission: {
  mission_id: string;
  intent: string;
  priority: string;
  budget_usd: number;
}) {
  return triggerN8n('mission.created', mission, { mission_id: mission.mission_id });
}

export function n8nMissionAdvanced(mission_id: string, decision: {
  assessment: string;
  next_action: unknown;
  risk_level: string;
}) {
  return triggerN8n('mission.advanced', decision, { mission_id });
}

export function n8nApprovalRequested(approval: {
  approval_id: string;
  mission_id: string;
  action_type: string;
  risk_level: string;
  description: string;
  requested_by: string;
}) {
  return triggerN8n('approval.requested', approval, {
    mission_id: approval.mission_id,
    agent: approval.requested_by,
  });
}

export function n8nApprovalResolved(approval_id: string, decision: 'APPROVED' | 'REJECTED', mission_id: string) {
  return triggerN8n('approval.resolved', { approval_id, decision }, { mission_id });
}

export function n8nBudgetAlert(provider: string, spent_usd: number, cap_usd: number) {
  const pct = Math.round((spent_usd / cap_usd) * 100);
  return triggerN8n('budget.alert', { provider, spent_usd, cap_usd, pct_used: pct });
}

export function n8nHandoff(from: string, to: string, mission_id: string, summary: string) {
  return triggerN8n('handoff', { from, to, summary }, { agent: from, mission_id });
}
