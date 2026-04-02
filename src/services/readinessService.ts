import { ReadinessSignal } from '../contracts/types';

export const readinessService = {
  calculateDailyReadiness: (baseProfileScore: number, dailyInputs: any): ReadinessSignal => {
    // TODO: Implementar cálculo real combinando o baseline do activeAnalysis 
    // com o formulário local introduzido no dia.
    
    return {
      score: baseProfileScore,
      fatigueReported: dailyInputs?.fatigue === true,
      date: new Date().toISOString()
    };
  }
};
