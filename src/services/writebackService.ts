import { MotionContribution } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';

export type WritebackResult = 
  | { success: true }
  | { success: false; reason: 'blocked_demo' | 'blocked_history' | 'blocked_permissions' | 'transmission_error' };

export const writebackService = {
  attemptWriteback: async (
    contribution: MotionContribution,
    isDemo: boolean,
    isHistory: boolean,
    hasWritePermission: boolean
  ): Promise<WritebackResult> => {
    
    // Preparação sempre regista a transação local validada em backend
    trackEvent(MotionEvents.CONTRIBUTION_PREPARED, { type: contribution.type });

    // Defesa em Profundidade 1: Modo Demo Activo
    if (isDemo) {
      trackEvent(MotionEvents.WRITEBACK_BLOCKED_DEMO);
      return { success: false, reason: 'blocked_demo' };
    }

    // Defesa em Profundidade 2: Modo Histórico Activo 
    // Embala o isolamento temporal impedindo transmissões falsificadas se a View falhar as barreiras React
    if (isHistory) {
      trackEvent(MotionEvents.WRITEBACK_BLOCKED_HISTORY);
      return { success: false, reason: 'blocked_history' };
    }

    // Defesa em Profundidade 3: Gestão central de permissões passivas da shell
    if (!hasWritePermission) {
      return { success: false, reason: 'blocked_permissions' };
    }

    try {
      // TODO: Connector de transação passivo - substitui este mock quando conectarmos a ponte nativa
      console.log('[WRITEBACK SERVICE] Operação autorizada:', contribution);
      trackEvent(MotionEvents.WRITEBACK_SENT, { type: contribution.type });
      return { success: true };
    } catch (error) {
      trackEvent(MotionEvents.WRITEBACK_FAILED, { error });
      return { success: false, reason: 'transmission_error' };
    }
  }
};
