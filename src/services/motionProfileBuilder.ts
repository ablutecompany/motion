import { AdaptedShellContext } from '../integration/shellContextAdapter';
import { MotionProfile, Universe } from '../contracts/types';

export const buildMotionProfile = (context: AdaptedShellContext): MotionProfile => {
  // In a full domain engine, this interprets the factualContext deeply.
  // For integration resilience, we default safely when data is omitted.
  const baseUniverse: Universe | null = context.isDemo ? 'Balance' : null;

  return {
    universe: baseUniverse,
    structural: { limitations: [] },
    dynamic: { readinessScore: 1, adherenceLevel: 'normal' },
    operational: {
      currentGoal: { value: 'manutenção', source: 'shell', lastUpdatedAt: new Date().toISOString() },
      weeklyAvailability: { value: 3, source: 'shell', lastUpdatedAt: new Date().toISOString() },
      trainingEnvironment: { value: 'casa', source: 'shell', lastUpdatedAt: new Date().toISOString() },
      equipmentAvailable: { value: ['nenhum'], source: 'shell', lastUpdatedAt: new Date().toISOString() }
    }
  };
};
