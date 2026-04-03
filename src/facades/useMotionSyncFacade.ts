import { useMotionStoreBase, useMotionStore, selectors } from '../store/useMotionStore';
import { motionSyncReconciler } from '../services/motionSyncReconciler';
import { motionSyncPolicy } from '../services/motionSyncPolicy';
import { ConfirmedWorkoutRecord } from '../contracts/types';
import { useCallback } from 'react';

/**
 * Facade Exclusiva para Sync e Retry Queue (V3.2)
 * Garante que a UI não manipula diretamente lógicas de rede ou reconciliação.
 */
export const useMotionSyncFacade = () => {
  const syncQueue = useMotionStore(selectors.selectSyncQueue);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const isHistory = useMotionStore(selectors.selectIsHistory);

  /**
   * getSyncDisplayState
   * Interpreta o syncStatus dum record cruzando com a veracidade do modo da app.
   */
  const getSyncDisplayState = useCallback((recordId: string, status: ConfirmedWorkoutRecord['syncStatus']) => {
    if (isDemo || isHistory) {
      return {
        label: 'Retido (Demo/Histórico)',
        syncMode: 'blocked',
        color: 'gray'
      };
    }

    const inQueueItem = syncQueue.find(q => q.workoutRecordId === recordId);
    if (inQueueItem && inQueueItem.syncStatus === 'pending') {
      return { label: 'Sincronização Pendente', syncMode: 'syncing', color: 'blue' };
    }

    switch (status) {
      case 'synced': return { label: 'Sincronizado', syncMode: 'synced', color: 'green' };
      case 'failed': return { label: 'Falha de Sincronização', syncMode: 'failed', color: 'red' };
      case 'pending': return { label: 'Sincronização pendente', syncMode: 'syncing', color: 'blue' };
      case 'local_only': return { label: 'Local Only', syncMode: 'local', color: 'yellow' };
      default: return { label: 'Desconhecido', syncMode: 'unknown', color: 'gray' };
    }
  }, [isDemo, isHistory, syncQueue]);

  /**
   * canRetrySync
   * Diz à UI para renderizar o CTA "Tentar novamente" apenas se:
   * 1. App não está em history/demo
   * 2. Existe na queue
   * 3. Passa na Policy `checkEligibility`
   */
  const canRetrySync = useCallback((recordId: string): boolean => {
    if (isDemo || isHistory) return false;
    
    const queueItem = syncQueue.find(q => q.workoutRecordId === recordId);
    if (!queueItem) return false;
    
    const eligibility = motionSyncPolicy.checkEligibility(queueItem);
    return eligibility.eligible;
  }, [isDemo, isHistory, syncQueue]);

  /**
   * retrySync
   * Dispara ativamente uma trigger 'manual_retry' pelo Reconciliador.
   */
  const retrySync = useCallback(async (recordId: string) => {
    const queueItem = syncQueue.find(q => q.workoutRecordId === recordId);
    if (!queueItem) return;
    
    await motionSyncReconciler.processQueueItem(queueItem.queueItemId, 'manual_retry');
  }, [syncQueue]);

  return {
    retryEligibleCount: syncQueue.filter(q => motionSyncPolicy.checkEligibility(q).eligible).length,
    syncQueue,
    getSyncDisplayState,
    canRetrySync,
    retrySync
  };
};
