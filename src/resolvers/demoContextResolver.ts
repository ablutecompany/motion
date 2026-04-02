import { DemoState, Universe } from '../contracts/types';

export const demoContextResolver = {
  intercept: (isDemo: boolean): DemoState => {
    if (!isDemo) {
      return { isActive: false, sandboxProfile: null as any };
    }

    // Retorna um snapshot fechado e ideal em modo Sandbox
    return {
      isActive: true,
      sandboxProfile: {
        universe: 'Performance Boost' as Universe,
        structural: { limitations: [] },
        dynamic: { readinessScore: 1.0, adherenceLevel: 'High' }
      }
    };
  }
};
