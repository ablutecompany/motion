import { WorkoutHostFeedback, ConfirmedWorkoutRecord } from '../contracts/types';

/**
 * motionHostFeedbackAdapter
 * 
 * Camada de Teste Isolada (Mock) para V3.5.
 * Simula de forma programável a resposta do Master Host a um Writeback.
 * ATENÇÃO: Identificará sempre isSimulatedHostFeedback: true de acordo com os contratos de honradez local.
 */
class HostFeedbackAdapter {
  
  /**
   * Transforma um record rececionado do host num objeto `WorkoutHostFeedback`.
   * No mundo real isto desempacotaria JSON da API.
   * Aqui simularemos uma resposta.
   */
  public async simulateInboundWebhook(workoutRecord: ConfirmedWorkoutRecord): Promise<WorkoutHostFeedback | null> {
    
    // Não disparamos mocks se for dem/histórico (mesmo se as guards falharem e ele chegar aqui)
    if (workoutRecord.isHistoricalContext) return null;
    
    // Fingir tempo de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Determinar se vamos devolver um feedback real ou calar-nos.
    // Para efeito de teste de aceitação V3.5, se for um treino "intenso" devolvemos um foco de recuperação.
    // Se for "leve", não devolvemos nada para provar o fallback.
    if (workoutRecord.perceivedIntensity === 'light') {
      return null; // O Host ignorou ou não tem nada a dizer. Mantemos comportamento de V2.6
    }
    
    // Simulated Feedback Payload
    const simulatedPayload: WorkoutHostFeedback = {
      feedbackId: `fb-mock-${Date.now()}`,
      workoutRecordId: workoutRecord.id,
      source: 'host_feedback',
      receivedAt: new Date().toISOString(),
      status: 'received',
      payload: {
        raw_insights: { recovery_needed: true, fatigue_trend: 'elevated' }
      },
      summary: 'Sobrecarga central detectada perante histórico Master.',
      hostVersion: 'ablute-master-v1',
      actionableFlags: ['PRIORITIZE_RECOVERY'],
      confidence: 0.85,
      isSimulatedHostFeedback: true // OBRIGATÓRIO (Regra Crítica V3.5)
    };

    return simulatedPayload;
  }
}

export const motionHostFeedbackAdapter = new HostFeedbackAdapter();
