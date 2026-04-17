import { useState, useEffect, useMemo } from 'react';
import { TrainingStrategy, DailySession, DailySessionBlock, ExerciseFeatureDef } from '../contracts/planCoreDefinitions';
import { MOCK_STRATEGIES, MOCK_DAILY_SESSIONS, MOCK_USER_PROFILE } from '../data/seedPlans';
import { EXERCISE_CATALOG } from '../data/exerciseCatalog';

const STRATEGY_STORE_KEY = 'motion_core_strategy_state_v2';

interface CoreSessionPrefs {
  activeStrategyId: string | null;
  activeSessionId: string | null;
  activeBlockId: string | null;
  skippedExerciseIds: string[];
}

export function useMotionPlanState() {
  const [prefs, setPrefs] = useState<CoreSessionPrefs>({ activeStrategyId: null, activeSessionId: null, activeBlockId: null, skippedExerciseIds: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<string>('LOADING');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STRATEGY_STORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Deep validation of the entire chain
        const s = MOCK_STRATEGIES.find(x => x.strategyId === parsed.activeStrategyId);
        const sess = MOCK_DAILY_SESSIONS.find(x => x.sessionId === parsed.activeSessionId);
        
        if (s && sess && sess.strategyId === s.strategyId) {
           // Fully valid chain
           setPrefs(parsed);
           setRecoveryStatus('OK');
        } else {
           // Invalid chain - force throw to go to catch and reset completely
           setRecoveryStatus('FALLBACK_TRIGGERED');
           throw new Error('Stale or incomplete local storage data');
        }
      } else {
        setRecoveryStatus('BRAND_NEW');
        throw new Error('No local storage data');
      }
    } catch (_) {
      // Auto-assign PPL strategy and first session as fallback
      const s = MOCK_STRATEGIES[0];
      const sess = MOCK_DAILY_SESSIONS.find(x => x.strategyId === s?.strategyId);
      
      const newPrefs = { 
        activeStrategyId: s ? s.strategyId : null, 
        activeSessionId: sess ? sess.sessionId : null, 
        activeBlockId: sess && sess.orderedBlocks.length > 0 ? sess.orderedBlocks[0].blockId : null,
        skippedExerciseIds: []
      };
      
      setPrefs(newPrefs);
      // Try to save the recovered state right away
      try { localStorage.setItem(STRATEGY_STORE_KEY, JSON.stringify(newPrefs)); } catch(e){}
    }
    setIsLoaded(true);
  }, []);

  const savePrefs = (newPrefs: CoreSessionPrefs) => {
    setPrefs(newPrefs);
    try {
      localStorage.setItem(STRATEGY_STORE_KEY, JSON.stringify(newPrefs));
    } catch (_) {}
  };

  const activeStrategy = useMemo(() => {
    return MOCK_STRATEGIES.find(p => p.strategyId === prefs.activeStrategyId) || null;
  }, [prefs.activeStrategyId]);

  const activeSession = useMemo(() => {
    return MOCK_DAILY_SESSIONS.find(s => s.sessionId === prefs.activeSessionId) || null;
  }, [prefs.activeSessionId]);

  const activeBlock = useMemo(() => {
    if (!activeSession) return null;
    return activeSession.orderedBlocks.find(b => b.blockId === prefs.activeBlockId) || activeSession.orderedBlocks[0] || null;
  }, [activeSession, prefs.activeBlockId]);

  const activeExercise = useMemo(() => {
    if (!activeBlock) return null;
    return EXERCISE_CATALOG[activeBlock.exerciseId] || null;
  }, [activeBlock]);

  // Derived next block sequence
  const nextBlock = useMemo(() => {
    if (!activeSession || !activeBlock) return null;
    // Assume orderedBlocks is sorted, or we can sort by order
    const sortedBlocks = [...activeSession.orderedBlocks].sort((a,b) => a.order - b.order);
    const currentIndex = sortedBlocks.findIndex(b => b.blockId === prefs.activeBlockId);
    if (currentIndex >= 0 && currentIndex < sortedBlocks.length - 1) {
      return sortedBlocks[currentIndex + 1];
    }
    return null;
  }, [activeSession, activeBlock, prefs.activeBlockId]);

  // Derived available sessions for the strategy
  const availableSessionsForActiveStrategy = useMemo(() => {
    if (!activeStrategy) return [];
    return MOCK_DAILY_SESSIONS.filter(s => s.strategyId === activeStrategy.strategyId);
  }, [activeStrategy]);

  const selectStrategy = (strategyId: string) => {
    const s = MOCK_STRATEGIES.find(x => x.strategyId === strategyId);
    if (s) {
      const firstSess = MOCK_DAILY_SESSIONS.find(sess => sess.strategyId === strategyId);
      savePrefs({ 
        ...prefs,
        activeStrategyId: strategyId, 
        activeSessionId: firstSess ? firstSess.sessionId : null,
        activeBlockId: firstSess && firstSess.orderedBlocks.length > 0 ? firstSess.orderedBlocks[0].blockId : null,
        skippedExerciseIds: []
      });
    }
  };

  const selectSession = (sessionId: string) => {
    const sess = MOCK_DAILY_SESSIONS.find(x => x.sessionId === sessionId);
    if (sess) {
      savePrefs({ 
        ...prefs, 
        activeSessionId: sessionId,
        activeBlockId: sess.orderedBlocks.length > 0 ? sess.orderedBlocks[0].blockId : null,
        skippedExerciseIds: []
      });
    }
  };

  const selectBlock = (blockId: string) => {
    savePrefs({ ...prefs, activeBlockId: blockId });
  };

  const advanceToNextBlock = (skipped: boolean = false) => {
    if (!nextBlock) return false;
    const newSkipped = skipped && prefs.activeBlockId ? [...prefs.skippedExerciseIds, prefs.activeBlockId] : prefs.skippedExerciseIds;
    savePrefs({ ...prefs, activeBlockId: nextBlock.blockId, skippedExerciseIds: newSkipped });
    return true;
  };

  return {
    isLoaded,
    profile: MOCK_USER_PROFILE,
    activeStrategy,
    activeSession,
    activeBlock,
    nextBlock,
    activeExercise,
    skippedExerciseIds: prefs.skippedExerciseIds,
    availableSessionsForActiveStrategy,
    selectStrategy,
    selectSession,
    selectBlock,
    advanceToNextBlock,
    allStrategies: MOCK_STRATEGIES,
    catalog: EXERCISE_CATALOG,
    recoveryStatus
  };
}
