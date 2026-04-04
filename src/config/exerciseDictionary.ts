/**
 * Dictionary Version 1.0
 * Centralized mapping of exercise IDs to physiological zones.
 * Never guess muscles in UI components.
 */

export const DICTIONARY_VERSION = '1.0';

export const MotionExerciseDictionary: Record<string, string[]> = {
  // PUSH
  'pushup': ['upper-front', 'core', 'systemic'],
  'bench_press': ['upper-front', 'systemic'],
  'shoulder_press': ['upper-front', 'upper-back'],
  
  // PULL
  'pullup': ['upper-back', 'core', 'systemic'],
  'row': ['upper-back', 'systemic'],

  // CORE
  'plank': ['core', 'systemic'],
  'crunches': ['core'],
  'russian_twist': ['core'],

  // LOWER
  'squat': ['lower-front', 'core', 'systemic'],
  'deadlift': ['lower-back', 'lower-front', 'core', 'upper-back', 'systemic'],
  'lunge': ['lower-front', 'systemic'],

  // CARDIO / SYSTEMIC
  'run': ['lower-front', 'lower-back', 'systemic'],
  'jump_rope': ['lower-front', 'systemic'],
  'burpee': ['upper-front', 'lower-front', 'core', 'systemic'],

  // MOBILITY
  'yoga_flow': ['core', 'systemic'],
  'stretching': ['systemic']
};

/**
 * Returns mapped regions or a safe fallback.
 * Never breaks the pipeline.
 */
export const resolveMuscleDistribution = (exerciseId: string): string[] => {
  const mapped = MotionExerciseDictionary[exerciseId.toLowerCase()];
  if (!mapped || mapped.length === 0) {
    return ['unknown', 'systemic'];
  }
  return mapped;
};
