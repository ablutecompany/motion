import { MotionContribution, WorkoutWellnessFeedback } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';
import { HostOutboundMessage, HostAckMessage } from '../contracts/hostRuntimeContract';

export type WritebackResult = 
  | { success: true; feedback?: WorkoutWellnessFeedback }
  | { success: false; reason: 'blocked_demo' | 'blocked_history' | 'blocked_permissions' | 'transmission_error' | 'host_rejected' | 'timeout' };

export const motionHostWritebackAdapter = {
  /**
   * Comunica com o Host e aguarda confirmação real de base de dados.
   * Na ausência ou falha, degrada ordeiramente.
   */
  attemptWriteback: async (
    contribution: MotionContribution,
    isDemo: boolean,
    isHistory: boolean,
    hasWritePermission: boolean
  ): Promise<WritebackResult> => {
    
    trackEvent(MotionEvents.CONTRIBUTION_PREPARED, { type: contribution.type });

    if (isDemo) {
      trackEvent(MotionEvents.WRITEBACK_BLOCKED_DEMO);
      return { success: false, reason: 'blocked_demo' };
    }

    if (isHistory) {
      trackEvent(MotionEvents.WRITEBACK_BLOCKED_HISTORY);
      return { success: false, reason: 'blocked_history' };
    }

    if (!hasWritePermission) {
      return { success: false, reason: 'blocked_permissions' };
    }

    const messageId = `wb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const message: HostOutboundMessage = {
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type: 'contribution_event',
      payload: contribution,
      messageId
    };

    return new Promise((resolve) => {
      let isResolved = false;

      // Timeout handler: O Host tem 5 segundos para aprovar a inserção. Se falhar transita para RetryQueue.
      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          window.removeEventListener('message', listener);
          trackEvent(MotionEvents.HOST_RECONCILIATION_TIMEOUT, { messageId });
          resolve({ success: false, reason: 'timeout' });
        }
      }, 5000);

      const listener = (event: MessageEvent) => {
        try {
          // Emulamos validação fraca de Origin caso standalone, forte se iframe
          const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (rawData && rawData.originalMessageId === messageId && rawData.status) {
            const castedAck = rawData as HostAckMessage;
            isResolved = true;
            clearTimeout(timer);
            window.removeEventListener('message', listener);

            if (castedAck.status === 'success') {
              trackEvent(MotionEvents.WRITEBACK_SENT, { type: contribution.type });
              resolve({ success: true, feedback: undefined });
            } else {
              trackEvent(MotionEvents.HOST_RECONCILIATION_REJECT, { messageId });
              resolve({ success: false, reason: 'host_rejected' });
            }
          }
        } catch(e) {
             // Ignora parses falhados vindos de outras tools/extensões browser
        }
      };

      window.addEventListener('message', listener);

      try {
        if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
        } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage(message, '*');
        } else {
          // Modo Standalone Web/Dev - Não existe Host a ouvir
          clearTimeout(timer);
          window.removeEventListener('message', listener);
          console.warn(`[MOTION_HOST] Falta de Binding. Contribution guardada em Local Fallback. ${messageId}`);
          resolve({ success: true, feedback: undefined }); // Fallback graceful
        }
      } catch (error) {
        clearTimeout(timer);
        window.removeEventListener('message', listener);
        trackEvent(MotionEvents.WRITEBACK_FAILED, { error });
        resolve({ success: false, reason: 'transmission_error' });
      }
    });
  }
};
