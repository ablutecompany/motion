/**
 * Ponto de entrada Skeleton da mini-app _motion.
 * Este ficheiro demonstra a orquestração pipeline base.
 */
import { shellContextAdapter } from './integration/shellContextAdapter';
import { demoContextResolver } from './resolvers/demoContextResolver';
import { activeAnalysisResolver } from './resolvers/activeAnalysisResolver';
import { motionProfileBuilder } from './domain/motionProfileBuilder';
import { universeEngine } from './engines/universeEngine';
import { phaseEngine } from './engines/phaseEngine';
import { planEngine } from './engines/planEngine';
import { writebackService } from './services/writebackService';

// Pseudo-UI para exemplificar o pipeline de boot limpo sem framework
export const BootMotionApp = (rawShellContext: any) => {
  console.log('1. [Event] shell_context_received');
  const snapshot = shellContextAdapter.normalizePayload(rawShellContext);

  console.log('2. [Event] demo_context_applied?');
  const demoState = demoContextResolver.intercept(snapshot.isDemo);
  if (demoState.isActive) {
     // Configura Store para modo sandbox isolado
  }

  console.log('3. [Event] active_analysis_resolved');
  const activeContext = shellContextAdapter.extractActiveContext(snapshot);
  const analysisRisk = activeAnalysisResolver.resolve(activeContext);

  if (!activeContext) {
    throw new Error("Contexto ativo falhou - Abortando arrranque");
  }

  console.log('4. [Event] motion_profile_built');
  // Passamos readiness null assumindo 1a run sem inputs
  const profile = motionProfileBuilder.build(activeContext, null);

  console.log('5. [Event] universe_resolved');
  const universe = universeEngine.suggestUniverse(profile);

  console.log('6. [Event] phase_resolved');
  // Usamos dummy adherence para arranque
  const phase = phaseEngine.determinePhase(profile, { score: 1, date: '', fatigueReported: false }, { consecutiveMisses: 0, lastSessionDate: '' });

  console.log('7. [Event] plan_generated');
  const weeklyPlan = planEngine.generateWeek(universe, phase, profile);

  // TODO: Gravar resultados na Store Global

  return {
    ready: true,
    viewState: {
      universe,
      phase,
      weeklyPlan
    }
  };
};

export default BootMotionApp;
