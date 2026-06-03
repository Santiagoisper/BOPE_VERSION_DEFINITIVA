export const dynamic = 'force-dynamic';
// POST /api/v1/approvals/[id]/resolve — SANTI aprueba o rechaza
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';

const ResolveSchema = z.object({
  decision:      z.enum(['APPROVED', 'REJECTED']),
  decided_by:    z.string().default('SANTI'),
  decision_note: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = ResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Buscar aprobación
    const approvals = await sql`
      SELECT * FROM bope_approvals
      WHERE id = ${id}::uuid OR approval_id = ${id}
    `;
    if (approvals.length === 0) {
      return NextResponse.json({ ok: false, error: 'Aprobación no encontrada' }, { status: 404 });
    }

    const approval = approvals[0];
    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { ok: false, error: `Aprobación ya ${approval.status}` },
        { status: 409 }
      );
    }

    const { decision, decided_by, decision_note } = parsed.data;

    // Actualizar aprobación
    await sql`
      UPDATE bope_approvals
      SET
        status       = ${decision},
        decided_by   = ${decided_by},
        decision_note = ${decision_note ?? null},
        decided_at   = NOW()
      WHERE id = ${approval.id}::uuid
    `;

    // Verificar si quedan aprobaciones pendientes en la misión
    const [pending] = await sql`
      SELECT COUNT(*) AS cnt FROM bope_approvals
      WHERE mission_id = ${approval.mission_id}::uuid AND status = 'PENDING'
    `;

    if (Number(pending.cnt) === 0) {
      // Continuar la misión si fue aprobada, o cancelarla si fue rechazada
      const newStatus = decision === 'APPROVED' ? 'ACTIVE' : 'CANCELLED';
      await sql`
        UPDATE bope_missions
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${approval.mission_id}::uuid
      `;
    }

    // Registrar evento
    await sql`
      INSERT INTO bope_messages (
        mission_id, from_agent, to_agent, direction, kind,
        priority, summary, payload, requires_approval
      ) VALUES (
        ${approval.mission_id}::uuid,
        ${decided_by}, 'RAMBO', 'DOWN', 'ORDER',
        'P1',
        ${`Aprobación ${approval.approval_id}: ${decision} por ${decided_by}`},
        ${JSON.stringify({ approval_id: approval.approval_id, decision, note: decision_note })},
        false
      )
    `;

    return NextResponse.json({
      ok: true,
      data: {
        approval_id: approval.approval_id,
        decision,
        decided_by,
        decided_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[POST /approvals/:id/resolve]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
