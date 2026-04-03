import { WorkoutHostFeedback, ConfirmedWorkoutRecord } from '../contracts/types';
import { HostInboundFeedbackEvent } from '../contracts/hostRuntimeContract';

export const motionHostFeedbackAdapter = {
  /**
   * motionHostFeedbackAdapter (V4 real)
   * 
   * Aguarda um inbound bus event da shell e constrói o Host Feedback formal.
   * Mantém um encapsulamento de teste visível e auditado caso o bypass esteja activo.
   */
  awaitFeedback: async (workoutRecord: ConfirmedWorkoutRecord): Promise<WorkoutHostFeedback | null> => {
    // 1. Defesa em Profundidade: Históricos nunca sondam feedback dinâmico
    if (workoutRecord.isHistoricalContext) return null;

    // 2. Módulo de Test Isolation (Para Sandboxes locais, providenciando o Mock de V3.5)
    // Mantido por requisitos estritos ("não misturar mock/prod sem marcação clara")
    const isMockBypassActive = typeof window !== 'undefined' && (window as any)._MOTION_TEST_BYPASS_FEEDBACK;

    if (isMockBypassActive) {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (workoutRecord.perceivedIntensity === 'light') return null;
      return {
        feedbackId: `fb-mock-${Date.now()}`,
        workoutRecordId: workoutRecord.id,
        source: 'host_feedback',
        receivedAt: new Date().toISOString(),
        status: 'received',
        payload: { raw_insights: { recovery_needed: true, fatigue_trend: 'elevated' } },
        summary: 'Sobrecarga central detectada perante histórico Master.',
        hostVersion: 'ablute-master-v1',
        actionableFlags: ['PRIORITIZE_RECOVERY'],
        confidence: 0.85,
        isSimulatedHostFeedback: true 
      };
    }

    // 3. Runtime de Produção Real (Busca assíncrona passiva sem travar o Boot)
    return new Promise((resolve) => {
      // O host tem 10 segundos para responder a eventos pós-writeback (timeout amigável)
      const timer = setTimeout(() => {
        window.removeEventListener('message', listener);
        resolve(null); // Host não respondeu com feedback
      }, 10000);

      const listener = (event: MessageEvent) => {
        try {
          const rawData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          // Confirma Contrato Real
          if (rawData && rawData.type === 'host_feedback_inbound') {
            const inboundPayload = rawData.payload as HostInboundFeedbackEvent;
            
            // Só escutamos e interceptamos feedback para este Record exato
            if (inboundPayload && inboundPayload.workoutRecordId === workoutRecord.id) {
              clearTimeout(timer);
              window.removeEventListener('message', listener);
              
              resolve({
                feedbackId: `fb-prod-${Date.now()}`,
                workoutRecordId: workoutRecord.id,
                source: 'host_feedback',
                receivedAt: new Date().toISOString(),
                status: 'received',
                payload: inboundPayload,
                summary: inboundPayload.systemMessage || 'Avaliação consumida passivamente',
                hostVersion: 'ablute-master-v2',
                actionableFlags: inboundPayload.actionableFlags || [],
                confidence: 0.99,
                isSimulatedHostFeedback: false
              });
            }
          }
        } catch (e) {
             // Ignora non-JSON messages de extensões
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('message', listener);
      } else {
         clearTimeout(timer);
         resolve(null); // Ambiente restrito Web Worker/Node
      }
    });
  }
};
