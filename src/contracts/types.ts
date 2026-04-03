export type Universe = 'Balance' | 'Performance Boost' | 'Momentum';

export type CurrentPhase = 'Reativação' | 'Retoma' | 'Manutenção' | 'Progressão' | 'Recuperação';

export interface ActiveMotionContext {
  analysisId: string | null;
  analysisDate: string | null;
  motionEligibilityStatus: 'eligible' | 'limited' | 'unknown';
  factualContext: Record<string, any>;
}

export interface OperationalField<T> {
  value: T;
  source: 'shell' | 'local_user';
  lastUpdatedAt: string;
}

export interface MotionProfile {
  universe: Universe | null;
  structural: {
    age?: number;
    gender?: string;
    limitations: string[];
  };
  dynamic: {
    readinessScore: number;
    adherenceLevel: string;
  };
  operational: {
    currentGoal: OperationalField<string>;
    weeklyAvailability: OperationalField<number>;
    trainingEnvironment: OperationalField<string>;
    equipmentAvailable: OperationalField<string[]>;
  };
}

export interface CurrentGoal {
  id: string;
  description: string;
  targetDate?: string;
}

export interface ContextSnapshot {
  source: 'shell' | 'local';
  timestamp: string;
  isDemo: boolean;
  selectedHistoryEntry?: string;
  payload: any;
}

export interface Session {
  id: string;
  durationMinutes: number;
  intensityMultiplier: number;
  completed: boolean;
  executionBlocks?: ExecutionBlock[];
}

export type ExecutionMode = 'follow' | 'guide' | 'hybrid';
export type AmbientMode = 'ambient' | 'pocket' | 'active';

export type WorkoutTypePreset = 'strength' | 'cardio' | 'mobility' | 'mixed' | 'unknown';
export type PerceivedIntensity = 'light' | 'moderate' | 'hard' | 'unknown';

export type FeltState = 'good' | 'tired' | 'heavy' | 'stiff' | 'unclear' | 'unknown';
export type DiscomfortLevel = 'none' | 'mild' | 'relevant' | 'unknown';

export interface WorkoutEnrichmentInput {
  workoutType?: WorkoutTypePreset;
  perceivedIntensity?: PerceivedIntensity;
  feltState?: FeltState;
  discomfortReported?: DiscomfortLevel;
}

export interface WorkoutWellnessImpact {
  interestingOutcome?: string;
  usefulOutcome?: string;
  fatigueIndication?: string;
  displayState: 'ready' | 'local_only' | 'sent';
}

export interface WorkoutWellnessFeedback {
  receivedAt: string;
  source: 'host' | 'local_projection' | 'none';
  feedbackState: 'available' | 'partial' | 'local_only' | 'unavailable';
  domainsTouched: string[];
  recoverySignal?: string;
  nutritionSignal?: string;
  hydrationSignal?: string;
  consistencySignal?: string;
}

export interface ConfirmedWorkoutRecord {
  id: string;
  source: 'session' | 'passive_inference';
  sessionId?: string;
  confirmedAt: string;
  workoutType?: WorkoutTypePreset;
  perceivedIntensity?: PerceivedIntensity;
  feltState?: FeltState;
  discomfortReported?: DiscomfortLevel;
  isLocalOnly: boolean;
  isHistoricalContext: boolean;
  syncStatus: 'local_only' | 'pending' | 'synced' | 'failed';
  enrichmentStatus: 'not_requested' | 'skipped' | 'partial' | 'enriched';
  wellnessImpact?: WorkoutWellnessImpact;
  wellnessFeedback?: WorkoutWellnessFeedback;
}

export type PlacementRecommendation = 'forearm' | 'upper-arm' | 'thigh' | 'waist' | 'pocket' | 'surface' | 'none';
export type CaptureMode = 'passive' | 'timed' | 'repetition_tracking' | 'set_tracking' | 'rest_tracking' | 'unknown';
export type FallbackMode = 'continue_without_capture' | 'manual_confirmation' | 'time_based_only';

export type WorkoutConfirmationState = 'suspected' | 'probable' | 'confirmed' | 'dismissed' | 'deferred' | 'enriched';

export interface InferenceSignal {
  type: 'accelerometer_activity' | 'heart_rate_elevation' | 'location_change' | 'device_locked';
  confidence: number;
  timestamp: string;
  durationMinutes?: number;
  source: 'mock' | 'os_health' | 'wearable';
}

export interface InferenceContext {
  currentTime: string;
  currentExecutionMode?: ExecutionMode;
  lastUserDisposition?: WorkoutConfirmationState;
  lastPromptAt?: string;
  hasConfirmedWorkoutInWindow?: boolean;
}

export interface InferenceDecision {
  state: 'none' | 'suspected' | 'probable';
  aggregateConfidence: number;
  reasonSummary?: string;
  cooldownHours?: number;
  supportingSignals?: InferenceSignal[];
}

export interface PendingWorkoutConfirmation {
  id: string;
  source: 'passive_inference' | 'session' | 'manual';
  detectionState: 'suspected' | 'probable';
  confidence: number;
  startedAt?: string;
  endedAt?: string;
  relatedSessionId?: string;
  reasonSummary?: string;
  supportingSignalsCount?: number;
  inferenceVersion?: string;
}

export interface ExecutionBlock {
  id: string;
  name: string;
  placementRecommendation: PlacementRecommendation;
  captureMode: CaptureMode;
  fallbackMode: FallbackMode;
  captureConfidence?: number; 
}

export interface TrainingExecutionProfile {
  preferredMode: ExecutionMode;
  allowsAmbientMode: boolean;
  allowsSensorCapture: boolean;
  progressiveDisclosureState: Record<string, boolean>; 
}

export interface WorkoutOutcome {
  interesting: {
    consistency?: string;
    flow?: string;
  };
  useful: {
    countsAs: CurrentPhase;
    fatigueIndication?: string;
    recoveryRecommendation?: string;
  }
}

export interface WeeklyPlan {
  cycleId: string;
  startDate: string;
  sessions: Session[];
  targetPhase: CurrentPhase;
}

export interface Cycle {
  id: string;
  durationWeeks: number;
  isCompleted: boolean;
}

export interface AdaptationDecision {
  reason: string;
  timestamp: string;
  previousPhase: CurrentPhase;
  newPhase: CurrentPhase;
}

export interface AdherenceSignal {
  consecutiveMisses: number;
  lastSessionDate: string;
}

export interface ProgressSignal {
  sessionId: string;
  perceivedEffort: number;
  completedAt: string;
}

export interface ReadinessSignal {
  score: number; // 0.0 to 1.0
  fatigueReported: boolean;
  date: string;
}

export interface MotionContribution {
  source: '_motion_app';
  type: 'adherence_update' | 'readiness_update' | 'universe_confirmed' | 'setup_updated' | 'workout_completed' | 'workout_suspicion_rejected';
  payload: any;
  timestamp: string;
}

export interface IntegrationManifestView {
  permissions: string[];
  linkedModules: string[];
}

export interface DemoState {
  isActive: boolean;
  sandboxProfile: MotionProfile | null;
}

export interface HistoryContext {
  isHistoryMode: boolean;
  historicalDate?: string;
  historicalPlan?: WeeklyPlan;
}
