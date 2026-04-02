import { ActiveMotionContext, MotionProfile, ReadinessSignal } from '../contracts/types';

export const motionProfileBuilder = {
  build: (
    activeContext: ActiveMotionContext, 
    readiness: ReadinessSignal | null
  ): MotionProfile => {
    // TODO: Cruzar FactualContext da shell com os logs locais
    return {
      universe: null, // Será preenchido pelo UniverseEngine ou User
      structural: {
        age: activeContext.factualContext?.age,
        gender: activeContext.factualContext?.gender,
        limitations: activeContext.factualContext?.limitations || []
      },
      dynamic: {
        readinessScore: readiness?.score ?? 1.0,
        adherenceLevel: 'Moderate' // Default seguro
      }
    };
  }
};
