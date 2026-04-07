"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type SSEEventType =
  | "MISSION_UPDATED"
  | "AGENT_REPLIED"
  | "HANDOFF_INITIATED"
  | "system_log";

export interface SSEEvent {
  id: string;
  type: SSEEventType;
  timestamp: string;
  agent?: string;
  message: string;
  raw: Record<string, unknown>;
}

const MAX_EVENTS = 50;
const RECONNECT_DELAY_MS = 3000;

export function useSSE(slug: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSlug = useRef<string | null>(null);

  const addEvent = useCallback((event: SSEEvent) => {
    setEvents((prev) => {
      const next = [...prev, event];
      return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
    });
  }, []);

  const connect = useCallback(
    (missionSlug: string) => {
      // Clean up existing connection
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const url = `/api/mission/${missionSlug}/sse`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      // Handle named event types from the orchestrator contract
      const handleEvent = (type: SSEEventType) => (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data) as Record<string, unknown>;
          const sseEvent: SSEEvent = {
            id: (raw.taskId as string) ?? crypto.randomUUID(),
            type,
            timestamp: new Date().toISOString(),
            agent: (raw.agent as string) ?? undefined,
            message: buildMessage(type, raw),
            raw,
          };
          addEvent(sseEvent);
        } catch {
          // Ignore malformed events
        }
      };

      es.addEventListener("MISSION_UPDATED", handleEvent("MISSION_UPDATED"));
      es.addEventListener("AGENT_REPLIED", handleEvent("AGENT_REPLIED"));
      es.addEventListener("HANDOFF_INITIATED", handleEvent("HANDOFF_INITIATED"));

      // Fallback: unnamed messages
      es.onmessage = (e: MessageEvent) => {
        try {
          const raw = JSON.parse(e.data) as Record<string, unknown>;
          const type =
            (raw.type as SSEEventType) ?? "system_log";
          const sseEvent: SSEEvent = {
            id: (raw.taskId as string) ?? crypto.randomUUID(),
            type,
            timestamp: new Date().toISOString(),
            agent: (raw.agent as string) ?? undefined,
            message: buildMessage(type, raw),
            raw,
          };
          addEvent(sseEvent);
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;

        // Reconnect after delay if slug is still active
        reconnectTimer.current = setTimeout(() => {
          if (activeSlug.current === missionSlug) {
            connect(missionSlug);
          }
        }, RECONNECT_DELAY_MS);
      };
    },
    [addEvent]
  );

  useEffect(() => {
    if (!slug) return;

    activeSlug.current = slug;
    connect(slug);

    return () => {
      activeSlug.current = null;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
    };
  }, [slug, connect]);

  return { events, connected };
}

function buildMessage(
  type: SSEEventType,
  raw: Record<string, unknown>
): string {
  switch (type) {
    case "MISSION_UPDATED":
      return `Misión actualizada — estado: ${raw.status ?? "unknown"} | taskId: ${raw.taskId ?? "?"}`;
    case "AGENT_REPLIED":
      return `${raw.agent ?? "AGENT"} respondió — ${raw.reasoning ?? raw.result ?? "sin detalle"}`;
    case "HANDOFF_INITIATED":
      return `Handoff: ${raw.from ?? "?"} → ${raw.to ?? "?"} | motivo: ${raw.reason ?? "?"}`;
    case "system_log":
    default:
      return (raw.message as string) ?? JSON.stringify(raw);
  }
}
