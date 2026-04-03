import { MotionWakeLockStatus } from '../contracts/types';
import { trackEvent } from '../analytics/events';

/**
 * motionWakeLockService
 * Wrapper defensivo sob a Screen Wake Lock API.
 * Protege contra faltas em Browser/WebViews mantendo honestidade no interface.
 */
class WakeLockService {
  private wakeLockObj: any = null;
  private currentStatus: MotionWakeLockStatus = 'idle';

  constructor() {
    this.checkSupport();
  }

  private checkSupport() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      this.currentStatus = 'idle';
    } else {
      this.currentStatus = 'unsupported';
    }
  }

  public getStatus(): MotionWakeLockStatus {
    return this.currentStatus;
  }

  public async requestLock(): Promise<MotionWakeLockStatus> {
    if (this.currentStatus === 'unsupported') return 'unsupported';

    this.currentStatus = 'requesting';
    trackEvent('motion_wakelock_request');

    try {
      // @ts-ignore - TS maybe missing spec
      this.wakeLockObj = await navigator.wakeLock.request('screen');
      this.currentStatus = 'active';
      
      this.wakeLockObj.addEventListener('release', () => {
        if (this.currentStatus === 'active') { // externally released
           this.currentStatus = 'released';
        }
      });
      
      trackEvent('motion_wakelock_active');
    } catch (err: any) {
      this.currentStatus = 'failed';
      trackEvent('motion_wakelock_failed', { error: err.name || 'unknown' });
    }

    return this.currentStatus;
  }

  public async releaseLock(): Promise<void> {
    if (this.wakeLockObj !== null && this.currentStatus === 'active') {
      try {
        await this.wakeLockObj.release();
        this.wakeLockObj = null;
        this.currentStatus = 'released';
        trackEvent('motion_wakelock_released');
      } catch (e) {
        // Ignora silenciosamente
      }
    }
  }
}

export const motionWakeLockService = new WakeLockService();
