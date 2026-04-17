import { UserProfileContext, TrainingStrategy, DailySession } from '../contracts/planCoreDefinitions';

export const MOCK_USER_PROFILE: UserProfileContext = {
  userId: 'usr_001_core',
  objectivePrimary: 'hypertrophy',
  experienceLevel: 'intermediate',
  trainingAgeYears: 2.5,
  daysPerWeekAvailable: 4,
  equipmentAccess: 'gym_standard',
  injuriesOrLimitations: ['mild_rotator_cuff_sensitivity'],
  sleepReadiness: 'stable',
  fatigueState: 'recovering',
  soreness: 3,
  preferenceProfile: 'hypertrophy',
  sessionTimeAvailable: 60,
  contextualFlags: ['desk_worker_tight_hips']
};

export const MOCK_STRATEGIES: TrainingStrategy[] = [
  {
    strategyId: 'str_push_pull_legs_01',
    goalFocus: 'Mass Accumulation & Structural Balance',
    splitType: 'push_pull_legs',
    frequency: 4,
    targetMuscleDistribution: { chest: 0.2, back: 0.2, legs: 0.4, arms: 0.2 },
    progressionStyle: 'linear',
    recoveryPolicy: 'standard',
    allowedExerciseRotation: 'flexible',
    repetitionPolicy: 'Hipertrofia Clássica: 8 a 15 repetições para fadiga local.',
    loadProgressionPolicy: 'Subir carga ao atingir +2 repetições limpas na 1ª série.',
    deloadFlag: false
  },
  {
    strategyId: 'str_fullbody_maintenance',
    goalFocus: 'Functional Maintenance & Joint Health',
    splitType: 'fullbody',
    frequency: 3,
    targetMuscleDistribution: { chest: 0.25, back: 0.25, legs: 0.3, core: 0.2 },
    progressionStyle: 'reactive',
    recoveryPolicy: 'cautious',
    allowedExerciseRotation: 'strict',
    repetitionPolicy: 'Consistência mecânica: 10-12 reps perfeitamente estabilizadas.',
    loadProgressionPolicy: 'Aumentar carga apenas com readines ÓTIMA confirmada.',
    deloadFlag: false
  }
];

export const MOCK_DAILY_SESSIONS: DailySession[] = [
  // Session derived from Strategy PPL (Push day)
  {
    sessionId: 'sess_ppl_push_1',
    strategyId: 'str_push_pull_legs_01',
    name: 'Push: Peitoral, Ombros & Tríceps',
    dateContext: 'Hoje',
    readinessContext: 'Desenhada para acomodar recuperação sólida (Soreness: 3)',
    orderedBlocks: [
      { blockId: 'b1', exerciseId: 'bench-press', targetSets: 4, targetReps: 8, targetLoad: 60, restSeconds: 120, optionality: 'mandatory', order: 1 },
      { blockId: 'b2', exerciseId: 'incline-bench-press', targetSets: 3, targetReps: 10, targetLoad: 50, restSeconds: 90, optionality: 'mandatory', order: 2 },
      { blockId: 'b3', exerciseId: 'shoulder-press', targetSets: 3, targetReps: 10, targetLoad: 20, restSeconds: 90, optionality: 'mandatory', order: 3 },
      { blockId: 'b4', exerciseId: 'lateral-raise', targetSets: 3, targetReps: 15, targetLoad: 8, restSeconds: 60, optionality: 'optional', order: 4 },
      { blockId: 'b5', exerciseId: 'tricep-pushdown', targetSets: 3, targetReps: 15, targetLoad: 25, restSeconds: 60, optionality: 'mandatory', order: 5 }
    ]
  },
  // Session derived from Strategy PPL (Leg day)
  {
    sessionId: 'sess_ppl_legs_1',
    strategyId: 'str_push_pull_legs_01',
    name: 'Legs: Foco em Quad & Isquiotibiais',
    dateContext: 'Amanhã',
    readinessContext: 'Alto volume de pernas',
    orderedBlocks: [
      { blockId: 'b10', exerciseId: 'squat', targetSets: 4, targetReps: 8, targetLoad: 80, restSeconds: 120, optionality: 'mandatory', order: 1 },
      { blockId: 'b11', exerciseId: 'leg-press', targetSets: 3, targetReps: 12, targetLoad: 160, restSeconds: 120, optionality: 'mandatory', order: 2 },
      { blockId: 'b12', exerciseId: 'rdl', targetSets: 3, targetReps: 10, targetLoad: 70, restSeconds: 90, optionality: 'mandatory', order: 3 },
      { blockId: 'b13', exerciseId: 'leg-ext', targetSets: 3, targetReps: 15, targetLoad: 40, restSeconds: 60, optionality: 'fallback', order: 4 },
      { blockId: 'b14', exerciseId: 'calf-raise', targetSets: 4, targetReps: 15, targetLoad: 60, restSeconds: 60, optionality: 'mandatory', order: 5 }
    ]
  },
  // Session derived from Fullbody maintenance
  {
    sessionId: 'sess_fb_1',
    strategyId: 'str_fullbody_maintenance',
    name: 'Corpo Inteiro (Express Básico)',
    dateContext: 'Hoje',
    readinessContext: 'Ajuste reativo face a tempo curto',
    orderedBlocks: [
      { blockId: 'c1', exerciseId: 'squat', targetSets: 3, targetReps: 10, targetLoad: 60, restSeconds: 90, optionality: 'mandatory', order: 1 },
      { blockId: 'c2', exerciseId: 'bench-press', targetSets: 3, targetReps: 10, targetLoad: 50, restSeconds: 90, optionality: 'mandatory', order: 2 },
      { blockId: 'c3', exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 10, targetLoad: 55, restSeconds: 90, optionality: 'mandatory', order: 3 },
      { blockId: 'c4', exerciseId: 'shoulder-press', targetSets: 3, targetReps: 12, targetLoad: 16, restSeconds: 60, optionality: 'optional', order: 4 }
    ]
  }
];
