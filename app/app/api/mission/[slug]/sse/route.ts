// GET /api/mission/[slug]/sse — Server-Sent Events para la war room
// Emite mensajes nuevos en tiempo real vía polling sobre bope_messages
import { NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Heartbeat inicial
      send('system_log', {
        type: 'system_log',
        message: `[SSE] Conectado a misión: ${slug}`,
        timestamp: new Date().toISOString(),
      });

      // Resolver misión
      let missionUUID: string | null = null;
      try {
        const missions = await sql`
          SELECT id FROM bope_missions
          WHERE id = ${slug}::uuid OR mission_id = ${slug}
        `;
        if (missions.length > 0) {
          missionUUID = missions[0].id as string;
        } else {
          send('system_log', { type: 'system_log', message: `Misión ${slug} no encontrada`, timestamp: new Date().toISOString() });
          controller.close();
          return;
        }
      } catch {
        controller.close();
        return;
      }

      let lastId: string | null = null;
      let alive = true;

      req.signal.addEventListener('abort', () => { alive = false; });

      // Poll cada 2 segundos
      while (alive) {
        try {
          const messages = lastId
            ? await sql`
                SELECT m.*, m.id::text AS msg_id
                FROM bope_messages m
                WHERE m.mission_id = ${missionUUID}::uuid
                  AND m.id > ${lastId}::uuid
                ORDER BY m.created_at ASC
                LIMIT 20
              `
            : await sql`
                SELECT m.*, m.id::text AS msg_id
                FROM bope_messages m
                WHERE m.mission_id = ${missionUUID}::uuid
                ORDER BY m.created_at DESC
                LIMIT 10
              `;

          for (const msg of [...messages].reverse()) {
            const eventType =
              msg.kind === 'REPORT' ? 'AGENT_REPLIED'
              : msg.kind === 'ORDER' || msg.kind === 'REQUEST_HELP' ? 'HANDOFF_INITIATED'
              : 'MISSION_UPDATED';

            send(eventType, {
              taskId:    msg.task_id,
              agent:     msg.from_agent,
              to:        msg.to_agent,
              kind:      msg.kind,
              status:    msg.status,
              summary:   msg.summary,
              payload:   msg.payload,
              evidence:  msg.evidence,
              timestamp: msg.created_at,
              type:      eventType,
            });

            lastId = msg.id as string;
          }
        } catch {
          // Silenciar errores de polling
        }

        // Heartbeat cada 25s
        send('system_log', { type: 'system_log', message: '·', timestamp: new Date().toISOString() });

        await new Promise(r => setTimeout(r, 2000));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
