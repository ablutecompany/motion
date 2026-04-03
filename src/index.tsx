/**
 * Ponto de entrada Skeleton da mini-app _motion.
 * Este ficheiro demonstra a orquestração pipeline base.
 */
import { motionHostContextAdapter } from './integration/motionHostContextAdapter';
import { derivePlanFromContext } from './resolvers/activeAnalysisResolver';
import { demoContextResolver } from './resolvers/demoContextResolver';
import { motionProfileBuilder } from './domain/motionProfileBuilder';
import { universeEngine } from './engines/universeEngine';
import { phaseEngine } from './engines/phaseEngine';
import { planEngine } from './engines/planEngine';
import { storeActions } from './store/useMotionStore';
import { trackEvent, MotionEvents } from './analytics/events';

interface BootMotionAppResponse {
  ready: boolean;
  viewState?: {
    universe: string | null;
    phase: string;
    weeklyPlan: any;
  };
  fallbackMode?: boolean;
  reason?: string;
}

// Pseudo-UI para exemplificar o pipeline de boot limpo sem framework
export const BootMotionApp = (rawShellContext: any): BootMotionAppResponse => {
  try {
    const snapshot = motionHostContextAdapter.adapt(rawShellContext);

    const demoState = demoContextResolver.intercept(snapshot.isDemo);
    if (demoState.isActive) {
       // Configura Store para modo sandbox isolado
       storeActions.setBootData({ 
         integration: { isDemoActive: true, isHistoryModeActive: false, shellSyncStatus: 'idle' },
         motionProfile: demoState.sandboxProfile 
       });
    }

    const activeContext = snapshot.activeContext;

    if (!activeContext || !activeContext.analysisId) {
      throw new Error("Contexto ativo ausente ou mal formado.");
    }

    // Passamos readiness null assumindo 1a run sem inputs
    const profile = demoState.isActive && demoState.sandboxProfile 
      ? demoState.sandboxProfile 
      : motionProfileBuilder.build(activeContext, null);

    const universe = universeEngine.suggestUniverse(profile);

    // Usamos dummy adherence para arranque
    const phase = phaseEngine.determinePhase(profile, { score: 1, date: '', fatigueReported: false }, { consecutiveMisses: 0, lastSessionDate: '' });

    const weeklyPlan = universe 
      ? planEngine.generateWeek(universe, phase, profile)
      : null;

    // Gravar resultados na Store Global
    storeActions.setBootData({
      uiOperational: { isBooted: true, setupSyncState: 'synced' },
      universe,
      phase,
      plan: weeklyPlan,
      activeContext,
      motionProfile: profile,
      integration: { ...snapshot, isDemoActive: demoState.isActive, isHistoryModeActive: false, shellSyncStatus: 'idle' }
    });

    trackEvent(MotionEvents.BOOT_SUCCESS, { isDemo: demoState.isActive });

    return {
      ready: true,
      viewState: {
        universe,
        phase,
        weeklyPlan
      }
    };
  } catch (error: any) {
    // Isolamento defensivo nativo (Regra V3.6: Proteção contra erro de montagem/render)
    console.error('[Motion Entrypoint] Falha Crítica no Boot:', error.message);
    trackEvent(MotionEvents.BOOT_FALLBACK, { reason: error.message });
    
    return {
      ready: false,
      fallbackMode: true,
      reason: error.message || 'Falha de Empacotamento Interno'
    };
  }
};

export default BootMotionApp;
