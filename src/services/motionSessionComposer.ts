import { TrainingPlanDefinition, TrainingPlanViewModel, PlanStatus } from '../contracts/trainingPlanTypes';

export const composeSessionState = (
  plan: TrainingPlanDefinition | null, 
  completedNodeIds: string[], 
  currentActiveNodeId?: string, 
  isOutOfPlan: boolean = false,
  activeVariant: 'full' | 'short' = 'full'
): TrainingPlanViewModel => {
  
  if (!plan || plan.planIntent === 'none') {
    return {
      currentExercise: null,
      nextExercise: null,
      sessionVariant: null,
      planStatus: 'no_plan',
      isOutOfPlan: false,
      isSessionComplete: false,
      todayReadinessBand: 'unknown',
      planConfidence: 0.0
    };
  }

  if (plan.planIntent === 'rest') {
    return {
      currentExercise: null,
      nextExercise: null,
      sessionVariant: null,
      planStatus: 'rest_day',
      isOutOfPlan: false,
      isSessionComplete: false,
      todayReadinessBand: 'stable',
      planConfidence: 1.0
    };
  }

  const nodesToComplete = activeVariant === 'short' && plan.shortVariantNodes && plan.shortVariantNodes.length > 0 
    ? plan.shortVariantNodes 
    : plan.sequence;

  const plannedRequiredNodeIds = new Set(nodesToComplete.map(n => n.nodeId));
  const normalizedCompleted = new Set(completedNodeIds);

  let isCompletelyExhausted = true;
  for (const reqNode of plannedRequiredNodeIds) {
      if (!normalizedCompleted.has(reqNode)) {
          isCompletelyExhausted = false;
          break;
      }
  }

  if (isCompletelyExhausted) {
    return {
      currentExercise: null,
      nextExercise: null,
      sessionVariant: null,
      planStatus: 'completed',
      isOutOfPlan: false,
      isSessionComplete: true,
      todayReadinessBand: 'stable',
      planConfidence: 1.0
    };
  }

  let currentIndex = -1;
  if (currentActiveNodeId) {
    currentIndex = nodesToComplete.findIndex(n => n.nodeId === currentActiveNodeId);
  } else {
    // Retoma de sessão parcial (Garante que se recupera o estado original sem saltar steps do array):
    // Procuramos o primeiro não completado _dentro_ do path que nos importa
    currentIndex = nodesToComplete.findIndex(n => !normalizedCompleted.has(n.nodeId));
  }
  
  const currentEx = currentIndex > -1 && currentIndex < nodesToComplete.length ? nodesToComplete[currentIndex] : null;

  // Next exercise logic: find the first uncompleted exercise AFTER the current one in our bound scope
  const nextEx = nodesToComplete.slice(currentIndex + 1).find(n => !normalizedCompleted.has(n.nodeId)) || null;

  let status: PlanStatus = 'active';
  if (isOutOfPlan) status = 'out_of_plan';
  else if (!currentActiveNodeId && normalizedCompleted.size > 0 && currentEx) status = 'between_exercises';

  return {
    currentExercise: currentEx,
    nextExercise: nextEx,
    sessionVariant: {
      isShortVariantAvailable: plan.sequence.length > 2,
      extraSessionAllowed: false // Needs explicit true from engine if allowed
    },
    planStatus: status,
    isOutOfPlan,
    outOfPlanLabel: isOutOfPlan ? 'Movimento não previsto' : undefined,
    isSessionComplete: false,
    todayReadinessBand: 'stable',
    planConfidence: 0.95
  };
};
