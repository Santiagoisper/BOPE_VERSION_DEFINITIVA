import { MISSIONS } from "@/data/missions";
import type { Mission, MissionStatus } from "@/types";

export function getMissions(): Mission[] {
  return MISSIONS;
}

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function getMissionsByStatus(status: MissionStatus): Mission[] {
  return MISSIONS.filter((m) => m.status === status);
}

export function getActiveMissions(): Mission[] {
  return MISSIONS.filter((m) => m.status === "active");
}

export function getMissionTotalCost(id: string): number {
  const mission = getMissionById(id);
  if (!mission) return 0;
  return mission.events.reduce((sum, e) => sum + (e.cost ?? 0), 0);
}
