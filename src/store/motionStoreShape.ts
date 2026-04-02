import { 
  MotionProfile, Universe, CurrentPhase, WeeklyPlan, Session, 
  ReadinessSignal, IntegrationManifestView, MotionContribution
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
    completedSessionIds: []
  },
  permissions: null,
  contributions: [],
  analytics: {
    lastTrackedEvent: null
  },
  uiOperational: {
    isBooted: false,
    setupSyncState: 'idle'
  }
};
