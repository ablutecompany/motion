import { HostOutboundMessage } from '../contracts/hostRuntimeContract';
import { motionHostContextAdapter } from './motionHostContextAdapter';
import { motionHostWritebackAdapter } from './motionHostWritebackAdapter';
import { motionHostFeedbackAdapter } from './motionHostFeedbackAdapter';

export const motionHostIntegrationFacade = {
  // 1. Contexto Recebido
  adaptContext: (raw?: any) => motionHostContextAdapter.adapt(raw),

  // 2. Transmissão Assíncrona de Contributions (Writeback)
  attemptWriteback: (c: any, d: boolean, h: boolean, w: boolean) => motionHostWritebackAdapter.attemptWriteback(c, d, h, w),

  // 3. Listener Passivo de Feedback Direto
  awaitFeedback: (record: any) => motionHostFeedbackAdapter.awaitFeedback(record),

  // 4. Analytics & Core Commands
  emitOutboundEvent: (type: HostOutboundMessage['type'], payload?: any) => {
    const message: HostOutboundMessage = {
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type,
      payload
    };

    try {
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
      } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      } else {
         // Silencioso em isolamento standalone
      }
    } catch(e) {
      console.warn('Erro a emitir evento para host', e);
    }
  }
};
