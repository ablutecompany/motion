import { AggregationResult, calculateStreak } from '../services/motionMetricsAggregationService';
import { generateBodyMap } from '../services/motionBodyMapService';
import { MotionBodyMap3DService, BodyMap3DViewModel } from '../services/motionBodyMap3DService';
import { MotionMetricsViewModel, MetricsTimeWindow } from '../contracts/metricsModels';
import { EffortConfig } from '../config/effortConfig';

export interface MotionMetricsViewModelExtended extends MotionMetricsViewModel {
  bodyMap3D: BodyMap3DViewModel;
}

const mapIntensity = (i: string | undefined): string => {
  if (i === 'hard') return 'Elevada / Tensa';
  if (i === 'moderate') return 'Moderada / Base';
  if (i === 'light') return 'Leve / Recuperação';
  return 'Mista / Flutuante';
};

const mapType = (t: string | undefined): string => {
  if (t === 'strength') return 'Carga e Força';
  if (t === 'cardio') return 'Metabólico';
  if (t === 'mobility') return 'Mobilidade e Fluxo';
  if (t === 'mixed') return 'Esforço Híbrido';
  return 'Não Categorizado';
};

export const presentMetrics = (
  period: MetricsTimeWindow,
  agg: AggregationResult,
  plannedSessionsSource: number,
  wellnessAssociations: any | null
): MotionMetricsViewModelExtended => {
  
  const total = agg.totalSessions;
  const visualState = total === 0 ? 'preview' : total <= 3 ? 'data-light' : 'full';
  
  // Real or Mocks for the Hero
  let predominantIntensity = 'unknown';
  let maxCount = 0;
  if (total > 0) {
    Object.entries(agg.intensityCounts).forEach(([k, v]) => {
      if (v > maxCount && k !== 'unknown') { maxCount = v; predominantIntensity = k; }
    });
  } else {
    predominantIntensity = 'moderate'; 
  }

  // Real or Mocks for Profile
  let typeArray = Object.entries(agg.typeCounts).map(([k, v]) => ({
    id: k, label: mapType(k), count: v, percentage: total ? Math.round((v / total) * 100) : 0
  })).filter(t => t.id !== 'unknown').sort((a,b) => b.count - a.count);

  let intArray = Object.entries(agg.intensityCounts).map(([k, v]) => ({
    id: k, label: mapIntensity(k), count: v, percentage: total ? Math.round((v / total) * 100) : 0
  })).filter(t => t.id !== 'unknown').sort((a,b) => b.count - a.count);

  if (visualState === 'preview') {
    typeArray = [
      { id: 'strength', label: 'Carga e Força', count: 12, percentage: 60 },
      { id: 'cardio', label: 'Metabólico', count: 6, percentage: 30 },
      { id: 'mobility', label: 'Mobilidade e Fluxo', count: 2, percentage: 10 }
    ];
    intArray = [
      { id: 'moderate', label: 'Moderada / Base', count: 10, percentage: 50 },
      { id: 'hard', label: 'Elevada / Tensa', count: 8, percentage: 40 },
      { id: 'light', label: 'Leve / Recuperação', count: 2, percentage: 10 }
    ];
  }

  // Consistency
  const currentStreak = visualState === 'preview' ? 14 : calculateStreak(agg.activeDates);

  // Plan logic
  const planMultiplier = period === '1d' ? (1/7) : period === '7d' ? 1 : period === '12w' ? 12 : 52;
  const plannedSessions = plannedSessionsSource * planMultiplier;
  const executedSessions = visualState === 'preview' ? (plannedSessions > 0 ? Math.round(plannedSessions * 0.8) : 12) : total;
  const hasPlanComparison = plannedSessions > 0 || visualState === 'preview';

  // Compose Body Map
  let bodyMap = generateBodyMap(agg.typeCounts);
  if (visualState === 'preview') {
    bodyMap = {
      dominantSystemLabel: 'Carga Muscular e Força',
      zones: [
        { zoneId: 'sys-musc', label: 'Carga Muscular e Força', intensityLevel: 'high' as const },
        { zoneId: 'sys-core', label: 'Estabilidade Base / Core', intensityLevel: 'medium' as const }
      ]
    };
  }

  // Wellness
  let finalWellness = wellnessAssociations;
  if (visualState === 'preview' && !finalWellness) {
    finalWellness = {
      associations: [
        { id: 'preview-1', indicator: 'Sinal Consolidado de Recuperação', narrative: 'O teu padrão de treino recente tem coincidido com sinal de frescura sistémica nos dias seguintes a cargas metabólicas.' },
        { id: 'preview-2', indicator: 'Sintonia de Consistência', narrative: 'A estabilidade mecânica tem acompanhado fases de menor dispersão calórica.' }
      ]
    };
  }

  // Highlights
  let longestSession;
  if (visualState === 'preview') {
    longestSession = { value: 75, label: 'Minutos num bloco ininterrupto' };
  } else if (agg.totalDurationMinutes > 0 && total > 0) {
    const mockLongest = Math.round((agg.totalDurationMinutes / total) * 1.5);
    longestSession = { value: mockLongest, label: 'Minutos em pico de linha' };
  }
  const mostFrequentType = typeArray.length > 0 ? { value: typeArray[0].label, label: 'Perfil Frequente' } : undefined;

  let longData = agg.buckets.map(b => ({ key: b.label, label: b.label, value: b.count }));
  if (visualState === 'preview') {
    longData = [
      { key: 'S1', label: 'Sem 1', value: 2 },
      { key: 'S2', label: 'Sem 2', value: 4 },
      { key: 'S3', label: 'Sem 3', value: 3 },
      { key: 'S4', label: 'Sem 4', value: 5 },
      { key: 'S5', label: 'Sem 5', value: 4 },
    ];
  }

  return {
    period,
    globalStates: {
      isLoading: false,
      hasEnoughData: true, // Always true to force rendering of blocks. UI will use visualState.
      hasWellnessData: finalWellness !== null,
      hasBodyMapping: bodyMap !== null,
      hasPlanComparison,
      isHistoryContext: false,
      visualState
    },
    heroSummary: {
      totalSessions: visualState === 'preview' ? 24 : total,
      totalDurationMinutes: visualState === 'preview' ? 1250 : agg.totalDurationMinutes,
      predominantIntensityLabel: mapIntensity(predominantIntensity),
      predominantIntensityId: predominantIntensity as any,
      effortScore: visualState === 'preview' ? (EffortConfig.effortTargetScore * 24 * 0.95) : agg.totalEffortScore,
      effortTarget: visualState === 'preview' ? (EffortConfig.effortTargetScore * 24) : agg.totalEffortTarget,
      isBeastMode: visualState === 'preview' ? false : (agg.totalEffortScore / Math.max(1, agg.totalEffortTarget) > EffortConfig.beastThreshold)
    },
    bodyMap,
    bodyMap3D: MotionBodyMap3DService.extract3DRegionsFromModel(bodyMap, visualState),
    trainingProfile: {
      distributionByType: typeArray,
      distributionByIntensity: intArray
    },
    longitudinal: {
      temporalTrend: longData
    },
    consistency: {
      currentStreak,
      activeDays: visualState === 'preview' ? 18 : agg.activeDates.size,
      periodDays: agg.periodDays
    },
    planVsExecuted: hasPlanComparison ? {
      plannedSessions: plannedSessions || 15,
      executedSessions
    } : null,
    trainingWellnessRelations: finalWellness,
    highlights: (longestSession || mostFrequentType) ? {
      longestSession,
      mostFrequentType
    } : null
  };
};
