export type MedalCode = string;

export type MissionEffectMedal = { kind: 'medal'; code: MedalCode };
export type MissionEffectSanction = { kind: 'sanction'; label: string };

export type MissionEffect = MissionEffectMedal | MissionEffectSanction;

export interface WarRoomMissionRecord {
  missionId: string;
  role: string;
  approxLines: number | null;
  resultado: string;
  effects?: MissionEffect[];
}

export interface WarRoomSoldierStats {
  missionsParticipated: number;
  sanctionsTotal: number;
  decorationsMedalCodes: MedalCode[];
  lastMissionId: string | null;
  lastMissionDate: string | null;
  approxLinesTotal: number;
}

export interface WarRoomSoldierState {
  stats: WarRoomSoldierStats;
  missionLog: WarRoomMissionRecord[];
}

export interface WarRoomStateFile {
  version: number;
  canonicalMarkdown?: string;
  notes?: string;
  commander: {
    alias?: string;
    stats: WarRoomSoldierStats;
    missionLog: WarRoomMissionRecord[];
  };
  soldiers: Record<string, WarRoomSoldierState>;
}
