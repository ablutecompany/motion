import { create } from 'zustand';
import { MotionStoreShape, initialMotionState } from './motionStoreShape';
import { MotionProfile } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';

type SetupUpdates = {
  currentGoal?: string;
  weeklyAvailability?: number;
  trainingEnvironment?: string;
  equipmentAvailable?: string[];
};

interface StoreActions {
  setBootData: (data: Partial<MotionStoreShape>) => void;
  markSessionCompletedLocal: (sessionId: string) => void;
  updateOperationalSetupLocal: (updates: SetupUpdates) => void;
  regeneratePlanLocal: () => void;
  setSetupSyncState: (state: MotionStoreShape['uiOperational']['setupSyncState']) => void;
}

const useMotionStoreBase = create<MotionStoreShape & StoreActions>((set) => ({
  ...initialMotionState,
  
  setBootData: (data) => set((state) => ({ ...state, ...data })),
  
  setSetupSyncState: (syncState) => set((state) => ({
    ...state,
    uiOperational: { ...state.uiOperational, setupSyncState: syncState }
  })),

  markSessionCompletedLocal: (sessionId) => set((state) => {
    const updatedSessions = state.sessions.map(s => 
      s.id === sessionId ? { ...s, completed: true } : s
    );
    const isAlreadyCompleted = state.progress.completedSessionIds.includes(sessionId);
    return {
      ...state,
      sessions: updatedSessions,
      progress: {
        completedSessionIds: isAlreadyCompleted 
          ? state.progress.completedSessionIds 
          : [...state.progress.completedSessionIds, sessionId]
      }
    };
  }),

  updateOperationalSetupLocal: (updates) => set((state) => {
    if (!state.motionProfile) return state;
    const now = new Date().toISOString();
    const op = state.motionProfile.operational;
    
    return {
      ...state,
      uiOperational: { ...state.uiOperational, setupSyncState: 'dirty' },
      motionProfile: {
        ...state.motionProfile,
        operational: {
          currentGoal: updates.currentGoal !== undefined 
            ? { value: updates.currentGoal, source: 'local_user', lastUpdatedAt: now } 
            : op.currentGoal,
          weeklyAvailability: updates.weeklyAvailability !== undefined 
            ? { value: updates.weeklyAvailability, source: 'local_user', lastUpdatedAt: now } 
            : op.weeklyAvailability,
          trainingEnvironment: updates.trainingEnvironment !== undefined 
            ? { value: updates.trainingEnvironment, source: 'local_user', lastUpdatedAt: now } 
            : op.trainingEnvironment,
          equipmentAvailable: updates.equipmentAvailable !== undefined 
            ? { value: updates.equipmentAvailable, source: 'local_user', lastUpdatedAt: now } 
            : op.equipmentAvailable,
        }
      }
    };
  }),

  regeneratePlanLocal: () => set((state) => {
    trackEvent(MotionEvents.PLAN_REGENERATION_REQUESTED);
    
    if (!state.plan || !state.motionProfile) return state;
    
    const op = state.motionProfile.operational;
    const requestedDays = op.weeklyAvailability.value;
    const goal = op.currentGoal.value;
    
    // Matemática determinista simples vinculada às regras estruturais orgânicas
    const intensityRaw = goal === 'progressao' ? 1.2 : goal === 'recuperacao' ? 0.8 : 1.0;
    const baseDuration = requestedDays < 3 ? 45 : 30; 
    
    const newSessions = Array.from({ length: requestedDays }, (_, i) => ({
      id: `S-REGERADA-${Date.now()}-${i}`,
      durationMinutes: baseDuration,
      intensityMultiplier: intensityRaw,
      completed: false
    }));

    trackEvent(MotionEvents.PLAN_READAPTED_LOCAL, { requestedDays, intensityRaw });

    return {
      ...state,
      plan: {
        ...state.plan,
        sessions: newSessions
      }
    };
  })
}));

export const useMotionStore = <T>(selector: (state: MotionStoreShape) => T): T => {
  return useMotionStoreBase(selector);
};

export const selectors = {
  selectIsBooted: (s: MotionStoreShape) => s.uiOperational.isBooted,
  selectSetupSyncState: (s: MotionStoreShape) => s.uiOperational.setupSyncState,
  selectIsDemo: (s: MotionStoreShape) => s.integration.isDemoActive,
  selectIsHistory: (s: MotionStoreShape) => s.integration.isHistoryModeActive,
  selectEligibility: (s: MotionStoreShape) => s.activeContext.motionEligibilityStatus,
  selectActiveContext: (s: MotionStoreShape) => s.activeContext,
  selectUniverse: (s: MotionStoreShape) => s.universe,
  selectPhase: (s: MotionStoreShape) => s.phase,
  selectPlan: (s: MotionStoreShape) => s.plan,
  selectMotionProfile: (s: MotionStoreShape) => s.motionProfile,
  selectCompletedSessions: (s: MotionStoreShape) => s.progress.completedSessionIds,
  selectHasWritePermission: (s: MotionStoreShape) => {
    if (!s.permissions || !Array.isArray(s.permissions.permissions)) return false;
    return s.permissions.permissions.includes('write_progress') || s.permissions.permissions.includes('write_setup');
  }
};

export const storeActions = {
  setBootData: (data: Partial<MotionStoreShape>) => useMotionStoreBase.getState().setBootData(data),
  markSessionCompletedLocal: (sessionId: string) => useMotionStoreBase.getState().markSessionCompletedLocal(sessionId),
  updateOperationalSetupLocal: (u: SetupUpdates) => useMotionStoreBase.getState().updateOperationalSetupLocal(u),
  regeneratePlanLocal: () => useMotionStoreBase.getState().regeneratePlanLocal(),
  setSetupSyncState: (state: MotionStoreShape['uiOperational']['setupSyncState']) => useMotionStoreBase.getState().setSetupSyncState(state)
};
