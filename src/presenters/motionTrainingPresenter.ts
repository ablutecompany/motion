import { TrainingPlanViewModel } from '../contracts/trainingPlanTypes';

export const presentTrainingState = (state: TrainingPlanViewModel): TrainingPlanViewModel => {
  // Pure mapping or sanitization if required before UI consumption.
  return {
    ...state,
    // Add UI specific formatting layers if needed, but no deductions
  };
};
