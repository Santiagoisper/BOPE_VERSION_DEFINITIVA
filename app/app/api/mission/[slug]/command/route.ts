export const dynamic = 'force-dynamic';
// POST /api/mission/[slug]/command — Único punto de entrada para órdenes del COMMANDER
// Crea tarea, llama a RAMBO (Claude) para decidir el siguiente paso y registra en SSE.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextTaskId } from '@/lib/db';
import { callClaude } from '@/lib/adapters/claude';
import { assertProviderBudget, BudgetExceededError } from '@/lib/budget';

const CommandSchema = z.object({
  order: z.string().min(5),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const RAMBO_COMMAND_SYSTEM = `Eres RAMBO — Sargento Mayor del BOPE, orquestador operativo.
El COMMANDER te acaba de dar una orden directa. Tu trabajo: interpretarla y decidir el siguiente paso concreto.
Responde SIEMPRE con JSON válido en este formato exacto:
{
  "assessment": "evaluación breve del contexto y la orden",
  "next_action": {
    "type": "DISPATCH | WAIT_APPROVAL | COMPLETE | ESCALATE",
    "agents": ["FORGE", "PIXEL"],
    "tasks": ["descripción concisa por agente"],
    "reason": "por qué este paso"
  },
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL"
}`;

interface TaskRow {
  id: string;
  task_id: string;
}

interface MissionRow {
  id: string;
  mission_id: string;
  intent: string;
  priority: string;
  status: string;
  loco_state: string;
  budget_usd: number;
}

interface DbTask {
  task_id: string;
  owner: string;
  status: string;
  description: string;
  result: string | null;
}

interface DbMessage {
  from_agent: string;
  to_agent: string;
  kind: string;
  status: string | null;
  summary: string | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = CommandSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Resolver misión por slug (UUID o mission_id legible)
    const missions = await sql`
      SELECT * FROM bope_missions
      WHERE id = ${slug}::uuid OR mission_id = ${slug}
    `;

    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0] as MissionRow;

    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: `Misión en estado ${mission.status} — no acepta nuevas órdenes` },
        { status: 409 },
      );
    }

    const { order, metadata = {} } = parsed.data;

    // Crear tarea de RAMBO para procesar la orden
    const task_id = await nextTaskId();
    const taskRows = await sql`
      INSERT INTO bope_tasks (
        task_id, mission_id, owner, status, description, evidence
      ) VALUES (
        ${task_id},
        ${mission.id}::uuid,
        'RAMBO',
        'IN_PROGRESS',
        ${order},
        ${JSON.stringify(metadata)}
      )
      RETURNING id, task_id
    `;

    const task = taskRows[0] as TaskRow;

    // Registrar la orden del COMMANDER como mensaje (SSE la emitirá como HANDOFF_INITIATED)
    await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        ${task.id}::uuid,
        'SANTI', 'RAMBO',
        'DOWN', 'ORDER',
        ${mission.priority},
        ${order},
        ${JSON.stringify({ order, metadata })},
        false
      )
    `;

    // Verificar presupuesto antes de llamar a Claude
    const ESTIMATED_CALL_USD = 0.02;
    await assertProviderBudget('anthropic', ESTIMATED_CALL_USD);

    // Cargar contexto completo para RAMBO
    const [tasks, recentMessages] = await Promise.all([
      sql`SELECT * FROM bope_tasks WHERE mission_id = ${mission.id}::uuid ORDER BY created_at`,
      sql`
        SELECT from_agent, to_agent, kind, status, summary
        FROM bope_messages
        WHERE mission_id = ${mission.id}::uuid
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ]);

    const context = {
      mission: {
        id: mission.mission_id,
        intent: mission.intent,
        priority: mission.priority,
        status: mission.status,
        loco_state: mission.loco_state,
        budget_usd: mission.budget_usd,
      },
      order,
      metadata,
      tasks: (tasks as DbTask[]).map((t) => ({
        id: t.task_id,
        owner: t.owner,
        status: t.status,
        description: t.description,
        result: t.result,
      })),
      recent_comms: (recentMessages as DbMessage[]).map((m) => ({
        from: m.from_agent,
        to: m.to_agent,
        kind: m.kind,
        status: m.status,
        summary: m.summary,
      })),
    };

    // Llamar a RAMBO para que procese la orden
    const result = await callClaude({
      mission_id: mission.id,
      task_id: task.id,
      agent: 'RAMBO',
      system: RAMBO_COMMAND_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `ORDEN DEL COMMANDER: "${order}"\n\nESTADO DE LA MISIÓN:\n${JSON.stringify(context, null, 2)}\n\nDecide el siguiente paso.`,
        },
      ],
      max_tokens: 1024,
    });

    // Parsear decisión de RAMBO
    let decision: Record<string, unknown> = {};
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      }
    } catch {
      decision = { assessment: result.content, next_action: { type: 'WAIT_APPROVAL' } };
    }

    // Completar la tarea de RAMBO
    await sql`
      UPDATE bope_tasks
      SET status = 'COMPLETED',
          result = ${(decision.assessment as string) ?? result.content},
          updated_at = NOW()
      WHERE id = ${task.id}::uuid
    `;

    // Registrar respuesta de RAMBO (SSE la emitirá como AGENT_REPLIED)
    await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        ${task.id}::uuid,
        'RAMBO', 'SANTI',
        'UP', 'REPORT',
        ${mission.priority},
        ${(decision.assessment as string) ?? 'Evaluación de RAMBO'},
        ${JSON.stringify({ decision, cost: result.cost })},
        false
      )
    `;

    return NextResponse.json(
      {
        ok: true,
        data: {
          task_id: task.task_id,
          taskUUID: task.id,
          decision,
          cost: result.cost,
        },
      },
      { status: 202 },
    );
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json(
        { ok: false, error: err.message, code: 'BUDGET_EXCEEDED' },
        { status: 402 },
      );
    }

    console.error('[POST /mission/:slug/command]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
