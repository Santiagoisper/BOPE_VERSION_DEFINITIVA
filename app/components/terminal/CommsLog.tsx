"use client";

import { useEffect, useRef } from "react";
import type { SSEEvent, SSEEventType } from "@/lib/useSSE";

interface CommsLogProps {
  events: SSEEvent[];
}

const EVENT_COLOR: Record<SSEEventType, string> = {
  HANDOFF_INITIATED: "text-yellow-400",
  AGENT_REPLIED: "text-green-400",
  system_log: "text-gray-400",
  MISSION_UPDATED: "text-gray-400",
};

const ERROR_KEYWORDS = ["error", "failed", "fail"];

function getLineColor(event: SSEEvent): string {
  const msg = event.message.toLowerCase();
  if (ERROR_KEYWORDS.some((kw) => msg.includes(kw))) {
    return "text-red-400";
  }
  return EVENT_COLOR[event.type] ?? "text-gray-400";
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").slice(0, 23);
  } catch {
    return iso;
  }
}

export default function CommsLog({ events }: CommsLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
      {events.length === 0 ? (
        <p className="text-gray-600 italic">— Esperando eventos SSE... —</p>
      ) : (
        events.map((event) => (
          <div key={`${event.id}-${event.timestamp}`} className="flex gap-2 leading-5">
            <span className="text-gray-600 flex-shrink-0 select-none">
              [{formatTimestamp(event.timestamp)}]
            </span>
            <span className="text-gray-500 flex-shrink-0 select-none min-w-[60px]">
              [{event.agent ?? event.type}]
            </span>
            <span className={`${getLineColor(event)} break-all`}>
              {event.message}
            </span>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
