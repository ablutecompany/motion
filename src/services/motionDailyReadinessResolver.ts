import { DailyReadinessContext } from '../contracts/trainingPlanTypes';

export const resolveDailyReadiness = (contextVariables: any): DailyReadinessContext => {
  // Infer Readiness based on context. 
  // In a real scenario, this taps into sleep tables, wellness trends, etc.
  
  const sleepSignal = contextVariables?.sleepScore > 80 ? 'good' : contextVariables?.sleepScore > 50 ? 'fair' : 'poor';
  const recentLoad = contextVariables?.recentLoadScore || 0;
  
  // Calculate synthetic proxy for testing logic
  let band: DailyReadinessContext['readinessBand'] = 'optimal';
  if (recentLoad > 80 || sleepSignal === 'poor') {
    band = 'depleted';
  } else if (recentLoad > 50) {
    band = 'constrained';
  } else if (sleepSignal === 'good') {
    band = 'optimal';
  } else {
    band = 'stable';
  }

  return {
    sleepSignal: sleepSignal as any,
    recoverySignal: band === 'optimal' ? 'fresh' : band === 'depleted' ? 'fatigued' : 'recovering',
    energySignal: band === 'optimal' ? 'high' : band === 'depleted' ? 'low' : 'normal',
    recentLoad: recentLoad,
    sorenessProxy: 0.2, // Mocked 
    adherenceTrend: 0.85,
    timeWindowLikely: 45,
    readinessBand: band,
    confidence: 0.8
  };
};
