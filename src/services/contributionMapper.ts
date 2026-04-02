import { MotionContribution } from '../contracts/types';

export const contributionMapper = {
  mapAdherence: (sessionsCompleted: number, totalSessions: number): MotionContribution => {
    return {
      source: '_motion_app',
      type: 'adherence_update',
      payload: { completed: sessionsCompleted, total: totalSessions },
      timestamp: new Date().toISOString()
    };
  },
  
  mapReadiness: (score: number, fatigue: boolean): MotionContribution => {
    return {
      source: '_motion_app',
      type: 'readiness_update',
      payload: { score, fatigue },
      timestamp: new Date().toISOString()
    };
  }
};
