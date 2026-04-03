import { storeActions, useMotionStoreBase } from '../store/useMotionStore';
import { 
  MotionSyncQueueItem, 
  MotionSyncEligibility,
  MotionContribution
} from '../contracts/types';
import { trackEvent } from '../analytics/events';

/**
 * motionSyncPolicy: Regras estritas isoladas sobre elegibilidade de reenvio.
 * Mantém o histórico protegido e recusa tentativas desgovernadas.
 */
export const motionSyncPolicy = {
  checkEligibility: (item: MotionSyncQueueItem): MotionSyncEligibility => {
    const state = useMotionStoreBase.getState();

    // 1. Guards globais de estado da app
    if (state.integration.isDemoActive) return { eligible: false, reason: 'demo_blocked' };
    if (state.integration.isHistoryModeActive) return { eligible: false, reason: 'history_blocked' };
    
    // 2. Payload safety
    if (!item.contributionPayload) return { eligible: false, reason: 'missing_payload' };

    // 3. Status
    if (item.syncStatus === 'synced') return { eligible: false, reason: 'already_synced' };

    // 4. Limite duro de tentativas
    const MAX_ATTEMPTS = 5;
    if (item.attemptCount >= MAX_ATTEMPTS) return { eligible: false, reason: 'max_attempts' };

    // 5. Cooldown simulado
    if (item.nextEligibleAt && new Date() < new Date(item.nextEligibleAt)) {
      return { eligible: false, reason: 'cooldown' };
    }

    return { eligible: true, reason: 'ready' };
  },

  calculateNextCooldown: (currentAttempt: number): string => {
    // Backoff simples: 1m, 5m, 15m, 60m...
    const backoffMinutes = [1, 5, 15, 60, 240];
    const index = Math.min(currentAttempt, backoffMinutes.length - 1);
    return new Date(Date.now() + backoffMinutes[index] * 60000).toISOString();
  }
};

/**
 * motionRetryQueueService: Ponto de Injeção Isolado (Add to Queue)
 * É usado diretamente pela facade aquando de um fail de writeback,
 * para garantir que o retry existe localmente.
 */
export const motionRetryQueueService = {
  enqueueFailedContribution: (
    workoutRecordId: string, 
    payload: MotionContribution, 
    sourceContext: 'post_confirm' | 'post_enrichment',
    failureReason?: string
  ) => {
    const state = useMotionStoreBase.getState();
    const existingQ = state.execution.syncQueue || [];

    // Previne dupes
    const existingItem = existingQ.find(i => i.workoutRecordId === workoutRecordId && i.sourceContext === sourceContext);
    
    if (existingItem) {
      trackEvent('motion_sync_queue_ignored_duplicate', { workoutRecordId });
      return; 
    }

    const newItem: MotionSyncQueueItem = {
      queueItemId: `Q-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      workoutRecordId,
      contributionPayload: payload,
      createdAt: new Date().toISOString(),
      attemptCount: 0,
      syncStatus: 'failed',
      sourceContext,
      failureReason,
      nextEligibleAt: motionSyncPolicy.calculateNextCooldown(0)
    };

    trackEvent('motion_sync_queue_enqueued', { 
      workoutRecordId, 
      source: sourceContext 
    });

    storeActions.upsertQueueItem(newItem);
  }
};
