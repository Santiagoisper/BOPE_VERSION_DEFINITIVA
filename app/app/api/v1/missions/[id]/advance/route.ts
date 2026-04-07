export const dynamic = 'force-dynamic';
// POST /api/v1/missions/[id]/advance — RAMBO decide el siguiente paso
// Usa Claude para analizar el estado y emitir la próxima orden
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { callClaude } from '@/lib/adapters/claude';
import { assertProviderBudget, BudgetExceededError } from '@/lib/budget';

const RAMBO_SYSTEM = `Eres RAMBO — Sargento Mayor del BOPE, orquestador operativo.
Tu trabajo: analizar el estado actual de la misión y decidir el SIGUIENTE PASO concreto.
No repitas trabajo ya hecho. Sé preciso, militar, directo.
Responde SIEMPRE con JSON válido en este formato:
{
  "assessment": "evaluación breve del estado actual",
  "next_action": {
    "type": "DISPATCH | WAIT_APPROVAL | COMPLETE | ESCALATE",
    "agents": ["BLADE", "FORGE"],
    "tasks": ["descripción concisa de la tarea para cada agente"],
    "reason": "por qué este paso"
  },
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL"
}`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Cargar estado completo de la misión
    const missions = await sql`
      SELECT * FROM bope_missions
      WHERE id = ${id}::uuid OR mission_id = ${id}
    `;
    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0];

    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: `Misión en estado ${mission.status}` },
        { status: 409 }
      );
    }

    const [tasks, recentMessages] = await Promise.all([
      sql`SELECT * FROM bope_tasks WHERE mission_id = ${mission.id}::uuid ORDER BY created_at`,
      sql`
        SELECT from_agent, to_agent, kind, status, summary, created_at
        FROM bope_messages
        WHERE mission_id = ${mission.id}::uuid
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ]);

    // Verificar presupuesto antes de llamar a Claude
    const ESTIMATED_CALL_USD = 0.05; // estimado conservador
    await assertProviderBudget('anthropic', ESTIMATED_CALL_USD);

    // Preparar contexto para RAMBO
    const context = {
      mission: {
        id: mission.mission_id,
        intent: mission.intent,
        priority: mission.priority,
        status: mission.status,
        loco_state: mission.loco_state,
        budget_usd: mission.budget_usd,
      },
      tasks: (tasks as { task_id: string; owner: string; status: string; description: string; result: string }[]).map(t => ({
        id: t.task_id,
        owner: t.owner,
        status: t.status,
        description: t.description,
        result: t.result,
      })),
      recent_comms: (recentMessages as { from_agent: string; to_agent: string; kind: string; status: string; summary: string }[]).map(m => ({
        from: m.from_agent,
        to: m.to_agent,
        kind: m.kind,
        status: m.status,
        summary: m.summary,
      })),
    };

    const result = await callClaude({
      mission_id: mission.id as string,
      agent: 'RAMBO',
      system: RAMBO_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `ESTADO ACTUAL DE LA MISIÓN:\n${JSON.stringify(context, null, 2)}\n\nDecide el siguiente paso.`,
        },
      ],
      max_tokens: 1024,
    });

    // Parsear la respuesta de RAMBO
    let decision: Record<string, unknown> = {};
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      }
    } catch {
      decision = { assessment: result.content, next_action: { type: 'WAIT_APPROVAL' } };
    }

    // Registrar decisión como mensaje
    await sql`
      INSERT INTO bope_messages (
        mission_id, from_agent, to_agent, direction, kind,
        priority, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        'RAMBO', 'SANTI', 'UP', 'REPORT',
        ${mission.priority},
        ${(decision.assessment as string) ?? 'Evaluación de RAMBO'},
        ${JSON.stringify({ decision, cost: result.cost })},
        false
      )
    `;

    return NextResponse.json({
      ok: true,
      data: {
        mission_id: mission.mission_id,
        decision,
        cost: result.cost,
      },
    });
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: 'BUDGET_EXCEEDED' },
        { status: 402 }
      );
    }
    console.error('[POST /missions/:id/advance]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
