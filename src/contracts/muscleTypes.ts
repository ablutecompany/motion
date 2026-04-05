export type MuscleGroupKey = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'systemic';

export type BodyMapZoneKey = 
  | 'chest_zone'
  | 'back_zone'
  | 'shoulder_zone'
  | 'arm_zone'
  | 'core_zone'
  | 'glute_zone'
  | 'quad_zone'
  | 'hamstring_zone'
  | 'calf_zone'
  | 'systemic_overlay';

export type MuscleDistribution = Partial<Record<MuscleGroupKey, number>>;

export interface ExerciseMuscleProfile {
  primaryMuscleGroup: MuscleGroupKey;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  muscleDistribution: MuscleDistribution;
  bodyMapZones: BodyMapZoneKey[];
  dominantZone: BodyMapZoneKey;
}
