import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AgentStatus, MissionStatus, MissionPriority, SanctionSeverity, MedalType, AgentRank } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `hace ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

export function agentStatusLabel(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    active: "Activo",
    standby: "En espera",
    offline: "Offline",
    sanctioned: "Sancionado",
    on_mission: "En misión",
  };
  return map[status];
}

export function missionStatusLabel(status: MissionStatus): string {
  const map: Record<MissionStatus, string> = {
    planning: "Planificación",
    active: "Activa",
    completed: "Completada",
    failed: "Fallida",
    aborted: "Abortada",
  };
  return map[status];
}

export function priorityLabel(priority: MissionPriority): string {
  const map: Record<MissionPriority, string> = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
    critical: "Crítica",
  };
  return map[priority];
}

export function sanctionLabel(severity: SanctionSeverity): string {
  const map: Record<SanctionSeverity, string> = {
    minor: "Menor",
    major: "Mayor",
    critical: "Crítica",
  };
  return map[severity];
}

export function agentStatusColor(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    active: "text-green-400",
    standby: "text-amber",
    offline: "text-muted-foreground",
    sanctioned: "text-red-500",
    on_mission: "text-blue-400",
  };
  return map[status];
}

export function agentStatusDotClass(status: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    active: "status-dot-active",
    standby: "status-dot-standby",
    offline: "status-dot-offline",
    sanctioned: "status-dot-sanctioned",
    on_mission: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]",
  };
  return map[status];
}

export function missionStatusColor(status: MissionStatus): string {
  const map: Record<MissionStatus, string> = {
    planning: "text-blue-400",
    active: "text-amber",
    completed: "text-green-400",
    failed: "text-red-500",
    aborted: "text-muted-foreground",
  };
  return map[status];
}

export function priorityColor(priority: MissionPriority): string {
  const map: Record<MissionPriority, string> = {
    low: "text-muted-foreground",
    medium: "text-blue-400",
    high: "text-amber",
    critical: "text-red-500",
  };
  return map[priority];
}

export function priorityBadgeClass(priority: MissionPriority): string {
  const map: Record<MissionPriority, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-950 text-blue-300 border border-blue-800",
    high: "bg-amber-950 text-amber-300 border border-amber-800",
    critical: "bg-red-950 text-red-300 border border-red-800",
  };
  return map[priority];
}

export function sanctionColor(severity: SanctionSeverity): string {
  const map: Record<SanctionSeverity, string> = {
    minor: "text-amber",
    major: "text-orange-400",
    critical: "text-red-500",
  };
  return map[severity];
}

export type MedalMeta = {
  abbreviation: string;
  label: string;
  labelEs: string;
  color: string;
  ribbonColors: string[];
  precedence: number;
};

export const MEDAL_META: Record<MedalType, MedalMeta> = {
  medal_of_honor: {
    abbreviation: "MOH",
    label: "Medal of Honor",
    labelEs: "Medalla de Honor",
    color: "text-sky-400",
    ribbonColors: ["#5B9EF0", "#FFFFFF", "#5B9EF0", "#FFFFFF", "#5B9EF0"],
    precedence: 1,
  },
  navy_cross: {
    abbreviation: "NC",
    label: "Navy Cross",
    labelEs: "Cruz Naval",
    color: "text-blue-400",
    ribbonColors: ["#1A2744", "#B0B0B0", "#1A2744", "#B0B0B0", "#1A2744"],
    precedence: 2,
  },
  silver_star: {
    abbreviation: "SS",
    label: "Silver Star",
    labelEs: "Estrella de Plata",
    color: "text-slate-300",
    ribbonColors: ["#B22234", "#FFFFFF", "#1A2744", "#FFFFFF", "#B22234"],
    precedence: 3,
  },
  bronze_star: {
    abbreviation: "BSM",
    label: "Bronze Star",
    labelEs: "Estrella de Bronce",
    color: "text-amber",
    ribbonColors: ["#B22234", "#FFFFFF", "#1A2744", "#F5B730", "#1A2744"],
    precedence: 4,
  },
  purple_heart: {
    abbreviation: "PH",
    label: "Purple Heart",
    labelEs: "Corazón Púrpura",
    color: "text-purple-400",
    ribbonColors: ["#6B21A8", "#F5B730", "#6B21A8", "#F5B730", "#6B21A8"],
    precedence: 5,
  },
  meritorious_service: {
    abbreviation: "MSM",
    label: "Meritorious Service",
    labelEs: "Servicio Meritorio",
    color: "text-red-400",
    ribbonColors: ["#B22234", "#FFFFFF", "#B22234", "#FFFFFF", "#B22234"],
    precedence: 6,
  },
  commendation: {
    abbreviation: "NMCCM",
    label: "Commendation Medal",
    labelEs: "Medalla de Mención",
    color: "text-green-400",
    ribbonColors: ["#15803D", "#F5B730", "#15803D", "#F5B730", "#15803D"],
    precedence: 7,
  },
  achievement: {
    abbreviation: "NMCAM",
    label: "Achievement Medal",
    labelEs: "Medalla de Logro",
    color: "text-emerald-400",
    ribbonColors: ["#15803D", "#FFFFFF", "#15803D", "#FFFFFF", "#15803D"],
    precedence: 8,
  },
  good_conduct: {
    abbreviation: "GCM",
    label: "Good Conduct Medal",
    labelEs: "Medalla de Buena Conducta",
    color: "text-rose-300",
    ribbonColors: ["#B22234", "#B22234", "#B22234", "#B22234", "#B22234"],
    precedence: 9,
  },
};

export function medalColor(type: MedalType): string {
  return MEDAL_META[type].color;
}

export function medalLabel(type: MedalType): string {
  return MEDAL_META[type].labelEs;
}

export type RankMeta = {
  abbreviation: string;
  titleEs: string;
  tier: number;
  ribbonStripes: { color: string; flex: number }[];
};

export const RANK_META: Record<AgentRank, RankMeta> = {
  private: {
    abbreviation: "Pvt",
    titleEs: "Recluta",
    tier: 1,
    ribbonStripes: [
      { color: "#B22234", flex: 4 },
    ],
  },
  private_first_class: {
    abbreviation: "PFC",
    titleEs: "Soldado de 1ª",
    tier: 2,
    ribbonStripes: [
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 1 },
    ],
  },
  lance_corporal: {
    abbreviation: "LCpl",
    titleEs: "Cabo Lanza",
    tier: 3,
    ribbonStripes: [
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 1 },
    ],
  },
  corporal: {
    abbreviation: "Cpl",
    titleEs: "Cabo",
    tier: 4,
    ribbonStripes: [
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 1 },
    ],
  },
  sergeant: {
    abbreviation: "Sgt",
    titleEs: "Sargento",
    tier: 5,
    ribbonStripes: [
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 3 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 3 },
      { color: "#F5B730", flex: 1 },
    ],
  },
  staff_sergeant: {
    abbreviation: "SSgt",
    titleEs: "Sargento de Estado Mayor",
    tier: 6,
    ribbonStripes: [
      { color: "#F5B730", flex: 2 },
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 2 },
      { color: "#B22234", flex: 2 },
      { color: "#F5B730", flex: 2 },
    ],
  },
  gunnery_sergeant: {
    abbreviation: "GySgt",
    titleEs: "Sargento de Artillería",
    tier: 7,
    ribbonStripes: [
      { color: "#F5B730", flex: 2 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 3 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 2 },
    ],
  },
  master_sergeant: {
    abbreviation: "MSgt",
    titleEs: "Sargento Mayor",
    tier: 8,
    ribbonStripes: [
      { color: "#F5B730", flex: 3 },
      { color: "#B22234", flex: 1 },
      { color: "#1A2744", flex: 1 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 3 },
    ],
  },
  first_sergeant: {
    abbreviation: "1Sgt",
    titleEs: "Primer Sargento",
    tier: 8,
    ribbonStripes: [
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 4 },
      { color: "#1A2744", flex: 1 },
      { color: "#F5B730", flex: 4 },
      { color: "#B22234", flex: 1 },
    ],
  },
  master_gunnery_sergeant: {
    abbreviation: "MGySgt",
    titleEs: "Sargento Mayor de Artillería",
    tier: 9,
    ribbonStripes: [
      { color: "#F5B730", flex: 4 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 4 },
    ],
  },
  sergeant_major: {
    abbreviation: "SgtMaj",
    titleEs: "Sargento Mayor de Batallón",
    tier: 9,
    ribbonStripes: [
      { color: "#F5B730", flex: 5 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 1 },
      { color: "#B22234", flex: 1 },
      { color: "#F5B730", flex: 5 },
    ],
  },
};
