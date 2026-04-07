export const dynamic = 'force-dynamic';
// POST /api/v1/approvals — crear solicitud de aprobación
// GET  /api/v1/approvals — listar aprobaciones pendientes
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextApprovalId } from '@/lib/db';
import { n8nApprovalRequested } from '@/lib/adapters/n8n';

const CreateApprovalSchema = z.object({
  mission_id:    z.string(),
  requested_by:  z.string(),
  action_type:   z.string(),
  risk_level:    z.enum(['CRITICAL','HIGH','MEDIUM','LOW']).default('HIGH'),
  description:   z.string().min(10),
  payload:       z.record(z.string(), z.unknown()).default(() => ({})),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = CreateApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { mission_id, requested_by, action_type, risk_level, description, payload } = parsed.data;

    // Resolver mission UUID
    const missions = await sql`
      SELECT id FROM bope_missions
      WHERE id = ${mission_id}::uuid OR mission_id = ${mission_id}
    `;
    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const approval_id = await nextApprovalId();

    const rows = await sql`
      INSERT INTO bope_approvals (
        approval_id, mission_id, requested_by,
        action_type, risk_level, description, payload, status
      ) VALUES (
        ${approval_id},
        ${missions[0].id}::uuid,
        ${requested_by},
        ${action_type},
        ${risk_level},
        ${description},
        ${JSON.stringify(payload)},
        'PENDING'
      )
      RETURNING *
    `;

    // Actualizar estado de la misión
    await sql`
      UPDATE bope_missions
      SET status = 'AWAITING_APPROVAL', updated_at = NOW()
      WHERE id = ${missions[0].id}::uuid
    `;

    // Notificar n8n
    n8nApprovalRequested({
      approval_id:  rows[0].approval_id,
      mission_id:   missions[0].id,
      action_type,
      risk_level,
      description,
      requested_by,
    }).catch(() => {});

    return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /approvals]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING';

    const rows = await sql`
      SELECT a.*, m.mission_id AS mission_label, m.intent
      FROM bope_approvals a
      JOIN bope_missions m ON m.id = a.mission_id
      WHERE a.status = ${status}
      ORDER BY
        CASE a.risk_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
        a.requested_at ASC
    `;

    return NextResponse.json({ ok: true, data: rows });
  } catch (err) {
    console.error('[GET /approvals]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
