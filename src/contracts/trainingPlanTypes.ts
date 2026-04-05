import { MuscleGroupKey } from './muscleTypes';

export type PlanUniverse = 'balance' | 'performance_boost' | 'momentum';
export type PlanPhase = 'reactivation' | 'resumption' | 'maintenance' | 'progression' | 'recovery';
export type ReadinessBand = 'optimal' | 'stable' | 'constrained' | 'depleted' | 'unknown';
export type PlanStatus = 'active' | 'between_exercises' | 'out_of_plan' | 'completed' | 'no_plan' | 'rest_day';

export interface UserTrainingProfile {
  universe: PlanUniverse;
  phase: PlanPhase;
  inferredGoal: string;
  consistencyProfile: 'high' | 'medium' | 'low';
  preferredSessionLength: number; // in minutes
  observedExerciseAffinity: string[];
  observedEquipmentAffinity: 'gym' | 'home' | 'street';
  muscleBalanceProfile: Record<MuscleGroupKey | string, number>;
  progressionTolerance: 'aggressive' | 'steady' | 'cautious';
  constraintsKnown: string[];
  confidence: number; // 0.0 to 1.0
}

export interface DailyReadinessContext {
  sleepSignal: 'good' | 'fair' | 'poor' | 'unknown';
  recoverySignal: 'fresh' | 'recovering' | 'fatigued' | 'unknown';
  energySignal: 'high' | 'normal' | 'low' | 'unknown';
  recentLoad: number;
  sorenessProxy: number; // 0 to 1
  adherenceTrend: number; // 0 to 1
  timeWindowLikely: number; // in minutes
  readinessBand: ReadinessBand;
  confidence: number;
}

export interface TrainingExerciseNode {
  nodeId: string;
  exerciseId: string;
  name: string;
  groupTarget: string;
  sets: number;
  reps: number;
  recommendedWeight?: number;
  details?: string; // e.g., "(Barra ou Halteres)"
}

export interface TrainingPlanDefinition {
  planId: string;
  type: string;
  planIntent: 'training' | 'rest' | 'none';
  expectedDurationMinutes: number;
  focusMuscles: MuscleGroupKey[];
  sequence: TrainingExerciseNode[];
  shortVariantNodes?: TrainingExerciseNode[];
}

export interface SessionVariantDefinition {
  isShortVariantAvailable: boolean;
  shortVariantNodes?: TrainingExerciseNode[];
  extraSessionAllowed?: boolean;
  reason?: string;
}

export interface TrainingPlanViewModel {
  currentExercise: TrainingExerciseNode | null;
  nextExercise: TrainingExerciseNode | null;
  sessionVariant: SessionVariantDefinition | null;
  planStatus: PlanStatus;
  isOutOfPlan: boolean;
  outOfPlanLabel?: string;
  isSessionComplete: boolean;
  todayReadinessBand: ReadinessBand;
  planConfidence: number;
}
