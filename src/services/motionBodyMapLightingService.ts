import { MuscleGroupKey, BodyMapZoneKey } from '../contracts/muscleTypes';

export interface BodyMapLightingResult {
  bodyMapIntensityByZone: Record<BodyMapZoneKey, number>;
  activeZones: BodyMapZoneKey[];
  dominantZone: BodyMapZoneKey;
  dominantMuscleGroup: MuscleGroupKey | 'systemic';
}

const MUSCLE_TO_ZONE_MAP: Record<MuscleGroupKey | 'systemic', BodyMapZoneKey> = {
  chest: 'chest_zone',
  back: 'back_zone',
  shoulders: 'shoulder_zone',
  arms: 'arm_zone',
  core: 'core_zone',
  glutes: 'glute_zone',
  quads: 'quad_zone',
  hamstrings: 'hamstring_zone',
  calves: 'calf_zone',
  systemic: 'systemic_overlay'
};

/**
 * motionBodyMapLightingService
 * 
 * Maps aggregated muscle score totals into visual intensity ranges for the UI Body Map.
 */
export const calculateBodyMapLighting = (
  muscleTotals: Record<MuscleGroupKey | 'systemic' | string, number>
): BodyMapLightingResult => {
  const bodyMapIntensityByZone: Partial<Record<BodyMapZoneKey, number>> = {};
  const activeZones: BodyMapZoneKey[] = [];
  
  let dominantMuscleGroup: MuscleGroupKey | 'systemic' = 'systemic';
  let dominantZone: BodyMapZoneKey = 'systemic_overlay';
  let maxScore = -1;

  Object.entries(muscleTotals).forEach(([muscleGroup, score]) => {
    if (score > 0) {
      const zoneKey = MUSCLE_TO_ZONE_MAP[muscleGroup as MuscleGroupKey | 'systemic'];
      if (zoneKey) {
        // Here we assign the raw score for the UI to interpret relative intensity
        // Or we can normalize it. But preserving raw score allows the UI to 
        // dynamically scale alpha based on the largest value.
        bodyMapIntensityByZone[zoneKey] = (bodyMapIntensityByZone[zoneKey] || 0) + score;
        
        if (!activeZones.includes(zoneKey)) {
          activeZones.push(zoneKey);
        }

        if (score > maxScore && muscleGroup !== 'systemic') {
          maxScore = score;
          dominantMuscleGroup = muscleGroup as MuscleGroupKey;
          dominantZone = zoneKey;
        }
      }
    }
  });

  // Fallback to systemic dominant if map is completely empty
  if (maxScore <= 0) {
    if (bodyMapIntensityByZone['systemic_overlay']) {
      dominantZone = 'systemic_overlay';
      dominantMuscleGroup = 'systemic';
    } else {
      // Complete fallback
      dominantZone = 'systemic_overlay';
      dominantMuscleGroup = 'systemic';
      activeZones.push('systemic_overlay');
      bodyMapIntensityByZone['systemic_overlay'] = 1;
    }
  }

  return {
    bodyMapIntensityByZone: bodyMapIntensityByZone as Record<BodyMapZoneKey, number>,
    activeZones,
    dominantZone,
    dominantMuscleGroup
  };
};
