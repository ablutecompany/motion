export interface UserProfileContext {
  userId: string;
  objectivePrimary: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingAgeYears: number;
  daysPerWeekAvailable: number;
  equipmentAccess: 'home_no_gear' | 'home_dumbbells' | 'gym_standard' | 'gym_premium';
  injuriesOrLimitations: string[];
  sleepReadiness: 'optimal' | 'stable' | 'constrained' | 'depleted';
  fatigueState: 'fresh' | 'recovering' | 'high_fatigue';
  soreness: number; // 0 (none) to 10 (crippling)
  preferenceProfile: 'strength' | 'hypertrophy' | 'endurance' | 'mixed';
  sessionTimeAvailable: number; // in minutes
  contextualFlags: string[];
}

export interface TrainingStrategy {
  strategyId: string;
  goalFocus: string;
  splitType: 'fullbody' | 'upper_lower' | 'push_pull_legs' | 'bro_split' | 'custom';
  frequency: number; // days per week
  targetMuscleDistribution: Record<string, number>; // e.g. { chest: 0.3, back: 0.3, legs: 0.4 }
  progressionStyle: 'linear' | 'undulating' | 'block' | 'reactive';
  recoveryPolicy: 'aggressive' | 'standard' | 'cautious';
  allowedExerciseRotation: 'flexible' | 'strict';
  repetitionPolicy: string; // e.g. '8-12 rep range baseline'
  loadProgressionPolicy: string;
  deloadFlag: boolean;
}

export interface ExerciseFeatureDef {
  id: string;
  name: string;
  family: string;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipmentNeeded: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'mixed';
  
  // Kinematic Kinesthetic Mapping (Motor de Deteção)
  movementPattern: 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull' | 'squat' | 'hinge' | 'lunge' | 'isolation' | 'rotation';
  primaryPlane: 'sagittal' | 'frontal' | 'transverse' | 'multi';
  dominantAxis?: 'X' | 'Y' | 'Z' | 'multi';
  expectedPhonePlacement: string;
  expectedSignalProfile: 'sine_wave_clean' | 'impulse_heavy' | 'complex_multi_axis' | 'static_iso';
  validMotionDescription: string;     // Para o algorítmo ler (Opcionalmente para UI debug)
  ignoredMotionDescription: string;   // Falsos positivos descartados
  falsePositiveRisks: string[];
  trackingNotes: string[];
  supportsMotionTracking: boolean;

  // Visual & Assets Policy (UX/UI)
  headerImageKey: string;
  fallbackImageKey: string;
  imageGuidance: string;

  // Human Instructions (Para o popup do Treinador PT-PT limpo)
  howToPerform: string;
  whatToAvoid: string;
  phonePlacementText: string;
  shortCoachingCue: string;

  // Rx Defaults
  defaultSets: number;
  defaultReps: number;
  defaultRestSeconds: number;
  defaultLoadStrategy?: 'rpe_7' | 'rpe_8' | 'rpe_9' | 'amrap' | 'percentage_1rm';
  
  // Rules
  contraindicationNotes: string[];
  coachingNotes: string[];
}

export interface DailySessionBlock {
  blockId: string;
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetLoad?: number;
  restSeconds: number;
  optionality: 'mandatory' | 'fallback' | 'optional';
  notes?: string;
  order: number;
}

export interface DailySession {
  sessionId: string;
  strategyId: string; // Foreign key back to TrainingStrategy
  dateContext: string; // Expected execute date or day index
  name: string; // e.g. "Upper Body Power"
  readinessContext: string; // snapshots why this was derived
  orderedBlocks: DailySessionBlock[];
}
