import { v4 as uuidv4 } from 'uuid';
import { storeActions } from '../store/useMotionStore';
import { MotionSyncQueueItem, MotionContribution } from '../contracts/types';
import { trackEvent } from '../analytics/events';

export const motionRetryQueueService = {
  enqueueFailedContribution: (
    workoutRecordId: string, 
    contributionPayload: MotionContribution, 
    contextSource: string, 
    reason?: string
  ) => {
    const queueItem: MotionSyncQueueItem = {
      queueItemId: uuidv4(),
      workoutRecordId,
      contributionPayload,
      attemptCount: 0,
      firstFailedAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(),
      failureReason: reason,
      syncStatus: 'failed',
      nextEligibleAt: new Date().toISOString()
    };

    storeActions.upsertQueueItem(queueItem);
    
    trackEvent('motion_sync_enqueued', { 
      workoutRecordId, 
      contextSource, 
      reason 
    });
  }
};
