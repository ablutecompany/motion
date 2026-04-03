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

export type WorkoutFeedbackSource = 'local_projection' | 'host_feedback' | 'none';
export type WorkoutFeedbackStatus = 'unavailable' | 'projected' | 'received' | 'applied' | 'ignored';

export interface WorkoutWellnessFeedback {
  receivedAt: string;
  source: WorkoutFeedbackSource;
  feedbackState: WorkoutFeedbackStatus;
  domainsTouched: string[];
  recoverySignal?: string;
  nutritionSignal?: string;
  hydrationSignal?: string;
  consistencySignal?: string;
}

export interface ConfirmedWorkoutRecord {
  id: string;
  source: 'session' | 'passive_inference';
  evidenceSource?: MotionInferenceEvidenceSource;
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
  
  // V3.5 Host Feedback
  hostFeedback?: WorkoutHostFeedback;
  operationalAdjustments?: MotionOperationalGoalAdjustment[];
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
  evidenceSource?: MotionInferenceEvidenceSource;
}

export interface PendingWorkoutConfirmation {
  id: string;
  source: 'passive_inference' | 'session' | 'manual';
  evidenceSource?: MotionInferenceEvidenceSource;
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

// ==========================================
// V3.1 Signal Bindings & Capabilities
// ==========================================

export interface SignalCapabilityStatus {
  environment: 'web' | 'native' | 'unknown';
  motionSensorsAvailable: boolean;
  healthPlatformAvailable: boolean;
  backgroundCollectionAvailable: boolean;
  permissionState: 'unknown' | 'unsupported' | 'denied' | 'prompt' | 'granted';
  sourceReliability: 'none' | 'limited' | 'usable';
}

export type MotionSignalType = 
  | 'accelerometer' 
  | 'device_motion' 
  | 'step_count' 
  | 'active_energy' 
  | 'workout_session_hint';

export interface MotionSignalSample {
  type: MotionSignalType;
  timestamp: string;
  value: number | any;
  unit: string;
  source: string;
  confidence?: number;
}

export interface MotionSignalEvidence {
  evidenceId: string;
  timeWindow: { start: string; end: string };
  sources: MotionSignalType[];
  summary: Record<string, any>;
  confidence: number;
  derivedFlags: string[];
  rawSampleCount: number;
  permissionState: string;
  capabilitySnapshot: SignalCapabilityStatus;
}

export type MotionInferenceEvidenceSource = 
  | 'legacy_heuristic' 
  | 'real_signal' 
  | 'hybrid';

// ==========================================
// V3.2 Offline Retry Queue & Reconciliation
// ==========================================

export type MotionSyncTrigger = 
  | 'auto_on_open' 
  | 'auto_on_resume' 
  | 'manual_retry' 
  | 'post_confirm' 
  | 'post_enrichment';

export type MotionSyncResolution = 
  | 'synced' 
  | 'kept_pending' 
  | 'kept_failed' 
  | 'dropped';

export interface MotionSyncAttempt {
  attemptedAt: string;
  trigger: MotionSyncTrigger;
  outcome: MotionSyncResolution;
  errorCode?: string;
  errorMessage?: string;
}

export interface MotionSyncEligibility {
  eligible: boolean;
  reason: 'ready' | 'demo_blocked' | 'history_blocked' | 'cooldown' | 'max_attempts' | 'missing_payload' | 'already_synced';
}

export interface MotionSyncQueueItem {
  queueItemId: string;
  workoutRecordId: string;
  contributionPayload: MotionContribution;
  createdAt: string;
  lastAttemptAt?: string;
  attemptCount: number;
  syncStatus: 'pending' | 'failed' | 'synced';
  failureReason?: string;
  nextEligibleAt?: string;
  sourceContext: 'post_confirm' | 'post_enrichment';
}

// ==========================================
// V3.3 Timeline Analytics & Filters
// ==========================================

export type MotionTimelineRange = '7d' | '30d' | '90d' | 'all';

export interface MotionTimelineFilterState {
  range: MotionTimelineRange;
  workoutType?: string;
  sourceType?: ConfirmedWorkoutRecord['source'];
  syncState?: ConfirmedWorkoutRecord['syncStatus'];
  onlyEnriched: boolean;
}

export interface MotionTimelineAnalytics {
  totalWorkouts: number;
  confirmedCount: number;
  inferredCount: number;
  enrichedCount: number;
  weeklyFrequency: number;
  lastWorkoutAt?: string;
  sourceBreakdown: Record<string, number>;
  syncBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
}

// ==========================================
// V3.4 Execution Runtime & Hardware Capabilities
// ==========================================

export type MotionWakeLockStatus = 'unsupported' | 'idle' | 'requesting' | 'active' | 'released' | 'failed';
export type MotionGuidanceStatus = 'unsupported' | 'off' | 'ready' | 'active' | 'failed';
export type MotionGuidanceMode = 'silent' | 'text_only' | 'voice_optional';

export interface MotionExecutionBlockState {
  blockId: string;
  title: string;
  position: number;
  total: number;
  status: 'upcoming' | 'active' | 'completed';
  placementRecommendation?: string;
  guidanceText?: string;
  targetDurationSeconds?: number;
}

export interface MotionExecutionRuntimeState {
  sessionStatus: 'idle' | 'ready' | 'running' | 'paused' | 'completed';
  currentBlockIndex: number;
  totalBlocks: number;
  elapsedSessionSeconds?: number;
  elapsedBlockSeconds?: number;
  ambientModeActive: boolean;
  wakeLockStatus: MotionWakeLockStatus;
  guidanceStatus: MotionGuidanceStatus;
  executionMode: ExecutionMode;
}

// ==========================================
// V3.5 Host Feedback Loop & Operational Goals
// ==========================================

export interface WorkoutHostFeedback {
  feedbackId: string;
  workoutRecordId: string;
  source: WorkoutFeedbackSource; // almost always 'host_feedback' but keeps contract
  receivedAt: string;
  status: WorkoutFeedbackStatus;
  payload: any;
  summary?: string;
  hostVersion?: string;
  actionableFlags?: string[];
  confidence?: number;
  isSimulatedHostFeedback?: boolean;
}

export type MotionGoalType = 'focus' | 'frequency' | 'intensity' | 'recovery';

export interface MotionOperationalGoal {
  goalId: string;
  title: string;
  type: MotionGoalType;
  currentValue?: string | number;
  targetValue?: string | number;
  source: 'host' | 'local';
  scope: 'session' | 'weekly' | 'cycle';
  active: boolean;
}

export interface MotionOperationalGoalAdjustment {
  adjustmentId: string;
  triggeredByFeedbackId: string;
  goalId: string;
  changeType: 'created' | 'modified' | 'reinforced' | 'dropped';
  previousValue?: string | number;
  nextValue?: string | number;
  reasonSummary: string;
}

