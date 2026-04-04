import { useMemo, useState } from 'react';
import { useMotionStore, selectors } from '../store/useMotionStore';
import { MetricsTimeWindow, MotionMetricsViewModel } from '../contracts/metricsModels';
import { extractWellnessRelations } from '../services/motionTrainingWellnessRelationService';
import { aggregateWorkoutHistory } from '../services/motionMetricsAggregationService';
import { presentMetrics, MotionMetricsViewModelExtended } from '../presenters/motionMetricsPresenter';

export const useMotionMetricsFacade = () => {
  const [period, setPeriod] = useState<MetricsTimeWindow>('30d');
  
  const history = useMotionStore(selectors.selectWorkoutHistory);
  const plan = useMotionStore(selectors.selectPlan);
  const isHistoryContext = useMotionStore(selectors.selectIsHistory);

  const viewModel: MotionMetricsViewModelExtended = useMemo(() => {
    // 1. Agregação em Serviço (Backend Local)
    const aggregation = aggregateWorkoutHistory(history, period);

    // 2. Tração de Relações Wellness Observacionais
    // Só consome o histórico retido na janela ou global? 
    // Optámos por consumir o histórico global/janela para cruzar com o volume percebido algures
    // Aqui podes filtrar o histórico apenas para este window, se quiseres ser estrito:
    const filteredHistoryForWellness = history.filter(r => new Date(r.confirmedAt) >= new Date(Date.now() - (aggregation.periodDays * 24 * 60 * 60 * 1000)));
    const wellnessRelations = extractWellnessRelations(filteredHistoryForWellness);

    // 3. Apresentador (Formatting Logic Away from React Component)
    const vm = presentMetrics(
      period, 
      aggregation, 
      plan?.sessions?.length || 0, 
      wellnessRelations
    );
    
    vm.globalStates.isHistoryContext = isHistoryContext;
    return vm;

  }, [history, plan, period, isHistoryContext]);

  return {
    viewModel,
    setPeriod
  };
};
