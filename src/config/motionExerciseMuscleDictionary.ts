import { ExerciseMuscleProfile } from '../contracts/muscleTypes';

export const MUSCLE_DICTIONARY_VERSION = '2.0';

export const MotionExerciseMuscleDictionary: Record<string, ExerciseMuscleProfile> = {
  'leg_press': {
    primaryMuscleGroup: 'quads',
    primaryMuscles: ['quadríceps', 'glúteo máximo'],
    secondaryMuscles: ['posteriores da coxa', 'gémeos', 'core'],
    muscleDistribution: { quads: 0.45, glutes: 0.30, hamstrings: 0.12, calves: 0.05, core: 0.05, systemic: 0.03 },
    bodyMapZones: ['quad_zone', 'glute_zone', 'hamstring_zone', 'calf_zone', 'core_zone'],
    dominantZone: 'quad_zone'
  },
  'squat': {
    primaryMuscleGroup: 'quads',
    primaryMuscles: ['quadríceps', 'glúteos'],
    secondaryMuscles: ['posteriores da coxa', 'core', 'gémeos'],
    muscleDistribution: { quads: 0.30, glutes: 0.30, hamstrings: 0.15, core: 0.15, calves: 0.05, systemic: 0.05 },
    bodyMapZones: ['quad_zone', 'glute_zone', 'hamstring_zone', 'core_zone', 'calf_zone'],
    dominantZone: 'quad_zone'
  },
  'lunge': {
    primaryMuscleGroup: 'quads',
    primaryMuscles: ['quadríceps', 'glúteos'],
    secondaryMuscles: ['posteriores da coxa', 'core', 'gémeos'],
    muscleDistribution: { quads: 0.32, glutes: 0.28, hamstrings: 0.14, core: 0.12, calves: 0.08, systemic: 0.06 },
    bodyMapZones: ['quad_zone', 'glute_zone', 'hamstring_zone', 'core_zone', 'calf_zone'],
    dominantZone: 'quad_zone'
  },
  'bulgarian_split_squat': {
    primaryMuscleGroup: 'quads',
    primaryMuscles: ['quadríceps', 'glúteos'],
    secondaryMuscles: ['posteriores da coxa', 'core', 'gémeos'],
    muscleDistribution: { quads: 0.32, glutes: 0.28, hamstrings: 0.14, core: 0.12, calves: 0.08, systemic: 0.06 },
    bodyMapZones: ['quad_zone', 'glute_zone', 'hamstring_zone', 'core_zone', 'calf_zone'],
    dominantZone: 'quad_zone'
  },
  'romanian_deadlift': {
    primaryMuscleGroup: 'hamstrings',
    primaryMuscles: ['posteriores da coxa', 'glúteos'],
    secondaryMuscles: ['core', 'costas'],
    muscleDistribution: { hamstrings: 0.38, glutes: 0.30, core: 0.12, back: 0.12, systemic: 0.08 },
    bodyMapZones: ['hamstring_zone', 'glute_zone', 'core_zone', 'back_zone'],
    dominantZone: 'hamstring_zone'
  },
  'deadlift': {
    primaryMuscleGroup: 'glutes',
    primaryMuscles: ['glúteos', 'posteriores da coxa'],
    secondaryMuscles: ['costas', 'core', 'quadríceps'],
    muscleDistribution: { glutes: 0.28, hamstrings: 0.22, back: 0.18, core: 0.12, quads: 0.12, systemic: 0.08 },
    bodyMapZones: ['glute_zone', 'hamstring_zone', 'back_zone', 'core_zone', 'quad_zone'],
    dominantZone: 'glute_zone'
  },
  'hip_thrust': {
    primaryMuscleGroup: 'glutes',
    primaryMuscles: ['glúteos'],
    secondaryMuscles: ['posteriores da coxa', 'core'],
    muscleDistribution: { glutes: 0.55, hamstrings: 0.18, core: 0.12, quads: 0.05, systemic: 0.10 },
    bodyMapZones: ['glute_zone', 'hamstring_zone', 'core_zone'],
    dominantZone: 'glute_zone'
  },
  'calf_raise': {
    primaryMuscleGroup: 'calves',
    primaryMuscles: ['gémeos', 'sóleo'],
    secondaryMuscles: ['core'],
    muscleDistribution: { calves: 0.75, core: 0.08, systemic: 0.17 },
    bodyMapZones: ['calf_zone'],
    dominantZone: 'calf_zone'
  },
  'chest_press': {
    primaryMuscleGroup: 'chest',
    primaryMuscles: ['peitoral maior'],
    secondaryMuscles: ['deltóide anterior', 'tríceps'],
    muscleDistribution: { chest: 0.52, shoulders: 0.20, arms: 0.20, core: 0.03, systemic: 0.05 },
    bodyMapZones: ['chest_zone', 'shoulder_zone', 'arm_zone'],
    dominantZone: 'chest_zone'
  },
  'bench_press': {
    primaryMuscleGroup: 'chest',
    primaryMuscles: ['peitoral maior'],
    secondaryMuscles: ['deltóide anterior', 'tríceps'],
    muscleDistribution: { chest: 0.50, shoulders: 0.18, arms: 0.22, core: 0.03, systemic: 0.07 },
    bodyMapZones: ['chest_zone', 'shoulder_zone', 'arm_zone'],
    dominantZone: 'chest_zone'
  },
  'shoulder_press': {
    primaryMuscleGroup: 'shoulders',
    primaryMuscles: ['deltóides'],
    secondaryMuscles: ['tríceps', 'trapézio superior', 'core'],
    muscleDistribution: { shoulders: 0.50, arms: 0.22, back: 0.08, core: 0.08, systemic: 0.12 },
    bodyMapZones: ['shoulder_zone', 'arm_zone', 'back_zone', 'core_zone'],
    dominantZone: 'shoulder_zone'
  },
  'lat_pulldown': {
    primaryMuscleGroup: 'back',
    primaryMuscles: ['grande dorsal'],
    secondaryMuscles: ['bíceps', 'rombóides', 'deltóide posterior'],
    muscleDistribution: { back: 0.56, arms: 0.20, shoulders: 0.10, core: 0.04, systemic: 0.10 },
    bodyMapZones: ['back_zone', 'arm_zone', 'shoulder_zone'],
    dominantZone: 'back_zone'
  },
  'seated_row': {
    primaryMuscleGroup: 'back',
    primaryMuscles: ['grande dorsal', 'rombóides'],
    secondaryMuscles: ['bíceps', 'deltóide posterior', 'core'],
    muscleDistribution: { back: 0.52, arms: 0.20, shoulders: 0.10, core: 0.06, systemic: 0.12 },
    bodyMapZones: ['back_zone', 'arm_zone', 'shoulder_zone', 'core_zone'],
    dominantZone: 'back_zone'
  },
  'biceps_curl': {
    primaryMuscleGroup: 'arms',
    primaryMuscles: ['bíceps braquial'],
    secondaryMuscles: ['braquial', 'braquiorradial'],
    muscleDistribution: { arms: 0.78, shoulders: 0.05, systemic: 0.17 },
    bodyMapZones: ['arm_zone'],
    dominantZone: 'arm_zone'
  },
  'triceps_pushdown': {
    primaryMuscleGroup: 'arms',
    primaryMuscles: ['tríceps'],
    secondaryMuscles: ['deltóide', 'core'],
    muscleDistribution: { arms: 0.76, shoulders: 0.06, core: 0.03, systemic: 0.15 },
    bodyMapZones: ['arm_zone', 'shoulder_zone'],
    dominantZone: 'arm_zone'
  },
  'leg_extension': {
    primaryMuscleGroup: 'quads',
    primaryMuscles: ['quadríceps'],
    secondaryMuscles: ['nenhum_relevante_ou_sistemico'],
    muscleDistribution: { quads: 0.82, systemic: 0.18 },
    bodyMapZones: ['quad_zone'],
    dominantZone: 'quad_zone'
  },
  'leg_curl': {
    primaryMuscleGroup: 'hamstrings',
    primaryMuscles: ['posteriores da coxa'],
    secondaryMuscles: ['gémeos'],
    muscleDistribution: { hamstrings: 0.78, calves: 0.06, systemic: 0.16 },
    bodyMapZones: ['hamstring_zone', 'calf_zone'],
    dominantZone: 'hamstring_zone'
  }
};

/**
 * Returns mapped muscle metadata for an exercise ID.
 * Employs absolute explicit fallback to avoid downstream calculation crashes.
 */
export const resolveExerciseMuscleProfile = (exerciseId: string): ExerciseMuscleProfile => {
  const profile = MotionExerciseMuscleDictionary[exerciseId.toLowerCase()];
  
  if (!profile) {
    return {
      primaryMuscleGroup: 'systemic',
      primaryMuscles: ['Global/Indeterminado'],
      secondaryMuscles: [],
      muscleDistribution: { systemic: 1.0 },
      bodyMapZones: ['systemic_overlay'],
      dominantZone: 'systemic_overlay'
    };
  }

  return profile;
};
