import { WorkoutHostFeedback, MotionOperationalGoalAdjustment } from '../contracts/types';
import { trackEvent } from '../analytics/events';

class OperationalGoalsService {

  /**
   * Avalia um Feedback Host recentemente recebido.
   * Se este trouxer labels reconhecíveis para ajuste dinâmico, processa-as em Objectos Discretos de Ajuste.
   */
  public generateAdjustmentsFromFeedback(feedback: WorkoutHostFeedback): MotionOperationalGoalAdjustment[] {
    const adjustments: MotionOperationalGoalAdjustment[] = [];

    // Limitação de Honestidade: Se não for feedback real nativo, ou se não for um mock devidamente registado.
    if (feedback.source !== 'host_feedback') return adjustments;

    // Regra: "Ajustes têm de ser rastreáveis e reversíveis. Sem alterar Universo."
    // Vamos processar Flags. Exemplo de Flag suportada na V3.5: "PRIORITIZE_RECOVERY"
    
    if (feedback.actionableFlags && feedback.actionableFlags.includes('PRIORITIZE_RECOVERY')) {
       adjustments.push({
         adjustmentId: `adj-rec-${Date.now()}`,
         triggeredByFeedbackId: feedback.feedbackId,
         goalId: 'sys_local_goal_recovery', // Um goal virtual/tático de "Foco"
         changeType: 'modified',
         nextValue: 'Recuperação Passiva Ativa',
         reasonSummary: 'Host identificou saturação fisiológica.'
       });
    }

    if (adjustments.length > 0) {
      trackEvent('motion_operational_goal_adjusted', { 
        count: adjustments.length, 
        isTestHarness: !!feedback.isSimulatedHostFeedback 
      });
    }

    return adjustments;
  }
}

export const motionOperationalGoalsService = new OperationalGoalsService();
