import { MotionProfile, WeeklyPlan, Session, CurrentPhase } from '../contracts/types';
import { AdaptedHostContext } from '../integration/motionHostContextAdapter';

export const derivePlanFromContext = (profile: MotionProfile, context: AdaptedHostContext): WeeklyPlan => {
  const days = profile.operational.weeklyAvailability.value || 3;
  const analysisSlug = context.activeContext.analysisId?.substring(0, 5) || 'SYS';
  
  const sessions: Session[] = Array.from({ length: days }, (_, i) => ({
    id: `REF-${analysisSlug}-${i + 1}`,
    durationMinutes: 30,
    intensityMultiplier: 1.0,
    completed: false
  }));

  const phase: CurrentPhase = 'Manutenção';

  return {
    cycleId: `CYCLE-${Date.now()}`,
    startDate: new Date().toISOString(),
    targetPhase: phase,
    sessions
  };
};
