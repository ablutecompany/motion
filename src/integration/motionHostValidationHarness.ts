import { HostAckMessage, HostInboundFeedbackEvent } from '../contracts/hostRuntimeContract';

/**
 * motionHostValidationHarness (V4.1)
 * 
 * Utilitário de injeção mínima acoplado passivamente na janela global para QA e Staging.
 * Permite desencadear Acks simulados e Inbounds via console.
 * Só opera se window estiver definido, e pode ser totalmente extinto em Release Production Final.
 */
export const mountValidationHarness = () => {
  if (typeof window === 'undefined') return;

  (window as any)._motionDev = {
    
    // 1. Emular o Host a responder um Sucesso ao Writeback
    triggerWritebackSuccess: (originalMessageId: string) => {
      const ack: HostAckMessage = {
        originalMessageId,
        status: 'success'
      };
      window.postMessage(JSON.stringify(ack), '*');
      console.info('[Motion Harness] Injected Writeback Success', ack);
    },

    // 2. Emular o Host a responder Falha
    triggerWritebackFail: (originalMessageId: string) => {
      const ack: HostAckMessage = {
        originalMessageId,
        status: 'fail'
      };
      window.postMessage(JSON.stringify(ack), '*');
      console.info('[Motion Harness] Injected Writeback Fail', ack);
    },

    // 3. Emular o disparo do Webhook de Feedback atrasado pelo Host
    triggerFeedbackWebhook: (workoutRecordId: string) => {
      const payload: HostInboundFeedbackEvent = {
        workoutRecordId,
        actionableFlags: ['PRIORITIZE_RECOVERY', 'DEMAND_CONSISTENCY'],
        domainsTouched: ['recovery', 'consistency'],
        systemMessage: '[Validação Harness] Pico de sobrecarga inferido.'
      };

      const event = {
        type: 'host_feedback_inbound',
        payload
      };

      window.postMessage(JSON.stringify(event), '*');
      console.info('[Motion Harness] Injected Feedback Webhook', event);
    }
  };
};
