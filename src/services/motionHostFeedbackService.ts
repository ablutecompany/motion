import { ConfirmedWorkoutRecord } from '../contracts/types';
import { motionHostFeedbackAdapter } from '../integration/motionHostFeedbackAdapter';
import { motionOperationalGoalsService } from './motionOperationalGoalsService';
import { useMotionStoreBase, storeActions } from '../store/useMotionStore';
import { trackEvent } from '../analytics/events';

class HostFeedbackService {
  /**
   * Pede ativamente ou escuta a chegada de feedback host referente a um treino recém sincronizado.
   * Assimila de imediato de volta no Record caso exista.
   */
  public async attemptFeedbackReconciliation(workoutRecordId: string): Promise<void> {
    const state = useMotionStoreBase.getState();
    const history = state.progress.workoutHistory;
    const targetRecord = history.find((r: ConfirmedWorkoutRecord) => r.id === workoutRecordId);

    if (!targetRecord) return;
    if (targetRecord.isHistoricalContext) return;

    trackEvent('motion_host_feedback_check_started', { workoutRecordId });

    try {
      // 1. Adapter call (Mock passivo na V3.5 isolada)
      const feedbackPayload = await motionHostFeedbackAdapter.awaitFeedback(targetRecord);
      
      if (!feedbackPayload) {
        // Fallback íntegro garantido
        trackEvent('motion_host_feedback_unavailable');
        return; 
      }

      // 2. Extração de Metas Dinâmicas (Ajustes Operacionais)
      const generatedAdjustments = motionOperationalGoalsService.generateAdjustmentsFromFeedback(feedbackPayload);

      // 3. Reconciliação no EXACTO MESMO RECORD
      const updatedRecord: ConfirmedWorkoutRecord = {
        ...targetRecord,
        
        // Mantemos wellnessFeedback.source honesto se usasses o array V2. Mas já temos source aqui:
        // A regra é clara: não sobrepor o _impact_ que a app gerou.
        wellnessFeedback: targetRecord.wellnessFeedback ? {
          ...targetRecord.wellnessFeedback,
          source: 'host_feedback',
          feedbackState: 'received'
        } : undefined,

        hostFeedback: feedbackPayload,
        operationalAdjustments: generatedAdjustments
      };

      storeActions.addOrUpdateWorkoutRecord(updatedRecord);
      trackEvent('motion_host_feedback_reconciled', { 
        workoutRecordId, 
        adjustmentsGenerated: generatedAdjustments.length 
      });

    } catch (e) {
      console.warn('Falha silenciosa no Host Feedback Resolver', e);
      trackEvent('motion_host_feedback_failed');
    }
  }
}

export const motionHostFeedbackService = new HostFeedbackService();
