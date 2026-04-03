import { motionHostIntegrationFacade } from './motionHostIntegrationFacade';

export const hostBridge = {
  notifyAppReady: () => {
    motionHostIntegrationFacade.emitOutboundEvent('app_ready');
  },

  emitAnalytics: (eventName: string, properties: Record<string, any> = {}) => {
    motionHostIntegrationFacade.emitOutboundEvent('analytics_event', { event: eventName, properties });
  },

  closeApp: () => {
    motionHostIntegrationFacade.emitOutboundEvent('close_app');
  }
};
