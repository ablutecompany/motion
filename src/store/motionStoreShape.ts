import { 
  MotionProfile, Universe, CurrentPhase, WeeklyPlan, Session, 
  ReadinessSignal, IntegrationManifestView, MotionContribution,
  TrainingExecutionProfile, WorkoutConfirmationState, AmbientMode,
  PendingWorkoutConfirmation, ConfirmedWorkoutRecord, MotionSyncQueueItem
} from '../contracts/types';

export interface MotionStoreShape {
  integration: {
    isDemoActive: boolean;
    isHistoryModeActive: boolean;
    shellSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  };
  activeContext: {
    analysisId: string | null;
    analysisDate: string | null;
    motionEligibilityStatus: 'eligible' | 'limited' | 'unknown';
  };
  motionProfile: MotionProfile | null;
  universe: Universe | null;
  phase: CurrentPhase | null;
  plan: WeeklyPlan | null;
  sessions: Session[];
  readiness: ReadinessSignal | null;
  progress: {
    completedSessionIds: string[];
    workoutHistory: ConfirmedWorkoutRecord[];
  };
  permissions: IntegrationManifestView | null;
  contributions: MotionContribution[];
  analytics: {
    lastTrackedEvent: string | null;
  };
  uiOperational: {
    isBooted: boolean;
    setupSyncState: 'idle' | 'dirty' | 'syncing' | 'synced' | 'blocked_demo' | 'blocked_history' | 'failed';
  };
  execution: {
    profile: TrainingExecutionProfile;
    activeWorkoutState: WorkoutConfirmationState | null;
    currentAmbientMode: AmbientMode | null;
    activeSessionId: string | null;
    inferredWorkout: PendingWorkoutConfirmation | null;
    inferenceContext: {
      lastPromptAt: string | null;
      lastDisposition: WorkoutConfirmationState | null;
    };
    syncQueue: MotionSyncQueueItem[];
  };
}

export const initialMotionState: MotionStoreShape = {
  integration: {
    isDemoActive: false,
    isHistoryModeActive: false,
    shellSyncStatus: 'idle'
  },
  activeContext: {
    analysisId: null,
    analysisDate: null,
    motionEligibilityStatus: 'unknown'
  },
  motionProfile: null,
  universe: null,
  phase: null,
  plan: null,
  sessions: [],
  readiness: null,
  progress: {
    completedSessionIds: [],
    workoutHistory: []
  },
  permissions: null,
  contributions: [],
  analytics: {
    lastTrackedEvent: null
  },
  uiOperational: {
    isBooted: false,
    setupSyncState: 'idle'
  },
  execution: {
    profile: {
      preferredMode: 'hybrid',
      allowsAmbientMode: true,
      allowsSensorCapture: true,
      progressiveDisclosureState: {}
    },
    activeWorkoutState: null,
    currentAmbientMode: null,
    activeSessionId: null,
    inferredWorkout: null,
    inferenceContext: {
      lastPromptAt: null,
      lastDisposition: null,
    },
    syncQueue: []
  }
};
