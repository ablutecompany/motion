import { useMotionStore, selectors } from '../store/useMotionStore';
import { ConfirmedWorkoutRecord, WorkoutHostFeedback, MotionOperationalGoalAdjustment, WorkoutFeedbackStatus } from '../contracts/types';

export const useMotionHostFeedbackFacade = () => {
  const history = useMotionStore(selectors.selectWorkoutHistory);
  
  const getFeedbackSummary = (workoutRecordId: string): { label: string; isHost: boolean; status: WorkoutFeedbackStatus } => {
    const record = history.find((r: ConfirmedWorkoutRecord) => r.id === workoutRecordId);
    if (!record) return { label: 'Indisponível', isHost: false, status: 'unavailable' };

    if (record.hostFeedback) {
      if (record.hostFeedback.status === 'received' || record.hostFeedback.status === 'applied') {
        const isSimulated = record.hostFeedback.isSimulatedHostFeedback;
        return { 
          label: isSimulated ? 'Mock Simulado (Host)' : 'Feedback do ecossistema', 
          isHost: true, 
          status: record.hostFeedback.status 
        };
      }
    }

    if (record.wellnessFeedback && record.wellnessFeedback.source === 'local_projection') {
      return { label: 'Projeção local', isHost: false, status: record.wellnessFeedback.feedbackState };
    }

    return { label: 'Sem feedback remoto', isHost: false, status: 'unavailable' };
  };

  const getOperationalAdjustments = (workoutRecordId: string): MotionOperationalGoalAdjustment[] => {
    const record = history.find((r: ConfirmedWorkoutRecord) => r.id === workoutRecordId);
    if (!record || !record.operationalAdjustments) return [];
    return record.operationalAdjustments;
  };

  return {
    getFeedbackSummary,
    getOperationalAdjustments
  };
};
