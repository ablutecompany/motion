import { MotionContribution } from '../contracts/types';

export interface HostMessageEnvelope {
  appId: '_motion';
  version: '1.0.0';
  timestamp: string;
  type: 'app_ready' | 'analytics_event' | 'contribution_event' | 'close_app' | 'context_request';
  payload?: any;
}

const sendToHost = (message: HostMessageEnvelope) => {
  try {
    // 1. Adaptação primária: React Native WebView message bus (Host nativo)
    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    } 
    // 2. Adaptação secundária: iFrame / Web browser host
    else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(message, '*');
    } 
    // 3. Fallback passivo: desenvolvimento puro ou test suite local sem estourar
    else {
      console.log(`[HOST BRIDGE FALLBACK] Type: ${message.type}`, message.payload || '');
    }
  } catch (err) {
    console.error('[HOST BRIDGE ERROR] Falha no envelope de comunicação com a Shell:', err);
  }
};

export const hostBridge = {
  notifyAppReady: () => {
    sendToHost({
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type: 'app_ready'
    });
  },

  emitAnalytics: (eventName: string, properties: Record<string, any> = {}) => {
    sendToHost({
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type: 'analytics_event',
      payload: { event: eventName, properties }
    });
  },

  emitContribution: (contribution: MotionContribution) => {
    sendToHost({
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type: 'contribution_event',
      payload: contribution
    });
  },

  closeApp: () => {
    sendToHost({
      appId: '_motion',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type: 'close_app'
    });
  }
};
