import { ConfirmedWorkoutRecord } from '../contracts/types';
import { WellnessRelationModel } from '../contracts/metricsModels';

export const extractWellnessRelations = (history: ConfirmedWorkoutRecord[]): WellnessRelationModel | null => {
  const associations: WellnessRelationModel['associations'] = [];

  history.forEach(r => {
    // 1. Procurar Sinais de Recuperação Host-Side (ablute)
    if (r.wellnessFeedback?.recoverySignal && associations.length < 3) {
      const distinctId = 'rec_' + r.wellnessFeedback.recoverySignal;
      if (!associations.some(a => a.id === distinctId)) {
        
        // Associação observacional neutra: "O volume coincidiu com..."
        const contextStr = r.perceivedIntensity === 'hard' 
          ? 'após esforços de intensidade elevada' 
          : 'em regime predominantemente misto';

        associations.push({
          id: distinctId,
          indicator: 'Sinal Consolidado de Recuperação',
          narrative: `O teu padrão recente tem coincidido com ${r.wellnessFeedback.recoverySignal.toLowerCase()} ${contextStr}.`
        });
      }
    }

    // 2. Procurar Sinais de Consistência Host-Side
    if (r.wellnessFeedback?.consistencySignal && associations.length < 3) {
      const distinctId = 'con_' + r.wellnessFeedback.consistencySignal;
      if (!associations.some(a => a.id === distinctId)) {
        associations.push({
          id: distinctId,
          indicator: 'Sintonia de Consistência',
          narrative: `A estabilidade do treino alinhou visivelmente com ${r.wellnessFeedback.consistencySignal.toLowerCase()}.`
        });
      }
    }
  });

  if (associations.length === 0) return null; // Abort and render empty state

  return { associations };
};
