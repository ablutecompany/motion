import { useMotionStore, selectors } from '../../../store/useMotionStore';
import { useMotionExecutionFacade } from '../../../facades/useMotionExecutionFacade';
import { useMotionTheme } from '../../../theme/useMotionTheme';

export const useMotionHomeViewModel = () => {
  const universe = useMotionStore(selectors.selectUniverse);
  const phase = useMotionStore(selectors.selectPhase);
  const plan = useMotionStore(selectors.selectPlan);
  const profile = useMotionStore(selectors.selectMotionProfile);

  // Derivar métricas e lógicas para o "Balance" (Prontidão / Estabilidade)
  // Usamos as propriedades operacionais reais como aproximação a "Prontidão"
  const balanceMetrics = {
    readinessLabel: profile?.dynamic?.readinessScore && profile.dynamic.readinessScore > 0.6 ? 'Sustentado' : 'Em recuperação',
    supportCopy: 'O teu ritmo recente abriu espaço para uma sessão focada na estabilidade e qualidade do movimento.'
  };

  // Derivar métricas para o "Performance Boost" (Gráfico de Carga / Intensidade)
  // Utilizamos as sessões anteriores para montar o gráfico de evolução de carga
  const pastSessions = plan?.sessions?.filter(s => s.completed) || [];
  const currentIntensity = plan?.sessions?.find(s => !s.completed)?.intensityMultiplier || 1;
  const loadProgression = pastSessions.map(s => s.intensityMultiplier || 1);
  const loadTrendGraph = [...loadProgression.slice(-3), currentIntensity]; // Últimos 4
  const isPushing = loadTrendGraph.length > 1 && loadTrendGraph[loadTrendGraph.length - 1] > loadTrendGraph[0];

  const performanceMetrics = {
    loadEvolutionTrend: loadTrendGraph,
    supportCopy: isPushing 
      ? 'A tua execução está mais forte e consistente do que nos últimos blocos.' 
      : 'Estás a estabilizar o teu nível de carga tática e consistência.',
  };

  // Derivar métricas para o "Momentum" (Crescimento % / Continuidade)
  // Calculamos a evolução de tempo alocado no plano atual face a um baseline teórico
  const planDuration = plan?.metadata?.expectedDurationDays || 7;
  const sessionsCount = plan?.sessions?.length || 0;
  const momentumMetrics = {
    evolutionPercentage: Math.min(Math.round((sessionsCount / (planDuration > 0 ? planDuration : 1)) * 100), 100),
    supportCopy: `Já não estás só a começar. O teu percurso de ${sessionsCount} sessões está a ganhar tração sólida.`
  };

  return {
    universe,
    phase,
    profile,
    balanceMetrics,
    performanceMetrics,
    momentumMetrics
  };
}; 
