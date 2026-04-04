import { useState } from 'react';
import { useMotionStore, selectors, storeActions } from '../store/useMotionStore';
import { resolveBlockPlacement } from '../resolvers/exercisePlacementResolver';
import { workoutContributionMapper } from '../services/workoutContributionMapper';
import { motionHostWritebackAdapter } from '../integration/motionHostWritebackAdapter';
import { ExecutionMode, WorkoutConfirmationState, WorkoutOutcome, PendingWorkoutConfirmation, WorkoutEnrichmentInput, ConfirmedWorkoutRecord } from '../contracts/types';
import { workoutInferenceService } from '../services/workoutInferenceService';
import { motionRetryQueueService } from '../services/motionRetryQueueService';
import { motionHostFeedbackService } from '../services/motionHostFeedbackService';
import { trackEvent, MotionEvents } from '../analytics/events';

export interface PendingEnrichmentTarget {
  executionId: string;
  source: 'session' | 'passive_inference';
}

export interface SessionExecutionRuntimeViewModel {
  executionModeLabel: string;
  executionModeHint: string;
  ambientVisible: boolean;
  primaryTrainingState: 'scheduled' | 'active' | 'ambient' | 'validating' | 'ended';
  placementPrompt: string | null;
  captureNotice: string | null;
  showMinimalUI: boolean;
  showDetailedUI: boolean;
  confirmationReady: boolean;
}

interface PlacementCopy {
  title: string | null;
  description: string | null;
  showPlacement: boolean;
}

export const useMotionExecutionFacade = () => {
  const executionProfile = useMotionStore(selectors.selectExecutionProfile);
  const activeWorkoutState = useMotionStore(selectors.selectWorkoutState);
  const plan = useMotionStore(selectors.selectPlan);
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const hasWritePermission = useMotionStore(selectors.selectHasWritePermission);
  const inferredWorkout = useMotionStore(selectors.selectInferredWorkout);
  const [ambientMode, setAmbientMode] = useState<boolean>(false);
  const [pendingEnrichmentTarget, setPendingEnrichmentTarget] = useState<PendingEnrichmentTarget | null>(null);
  const currentExecutionMode: ExecutionMode = executionProfile?.preferredMode || 'hybrid';

  const toggleAmbientMode = (on: boolean) => {
    setAmbientMode(on);
    if (on) trackEvent('motion_ambient_mode_entered');
    else trackEvent('motion_ambient_mode_exited');
  };

  const getPlacementCopy = (exerciseConcept: string, precision: number) => {
    const data = resolveBlockPlacement(exerciseConcept, precision);
    const rec = data.placementRecommendation;
    
    let copyText = null;
    if (rec === 'forearm') copyText = 'Neste bloco, recomendo prender o telemóvel no antebraço para contagem ativa.';
    else if (rec === 'pocket') copyText = 'Para aferir melhor, prefere guardar o telemóvel no bolso.';
    else if (rec === 'surface') copyText = 'Pousa o equipamento numa superfície estável para a leitura de proximidade.';

    const displayCopy = {
      title: rec && rec !== 'none' ? 'Recomendação de Hardware' : null,
      description: copyText,
      showPlacement: rec !== 'none'
    };

    return { base: data, copy: displayCopy };
  };

  const selectExecutionViewModel = (sessionCompleted: boolean, isConfirming: boolean): SessionExecutionRuntimeViewModel => {
    let modeLabel = '';
    let modeHint = '';
    
    switch (currentExecutionMode) {
      case 'follow':
        modeLabel = 'Acompanhamento Discreto';
        modeHint = 'Registo silencioso sem interrupções.';
        break;
      case 'guide':
        modeLabel = 'Doutrina Guiada';
        modeHint = 'Direção explícita no próximo passo.';
        break;
      case 'hybrid':
      default:
        modeLabel = 'Modo Misto';
        modeHint = 'Orientação adaptativa. Foco nas transições.';
        break;
    }

    const hw = getPlacementCopy('running_intervals', 1.0); // Dummy concept for now
    
    let primaryTrainingState: SessionExecutionRuntimeViewModel['primaryTrainingState'] = 'scheduled';
    if (sessionCompleted) primaryTrainingState = 'ended';
    else if (isConfirming) primaryTrainingState = 'validating';
    else if (ambientMode) primaryTrainingState = 'ambient';
    else primaryTrainingState = 'active';

    const placementPrompt = hw.copy.showPlacement ? `${hw.copy.description}` : 'Placement livre. A acompanhar com detalhe ajustado.';
    
    let captureNotice = null;
    if (hw.base.captureMode && hw.base.captureMode !== 'unknown') {
       captureNotice = `Tracking: ${hw.base.captureMode.replace('_', ' ')}`;
    }

    return {
      executionModeLabel: modeLabel,
      executionModeHint: modeHint,
      ambientVisible: ambientMode,
      primaryTrainingState,
      placementPrompt,
      captureNotice,
      showMinimalUI: ambientMode || sessionCompleted,
      showDetailedUI: !ambientMode && !sessionCompleted && !isConfirming,
      confirmationReady: isConfirming && !sessionCompleted
    };
  };

  const dispatchSessionComplete = async (sessionId: string, confirmRealWorkout: boolean): Promise<{ success: boolean; reason?: string }> => {
    // Legacy support ou path via Confirmation UI rápido
    return dispatchWorkoutConfirmation(sessionId, confirmRealWorkout ? 'confirmed' : 'probable');
  };

  const context = useMotionStore(selectors.selectInferenceContext);
  const workoutHistory = useMotionStore(selectors.selectWorkoutHistory);

  const checkForInferredWorkouts = () => {
    // Simulando signals de origem de OS_Health ou wearable num loop futuro
    const mockSignals: any[] = [
      { type: 'accelerometer_activity', confidence: 0.6, timestamp: new Date().toISOString(), source: 'os_health' },
      { type: 'heart_rate_elevation', confidence: 0.8, timestamp: new Date().toISOString(), source: 'wearable' }
    ];

    // Verificar se já houve treino ativo na última hora (para o contexto V2.1)
    const oneHourAgo = new Date(Date.now() - 3600000).getTime();
    const hasConfirmedRecent = workoutHistory.some(r => new Date(r.confirmedAt).getTime() > oneHourAgo);

    const inferenceContext = {
      currentTime: new Date().toISOString(),
      currentExecutionMode,
      lastUserDisposition: context.lastDisposition || undefined,
      lastPromptAt: context.lastPromptAt || undefined,
      hasConfirmedWorkoutInWindow: hasConfirmedRecent
    };

    const decision = workoutInferenceService.evaluateSignals(mockSignals, inferenceContext);
    
    if (decision.state !== 'none') {
      const pendingWorkout = workoutInferenceService.createPendingWorkout(decision);
      if (pendingWorkout) {
        storeActions.setInferredWorkout(pendingWorkout);
      }
    }
  };

  const dispatchInferredWorkoutConfirmation = async (state: WorkoutConfirmationState): Promise<{ success: boolean; reason?: string }> => {
    if (!inferredWorkout) return { success: false, reason: 'not_found' };
    
    // Cleanup immediato do prompt da UI
    const workoutToProcess = { ...inferredWorkout };
    if (state === 'dismissed' || state === 'confirmed') {
      storeActions.setInferredWorkout(null);
    }

    if (state === 'deferred') {
       storeActions.setInferenceDisposition('deferred');
       trackEvent(MotionEvents.INFERRED_WORKOUT_DEFERRED, { inferredId: workoutToProcess.id });
       storeActions.setInferredWorkout(null);
       return { success: true };
    }

    if (state === 'dismissed') {
       storeActions.setInferenceDisposition('dismissed');
       trackEvent(MotionEvents.INFERRED_WORKOUT_DISMISSED, { inferredId: workoutToProcess.id });
       return { success: true };
    }

    // state === 'confirmed'
    trackEvent(MotionEvents.INFERRED_WORKOUT_CONFIRMED, { inferredId: workoutToProcess.id });
    
    // Redirect to the normal pipeline since it becomes a real contribution
    const outcome: WorkoutOutcome = {
      interesting: { consistency: 'treino inferido fora da sessão' },
      useful: { countsAs: plan?.targetPhase || 'Manutenção' } 
    };

    const contribution = workoutContributionMapper(workoutToProcess.id, state, outcome);
    const result = await motionHostWritebackAdapter.attemptWriteback(contribution, isDemo, isHistory, hasWritePermission);

    if (result.success) {
      trackEvent(MotionEvents.WRITEBACK_SENT);
      
      const newRecord: ConfirmedWorkoutRecord = {
        id: workoutToProcess.id,
        source: 'passive_inference',
        confirmedAt: new Date().toISOString(),
        isLocalOnly: isDemo,
        isHistoricalContext: isHistory,
        syncStatus: isDemo ? 'local_only' : 'synced',
        enrichmentStatus: 'not_requested',
        wellnessImpact: {
          interestingOutcome: outcome.interesting.consistency,
          usefulOutcome: 'Impacta Manutenção Automática',
          displayState: isDemo ? 'local_only' : 'sent'
        },
        wellnessFeedback: result.success && result.feedback ? result.feedback : {
          receivedAt: new Date().toISOString(),
          source: 'local_projection',
          feedbackState: 'projected',
          domainsTouched: ['activity', 'consistency'],
          consistencySignal: 'Sinal assimilado paramatricamente'
        }
      };
      storeActions.addOrUpdateWorkoutRecord(newRecord);

      // Despoleta reconciliação pendente do host
      if (!isDemo && !isHistory) {
         motionHostFeedbackService.attemptFeedbackReconciliation(workoutToProcess.id);
      }

      // Ativa o prompt opcional de enriquecimento
      setPendingEnrichmentTarget({ executionId: workoutToProcess.id, source: 'passive_inference' });
    }
    else {
      trackEvent(MotionEvents.WRITEBACK_FAILED);
      const newRecord: ConfirmedWorkoutRecord = {
        id: workoutToProcess.id,
        source: 'passive_inference',
        confirmedAt: new Date().toISOString(),
        isLocalOnly: isDemo,
        isHistoricalContext: isHistory,
        syncStatus: 'failed',
        enrichmentStatus: 'not_requested'
      };
      storeActions.addOrUpdateWorkoutRecord(newRecord);

      // Adiciona V3.2 Retry Queue (Só se for falha estrutural, demo não precisa/não tem host real)
      if (!isDemo && !isHistory) {
        motionRetryQueueService.enqueueFailedContribution(workoutToProcess.id, contribution, 'post_confirm', result.reason);
      }
    }

    return result;
  };

  const dispatchWorkoutConfirmation = async (sessionId: string, state: WorkoutConfirmationState): Promise<{ success: boolean; reason?: string }> => {
    if (isHistory) return { success: false, reason: 'blocked_history' };
    if (!hasWritePermission && !isDemo) return { success: false, reason: 'failed' };

    storeActions.setWorkoutConfirmationState(state);

    if (state === 'deferred') {
       trackEvent(MotionEvents.WORKOUT_CONFIRMATION_DEFERRED, { sessionId });
       return { success: true };
    }

    if (state === 'dismissed') {
       trackEvent(MotionEvents.WORKOUT_DISMISSED, { sessionId });
       // No writeback or session complete since user rejected training
       storeActions.setWorkoutConfirmationState(null); // Reset
       return { success: true };
    }

    // confirmed or probable
    trackEvent(state === 'confirmed' ? MotionEvents.WORKOUT_CONFIRMED : MotionEvents.WORKOUT_PROBABLE, { sessionId });
    storeActions.markSessionCompletedLocal(sessionId);

    const outcome: WorkoutOutcome = {
      interesting: { consistency: 'fluxo contínuo mantido' },
      useful: { countsAs: plan?.targetPhase || 'Manutenção' }
    };
    
    // mapper generates MotionContribution
    const contribution = workoutContributionMapper(sessionId, state, outcome);
    const result = await motionHostWritebackAdapter.attemptWriteback(contribution, isDemo, isHistory, hasWritePermission);

    if (result.success) {
      trackEvent(MotionEvents.WRITEBACK_SENT);
      if (state === 'confirmed') {
        const newRecord: ConfirmedWorkoutRecord = {
          id: sessionId,
          source: 'session',
          sessionId: sessionId,
          confirmedAt: new Date().toISOString(),
          isLocalOnly: isDemo,
          isHistoricalContext: isHistory,
          syncStatus: isDemo ? 'local_only' : 'synced',
          enrichmentStatus: 'not_requested',
          // V4.0 Kinematic Score Tracking Mock
          totalExecutionScore: Math.floor(Math.random() * 800) + 1000, // Random between 1000 and 1800 (1500 target allows occasional Beast modes)
          averageExecutionPercent: 95,
          dictionaryVersion: '1.0',
          scoringVersion: '1.0',
          executedExercises: [
            { exerciseId: 'pushup', exerciseType: 'strength', repetitionCount: 50, seriesCount: 4, averageExecutionPercent: 100, totalScore: 400, muscleDistribution: ['upper-front', 'systemic', 'core'] },
            { exerciseId: 'squat', exerciseType: 'strength', repetitionCount: 100, seriesCount: 5, averageExecutionPercent: 92, totalScore: 800, muscleDistribution: ['lower-front', 'systemic', 'core'] }
          ],
          dominantMuscleGroup: 'lower-front',
          wellnessImpact: {
             interestingOutcome: outcome.interesting.consistency,
             usefulOutcome: 'Registo contínuo garantido',
             displayState: isDemo ? 'local_only' : 'sent'
          },
          wellnessFeedback: result.success && result.feedback ? result.feedback : {
            receivedAt: new Date().toISOString(),
            source: 'local_projection',
            feedbackState: 'projected',
            domainsTouched: ['activity', 'consistency'],
            consistencySignal: 'Sinal retido localmente'
          }
        };
        storeActions.addOrUpdateWorkoutRecord(newRecord);

        // Despoleta reconciliação pendente do host
        if (!isDemo && !isHistory) {
           motionHostFeedbackService.attemptFeedbackReconciliation(sessionId);
        }

        setPendingEnrichmentTarget({ executionId: sessionId, source: 'session' });
      }
    }
    else {
      trackEvent(MotionEvents.WRITEBACK_FAILED);
      if (state === 'confirmed') {
        const newRecord: ConfirmedWorkoutRecord = {
          id: sessionId,
          source: 'session',
          sessionId: sessionId,
          confirmedAt: new Date().toISOString(),
          isLocalOnly: isDemo,
          isHistoricalContext: isHistory,
          syncStatus: 'failed',
          enrichmentStatus: 'not_requested'
        };
        storeActions.addOrUpdateWorkoutRecord(newRecord);

        // Adiciona V3.2 Retry Queue
        if (!isDemo && !isHistory) {
          motionRetryQueueService.enqueueFailedContribution(sessionId, contribution, 'post_confirm', result.reason);
        }
      }
    }

    return result;
  };

  const dispatchWorkoutEnrichment = async (input: WorkoutEnrichmentInput | null): Promise<{ success: boolean; reason?: string }> => {
    if (!pendingEnrichmentTarget) return { success: false, reason: 'not_found' };
    
    const target = pendingEnrichmentTarget;
    setPendingEnrichmentTarget(null); // Fecha sempre o flow independentemente do desfecho

    if (!input) {
      trackEvent(MotionEvents.ENRICHMENT_SKIPPED, { executionId: target.executionId });
      storeActions.addOrUpdateWorkoutRecord({
        id: target.executionId,
        source: target.source,
        confirmedAt: new Date().toISOString(),
        isLocalOnly: isDemo,
        isHistoricalContext: isHistory,
        syncStatus: isDemo ? 'local_only' : 'synced',
        enrichmentStatus: 'skipped'
      });
      return { success: true };
    }

    if (isHistory) return { success: false, reason: 'blocked_history' };
    if (!hasWritePermission && !isDemo) return { success: false, reason: 'failed' };

    trackEvent(MotionEvents.ENRICHMENT_SAVED, { executionId: target.executionId, input });

    const hasFullDetail = input.workoutType && input.perceivedIntensity && input.feltState;
    const finalEnrichmentStatus = hasFullDetail ? 'enriched' : 'partial';

    // Gera um novo metadata overwrite enriched
    const outcome: WorkoutOutcome = {
      interesting: { 
        consistency: input.feltState ? `Sensação registada: ${input.feltState}` : 'Detalhe enriquecido' 
      },
      useful: { 
        countsAs: plan?.targetPhase || 'Manutenção', 
        fatigueIndication: input.perceivedIntensity,
        recoveryRecommendation: input.discomfortReported && input.discomfortReported !== 'none' 
          ? `Desconforto (${input.discomfortReported}) sinalizado.` 
          : undefined
      }
    };

    const contribution = workoutContributionMapper(target.executionId, finalEnrichmentStatus as any, outcome, { source: target.source });
    const result = await motionHostWritebackAdapter.attemptWriteback(contribution, isDemo, isHistory, hasWritePermission);

    if (result.success) {
      trackEvent(MotionEvents.WRITEBACK_SENT, { type: finalEnrichmentStatus });
      storeActions.addOrUpdateWorkoutRecord({
        id: target.executionId,
        source: target.source,
        confirmedAt: new Date().toISOString(),
        isLocalOnly: isDemo,
        isHistoricalContext: isHistory,
        syncStatus: isDemo ? 'local_only' : 'synced',
        workoutType: input.workoutType,
        perceivedIntensity: input.perceivedIntensity,
        feltState: input.feltState,
        discomfortReported: input.discomfortReported,
        enrichmentStatus: finalEnrichmentStatus,
        wellnessImpact: {
           interestingOutcome: outcome.interesting.consistency,
           usefulOutcome: input.perceivedIntensity ? 'Intensidade alimenta radar de fadiga' : 'Sinal parcial registado',
           fatigueIndication: input.perceivedIntensity,
           displayState: isDemo ? 'local_only' : 'ready' 
        },
        wellnessFeedback: result.success && result.feedback ? result.feedback : {
          receivedAt: new Date().toISOString(),
          source: 'local_projection',
          feedbackState: 'projected',
          domainsTouched: ['activity', 'consistency', ...(input.discomfortReported && input.discomfortReported !== 'none' ? ['recovery'] : [])],
          consistencySignal: 'Sinal detalhado em histórico local',
          recoverySignal: input.discomfortReported && input.discomfortReported !== 'none' ? 'Atenção à recuperação anotada' : undefined
        }
      });

      // Despoleta reconciliação pendente do host após enriquecimento extra (novo payload sync output)
      if (!isDemo && !isHistory) {
         motionHostFeedbackService.attemptFeedbackReconciliation(target.executionId);
      }
    }
    else {
      trackEvent(MotionEvents.WRITEBACK_FAILED);
      storeActions.addOrUpdateWorkoutRecord({
        id: target.executionId,
        source: target.source,
        confirmedAt: new Date().toISOString(),
        isLocalOnly: isDemo,
        isHistoricalContext: isHistory,
        syncStatus: 'failed',
        enrichmentStatus: 'not_requested' // Revertd logic or flag it as partial if necessary
      });

      // Adiciona V3.2 Retry Queue
      if (!isDemo && !isHistory) {
        motionRetryQueueService.enqueueFailedContribution(target.executionId, contribution, 'post_enrichment', result.reason);
      }
    }

    return result;
  };

  const dispatchUpdateExecutionMode = (mode: ExecutionMode) => {
    storeActions.setExecutionMode(mode);
    trackEvent(MotionEvents.EXECUTION_MODE_SELECTED, { mode });
  };

  return {
    ambientMode,
    setAmbientMode: toggleAmbientMode,
    selectExecutionViewModel,
    currentExecutionMode,
    activeWorkoutState,
    inferredWorkout,
    pendingEnrichmentTarget,
    getPlacementCopy,
    dispatchSessionComplete,
    dispatchWorkoutConfirmation,
    checkForInferredWorkouts,
    dispatchInferredWorkoutConfirmation,
    dispatchWorkoutEnrichment,
    dispatchUpdateExecutionMode
  };
};
