import { storeActions, useMotionStoreBase } from '../store/useMotionStore';
import { motionSyncPolicy } from './motionSyncPolicy';
import { motionHostWritebackAdapter } from '../integration/motionHostWritebackAdapter';
import { 
  MotionSyncTrigger, 
  MotionSyncAttempt 
} from '../contracts/types';
import { trackEvent } from '../analytics/events';

/**
 * motionSyncReconciler: Tenta reenviar registos de Queue pendentes.
 * Não cria duplicados; apenas edita a `syncStatus` do record existente 
 * na Store e remove da queue quando o `host` assimilou com sucesso.
 */
export const motionSyncReconciler = {
  
  processQueueItem: async (queueItemId: string, trigger: MotionSyncTrigger): Promise<void> => {
    const state = useMotionStoreBase.getState();
    const item = state.execution.syncQueue?.find(q => q.queueItemId === queueItemId);
    
    if (!item) return;

    // 1. Verificar Elegibilidade
    const eligibility = motionSyncPolicy.checkEligibility(item);
    
    if (!eligibility.eligible) {
      trackEvent('motion_sync_reconciler_skipped', { 
        queueItemId, 
        reason: eligibility.reason 
      });
      return;
    }

    trackEvent('motion_sync_reconciler_attempt_started', { queueItemId, trigger });

    // 2. Incrementar Contagem & Estado
    const nextAttemptCount = item.attemptCount + 1;
    storeActions.upsertQueueItem({
      ...item,
      attemptCount: nextAttemptCount,
      lastAttemptAt: new Date().toISOString(),
      syncStatus: 'pending' // Volta a pending logicamente para a UI reagir durante o reenvio.
    });

    // Extraídos os Contextos Guardados da App para Passar ao Writeback Adapter:
    const isDemo = state.integration.isDemoActive;
    const isHistory = state.integration.isHistoryModeActive;
    const hasWritePermission = state.integration.permissions?.write_workouts !== false; 

    // 3. Reconciliação no Host Bridge via Writeback Adapter Real
    const result = await motionHostWritebackAdapter.attemptWriteback(
        item.contributionPayload, 
        isDemo, 
        isHistory, 
        hasWritePermission
    );
    
    // Refresh das vars no micro-tick
    const currentHist = useMotionStoreBase.getState().progress.workoutHistory;
    const targetHistRecord = currentHist.find(r => r.id === item.workoutRecordId);

    if (result.success) {
      // SUCESSO: Tirar da fila e repor history record
      storeActions.removeQueueItem(item.queueItemId);
      
      if (targetHistRecord) {
        storeActions.addOrUpdateWorkoutRecord({
          ...targetHistRecord,
          syncStatus: 'synced'
        });
      }

      trackEvent('motion_sync_reconciler_attempt_success', { queueItemId, attempt: nextAttemptCount });

    } else {
      // FALHA ESTRUTURAL: Agendar nova retentativa e repor record state a failed
      const nextDate = motionSyncPolicy.calculateNextCooldown(nextAttemptCount);
      
      storeActions.upsertQueueItem({
        ...item,
        attemptCount: nextAttemptCount,
        lastAttemptAt: new Date().toISOString(),
        syncStatus: 'failed',
        failureReason: result.reason || 'unknown',
        nextEligibleAt: nextDate
      });

      if (targetHistRecord) {
        storeActions.addOrUpdateWorkoutRecord({
            ...targetHistRecord,
            syncStatus: 'failed'
        });
      }

      trackEvent('motion_sync_reconciler_attempt_failed', { 
        queueItemId, 
        attempt: nextAttemptCount, 
        reason: result.reason 
      });
    }
  }

};
