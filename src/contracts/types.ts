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
  type: 'adherence_update' | 'readiness_update' | 'universe_confirmed' | 'setup_updated';
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
