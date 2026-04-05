import { useMemo, useState, useEffect } from 'react';
import { TrainingPlanDefinition, TrainingPlanViewModel } from '../contracts/trainingPlanTypes';
import { buildTrainingProfile } from '../services/motionUserTrainingProfileBuilder';
import { resolveDailyReadiness } from '../services/motionDailyReadinessResolver';
import { generateTrainingPlan } from '../services/motionPlanEngine';
import { composeSessionState } from '../services/motionSessionComposer';
import { presentTrainingState } from '../presenters/motionTrainingPresenter';
import { adaptPlanPostSession } from '../services/motionPlanAdaptationService';

// Facade interna simulando uma Store efemera
let __mockedState: any = {
  completedNodeIds: [],
  isOutOfPlan: false,
  currentActiveNodeId: undefined
};

export const useMotionTrainingFacade = (): {
  model: TrainingPlanViewModel;
  actions: {
    markExerciseComplete: (nodeId: string) => void;
    startOutOfPlanExercise: () => void;
    finishSession: () => void;
  }
} => {
  // Num cenário real, buscaríamos da Store principal.
  const [internalTick, setInternalTick] = useState(0);

  const rawEngineState = useMemo(() => {
    // 1. Build Base Profile
    const profile = buildTrainingProfile({});
    // 2. Resolve Today's Readiness
    const readiness = resolveDailyReadiness({});
    // 3. Generate Mathematical Plan
    const plan = generateTrainingPlan(profile, readiness);
    // 4. Compose Real-Time State intersecting with live variables
    const rawState = composeSessionState(plan, __mockedState.completedNodeIds, __mockedState.currentActiveNodeId, __mockedState.isOutOfPlan);
    
    return { plan, rawState, profile };
  }, [internalTick]);

  const model = useMemo(() => presentTrainingState(rawEngineState.rawState), [rawEngineState.rawState]);

  const forceRender = () => setInternalTick((t: number) => t + 1);

  return {
    model,
    actions: {
      markExerciseComplete: (nodeId: string) => {
        __mockedState.completedNodeIds.push(nodeId);
        __mockedState.isOutOfPlan = false;
        forceRender();
      },
      startOutOfPlanExercise: () => {
        __mockedState.isOutOfPlan = true;
        forceRender();
      },
      finishSession: () => {
        adaptPlanPostSession(rawEngineState.plan, rawEngineState.profile, { completedNodes: __mockedState.completedNodeIds.length });
        __mockedState.completedNodeIds = rawEngineState.plan.sequence.map((s: any) => s.nodeId); // Force all to mark complete
        __mockedState.isOutOfPlan = false;
        forceRender();
      }
    }
  };
};
