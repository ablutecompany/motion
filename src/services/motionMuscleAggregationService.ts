import { KinematicExerciseLog, ConfirmedWorkoutRecord } from '../contracts/types';
import { MuscleGroupKey, MuscleDistribution } from '../contracts/muscleTypes';
import { resolveExerciseMuscleProfile, MUSCLE_DICTIONARY_VERSION } from '../config/motionExerciseMuscleDictionary';

export interface SessionMuscleTotals {
  totals: Record<MuscleGroupKey, number>;
  dominantMuscleGroup: MuscleGroupKey | 'systemic';
}

/**
 * motionMuscleAggregationService
 *
 * Fully deterministic logic. Computes explicitly based on ABSOLUTE EXECUTION SCORE.
 */
export const aggregateKinematicMuscleScores = (
  exercises: KinematicExerciseLog[]
): {
  enrichedExercises: KinematicExerciseLog[],
  sessionTotals: SessionMuscleTotals
} => {
  const sessionAccumulator: Record<string, number> = {
    chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, glutes: 0, quads: 0, hamstrings: 0, calves: 0, systemic: 0
  };

  const enrichedExercises = exercises.map(ex => {
    // Determine absolute score to distribute
    // If the legacy structure used `totalScore` as the single exercise score, we gracefully fallback to it.
    // However, the canonical field is now `executionScore`.
    const baseScore = ex.executionScore ?? ex.totalScore ?? 0;

    const profile = resolveExerciseMuscleProfile(ex.exerciseId);
    const resolvedDistribution: MuscleDistribution = {};

    // Calculate closed formula: resolvedMuscleScore[group] = exerciseExecutionScore * muscleDistribution[group]
    Object.entries(profile.muscleDistribution).forEach(([group, percentage]) => {
      if (percentage) {
        const slicedScore = Math.floor(baseScore * percentage);
        resolvedDistribution[group as MuscleGroupKey] = slicedScore;
        sessionAccumulator[group] += slicedScore;
      }
    });

    return {
      ...ex,
      muscleDistributionResolved: resolvedDistribution,
      primaryMuscleGroup: profile.primaryMuscleGroup,
      bodyMapZones: profile.bodyMapZones,
      dictionaryVersion: MUSCLE_DICTIONARY_VERSION,
      scoringVersion: '4.1'
    };
  });

  // Calculate Dominant Group for the Session
  let dominantGroup: MuscleGroupKey | 'systemic' = 'systemic';
  let maxScore = -1;
  const groupsToExcludeFromDominance = ['systemic']; // Systemic is a fallback, we prefer actual muscles

  Object.entries(sessionAccumulator).forEach(([group, score]) => {
    if (score > maxScore && !groupsToExcludeFromDominance.includes(group)) {
      maxScore = score;
      dominantGroup = group as MuscleGroupKey;
    }
  });

  // If no muscles fired above 0 (maybe only systemic), fallback to systemic
  if (maxScore <= 0) {
    dominantGroup = 'systemic';
  }

  return {
    enrichedExercises,
    sessionTotals: {
      totals: sessionAccumulator as Record<MuscleGroupKey, number>,
      dominantMuscleGroup: dominantGroup
    }
  };
};

/**
 * Extracts session totals safely from potentially legacy schemas without crashing.
 */
export const extractLegacySafeSessionTotals = (
  record: ConfirmedWorkoutRecord
): Record<MuscleGroupKey, number> => {
  const accumulator: Record<string, number> = {
    chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, glutes: 0, quads: 0, hamstrings: 0, calves: 0, systemic: 0
  };

  // Modern Path (If the record is already V4.1 frozen)
  if (record.muscleDistributionResolved && Object.keys(record.muscleDistributionResolved).length > 0) {
    Object.entries(record.muscleDistributionResolved).forEach(([group, score]) => {
      if (accumulator[group] !== undefined) {
        accumulator[group] += (score as number) || 0;
      }
    });
    return accumulator as Record<MuscleGroupKey, number>;
  }

  // Legacy Path Fallback
  // If we have executed exercises, attempt to aggregate them
  if (record.executedExercises && record.executedExercises.length > 0) {
    const fallbackAggregation = aggregateKinematicMuscleScores(record.executedExercises);
    return fallbackAggregation.sessionTotals.totals;
  }

  // Absolute empty fallback
  accumulator.systemic = record.totalExecutionScore || 0;
  return accumulator as Record<MuscleGroupKey, number>;
};
