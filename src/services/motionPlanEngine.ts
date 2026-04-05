import { UserTrainingProfile, DailyReadinessContext, TrainingPlanDefinition } from '../contracts/trainingPlanTypes';

export const generateTrainingPlan = (profile: UserTrainingProfile, readiness: DailyReadinessContext): TrainingPlanDefinition => {
  // Use profiling to decide exactly what the session must look like logically
  const seq = [
    {
      nodeId: 'n1',
      exerciseId: 'chest_press',
      name: 'Supino Reto',
      groupTarget: 'Peitoral Geral',
      sets: 4,
      reps: 12,
      recommendedWeight: 60,
      details: '(Barra ou Halteres)'
    },
    {
      nodeId: 'n2',
      exerciseId: 'chest_fly',
      name: 'Abertura Plana',
      groupTarget: 'Peitoral Exterior',
      sets: 3,
      reps: 15,
      recommendedWeight: 14,
      details: '(Halteres)'
    }
  ];

  return {
    planId: 'plan_' + Date.now(),
    type: profile.phase,
    planIntent: 'training',
    focusMuscles: ['chest', 'shoulders'],
    expectedDurationMinutes: profile.preferredSessionLength || 45,
    sequence: seq,
    shortVariantNodes: [seq[0]] // first node as the shortcut path
  };
};
