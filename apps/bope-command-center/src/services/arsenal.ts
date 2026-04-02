import { MODEL_PROVIDERS, TOOL_CONNECTIONS } from "@/data/arsenal";
import type { ModelProvider, ToolConnection } from "@/types";

export function getProviders(): ModelProvider[] {
  return MODEL_PROVIDERS;
}

export function getProviderById(id: string): ModelProvider | undefined {
  return MODEL_PROVIDERS.find((p) => p.id === id);
}

export function getTools(): ToolConnection[] {
  return TOOL_CONNECTIONS;
}

export function getConnectedTools(): ToolConnection[] {
  return TOOL_CONNECTIONS.filter((t) => t.status === "connected");
}
