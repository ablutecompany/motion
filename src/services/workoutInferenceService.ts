import { 
  WorkoutConfirmationState, 
  PendingWorkoutConfirmation,
  InferenceSignal,
  InferenceContext,
  InferenceDecision,
  MotionSignalEvidence,
  MotionInferenceEvidenceSource
} from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';

export const workoutInferenceService = {
  evaluateSignals: (signals: InferenceSignal[], context: InferenceContext, evidence?: MotionSignalEvidence): InferenceDecision => {
    trackEvent('motion_inference_signal_evaluated', { count: signals.length });

    // Anti-Spam / Cooldown Crítico
    if (context.lastUserDisposition === 'dismissed' && context.lastPromptAt) {
      const hoursSincePrompt = (Date.now() - new Date(context.lastPromptAt).getTime()) / 3600000;
      if (hoursSincePrompt < 12) {
        trackEvent('motion_inference_prompt_suppressed', { reason: 'cooldown', hours: hoursSincePrompt });
        return { state: 'none', aggregateConfidence: 0, reasonSummary: 'Cooldown ativo (rejeição recente)' };
      }
    }
    
    if (context.lastUserDisposition === 'deferred' && context.lastPromptAt) {
      const hoursSincePrompt = (Date.now() - new Date(context.lastPromptAt).getTime()) / 3600000;
      if (hoursSincePrompt < 2) {
        trackEvent('motion_inference_prompt_cooldown_applied', { hours: hoursSincePrompt });
        return { state: 'none', aggregateConfidence: 0, reasonSummary: 'Cooldown ativo (adiamento recente)' };
      }
    }

    if (context.hasConfirmedWorkoutInWindow) {
       return { state: 'none', aggregateConfidence: 0, reasonSummary: 'Janela já satisfeita na V1' };
    }

    // Regras Genéricas de Avaliação e Peso V2.1
    let aggregateConfidence = 0;
    let isWearableSource = false;
    
    signals.forEach(s => {
      aggregateConfidence += s.confidence;
      if (s.source === 'wearable' || s.source === 'os_health') isWearableSource = true;
    });

    const averageConfidence = signals.length > 0 ? (aggregateConfidence / signals.length) : 0;
    
    if (averageConfidence > 0.4) {
      // Bónus se tem fonte forte ou acompanhamento passivo longo
      const finalConfidence = isWearableSource ? Math.min(averageConfidence + 0.3, 1.0) : averageConfidence;
      const state: 'suspected' | 'probable' = finalConfidence >= 0.75 ? 'probable' : 'suspected';
      
      const reasonSummary = state === 'probable' 
        ? 'Deteção consolidada de comportamentos consistentes com treino intenso.'
        : 'Padrão moderado compatível com atividade física isolada.';

      let evidenceSource: MotionInferenceEvidenceSource = 'legacy_heuristic';
      if (evidence) {
        if (evidence.confidence > 0.6) evidenceSource = 'real_signal';
        else if (evidence.confidence > 0.2) evidenceSource = 'hybrid';
      }

      trackEvent('motion_inference_decision_made', { state, confidence: finalConfidence, source: evidenceSource });
      
      return {
        state,
        aggregateConfidence: finalConfidence,
        reasonSummary,
        supportingSignals: signals,
        evidenceSource
      };
    }

    return { state: 'none', aggregateConfidence: 0, reasonSummary: 'Sinal insuficiente', evidenceSource: 'legacy_heuristic' };
  },

  createPendingWorkout: (decision: InferenceDecision): PendingWorkoutConfirmation | null => {
    if (decision.state === 'none') return null;

    trackEvent('motion_inference_probable_workout_created', { confidence: decision.aggregateConfidence });

    return {
      id: `INFR-V2-${Date.now()}`,
      source: 'passive_inference',
      detectionState: decision.state,
      confidence: decision.aggregateConfidence,
      startedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      endedAt: new Date().toISOString(),
      reasonSummary: decision.reasonSummary,
      supportingSignalsCount: decision.supportingSignals?.length || 0,
      inferenceVersion: '3.1',
      evidenceSource: decision.evidenceSource
    };
  }
};
