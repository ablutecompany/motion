export type MetricsTimeWindow = '1d' | '7d' | '12w' | 'all';

export interface MotionMetricsGlobalStates {
  isLoading: boolean;
  hasEnoughData: boolean;
  hasWellnessData: boolean;
  hasBodyMapping: boolean;
  hasPlanComparison: boolean;
  isHistoryContext: boolean;
  visualState: 'preview' | 'data-light' | 'full';
}

export interface HeroSummaryModel {
  totalSessions: number;
  totalDurationMinutes: number;
  predominantIntensityLabel: string;
  predominantIntensityId: 'low' | 'medium' | 'high' | 'unknown';
  effortScore: number;
  effortTarget: number;
  isBeastMode: boolean;
}

export interface BodyMapZoneModel {
  zoneId: string;
  label: string;
  intensityLevel: 'low' | 'medium' | 'high';
}

export interface BodyMapModel {
  zones: BodyMapZoneModel[];
  dominantSystemLabel: string;
}

export interface TrainingDistributionItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TrainingProfileModel {
  distributionByType: TrainingDistributionItem[];
  distributionByIntensity: TrainingDistributionItem[];
}

export interface TemporalTrendItem {
  key: string;
  label: string;
  value: number;
}

export interface LongitudinalModel {
  temporalTrend: TemporalTrendItem[];
}

export interface ConsistencyModel {
  currentStreak: number;
  activeDays: number;
  periodDays: number;
}

export interface PlanComparisonModel {
  plannedSessions: number;
  executedSessions: number;
}

export interface WellnessRelationItem {
  id: string;
  indicator: string;
  narrative: string;
}

export interface WellnessRelationModel {
  associations: WellnessRelationItem[];
}

export interface HighlightsModel {
  longestSession?: { value: number; label: string };
  mostFrequentType?: { value: string; label: string };
}

export interface MotionMetricsViewModel {
  period: MetricsTimeWindow;
  globalStates: MotionMetricsGlobalStates;
  heroSummary: HeroSummaryModel | null;
  bodyMap: BodyMapModel | null;
  trainingProfile: TrainingProfileModel | null;
  longitudinal: LongitudinalModel | null;
  consistency: ConsistencyModel | null;
  planVsExecuted: PlanComparisonModel | null;
  trainingWellnessRelations: WellnessRelationModel | null;
  highlights: HighlightsModel | null;
}
