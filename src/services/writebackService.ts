import { MotionContribution } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';
import { hostBridge } from '../integration/hostBridge';

export type WritebackResult = 
  | { success: true; feedback?: import('../contracts/types').WorkoutWellnessFeedback }
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
      // O hostBridge V1 não é assincrono, mantemos assim.
      // Preparamos o result para quando a infra permitir retorno assíncrono.
      hostBridge.emitContribution(contribution);
      trackEvent(MotionEvents.WRITEBACK_SENT, { type: contribution.type });
      
      return { success: true, feedback: undefined }; // Ainda não há retorno real do host
    } catch (error) {
      trackEvent(MotionEvents.WRITEBACK_FAILED, { error });
      return { success: false, reason: 'transmission_error' };
    }
  }
};
