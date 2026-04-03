import { MotionContribution, WorkoutOutcome, WorkoutConfirmationState } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';

export const workoutContributionMapper = (
  executionId: string,
  state: WorkoutConfirmationState,
  outcome: WorkoutOutcome,
  metadata?: {
    source?: string;
    confidence?: number;
    startedAt?: string;
    endedAt?: string;
  }
): MotionContribution => {
  
  const envelope: MotionContribution = {
    source: '_motion_app',
    type: 'workout_completed',
    timestamp: new Date().toISOString(),
    payload: {
      executionId,
      confirmationState: state,
      executionSource: metadata?.source || 'session',
      ecosystemYield: outcome,
      ...(metadata?.confidence && { confidence: metadata.confidence }),
      ...(metadata?.startedAt && { startedAt: metadata.startedAt }),
      ...(metadata?.endedAt && { endedAt: metadata.endedAt })
    }
  };

  trackEvent(MotionEvents.CONTRIBUTION_PREPARED, { state, source: metadata?.source });
  return envelope;
};
