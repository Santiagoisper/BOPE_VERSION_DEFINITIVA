import type {
  SoldierBaseProfile,
  SoldierWithRecords,
} from './soldierProfiles';
import type { WarRoomStateFile, WarRoomSoldierStats } from './types';

function zeroStats(): WarRoomSoldierStats {
  return {
    missionsParticipated: 0,
    sanctionsTotal: 0,
    decorationsMedalCodes: [],
    lastMissionId: null,
    lastMissionDate: null,
    approxLinesTotal: 0,
  };
}

/** Estado vacío por soldado hasta que llegue el JSON público */
export function emptyWarRoomState(ids: readonly string[]): WarRoomStateFile {
  const soldiers: WarRoomStateFile['soldiers'] = {};
  for (const id of ids) {
    soldiers[id] = { stats: zeroStats(), missionLog: [] };
  }
  return {
    version: 0,
    notes: 'Estado local vacío hasta cargar /warroom-state.json',
    commander: { stats: zeroStats(), missionLog: [] },
    soldiers,
  };
}

export function mergeSoldiersWithCodexRecords(
  base: readonly SoldierBaseProfile[],
  file: WarRoomStateFile | null,
): SoldierWithRecords[] {
  const state = file?.soldiers ?? {};
  return base.map((profile) => {
    const overlay = state[profile.id];
    const stats = overlay?.stats ?? zeroStats();
    const missionLog = [...(overlay?.missionLog ?? [])];

    const medalsSorted = [...new Set(stats.decorationsMedalCodes)];

    return {
      ...profile,
      medals: medalsSorted,
      missions: stats.missionsParticipated,
      sanctions: stats.sanctionsTotal,
      codexApproxLinesTotal: stats.approxLinesTotal,
      lastMissionId: stats.lastMissionId,
      lastMissionDate: stats.lastMissionDate,
      missionHistory: missionLog,
    };
  });
}
