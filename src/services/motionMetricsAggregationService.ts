import { ConfirmedWorkoutRecord } from '../contracts/types';
import { MetricsTimeWindow } from '../contracts/metricsModels';
import { extractLegacySafeSessionTotals } from './motionMuscleAggregationService';

export interface AggregationResult {
  periodDays: number;
  totalSessions: number;
  totalDurationMinutes: number;
  intensityCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  activeDates: Set<string>;
  buckets: { label: string; count: number }[];
  totalEffortScore: number;
  totalEffortTarget: number;
  muscleTotals: Record<string, number>;
}

export const aggregateWorkoutHistory = (history: ConfirmedWorkoutRecord[], timeWindow: MetricsTimeWindow): AggregationResult => {
  const now = new Date();
  let cutoffDate = new Date();
  let periodDays = 30;

  if (timeWindow === '1d') { cutoffDate.setHours(0,0,0,0); periodDays = 1; }
  else if (timeWindow === '7d') { cutoffDate.setDate(now.getDate() - 7); periodDays = 7; }
  else if (timeWindow === '12w') { cutoffDate.setDate(now.getDate() - 84); periodDays = 84; }
  else { cutoffDate = new Date(0); periodDays = 365; }

  const filtered = history.filter(r => new Date(r.confirmedAt) >= cutoffDate);
  
  let totalDurationMinutes = 0;
  const intensityCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const activeDates = new Set<string>();

  const numBuckets = timeWindow === '1d' ? 1 : timeWindow === '7d' ? 7 : timeWindow === '12w' ? 12 : 10;
  const buckets = Array.from({ length: numBuckets }, (_, i) => ({
    label: timeWindow === '1d' ? `Hoje` : timeWindow === '7d' ? `D-${numBuckets - i}` : timeWindow === '12w' ? `Sem ${i+1}` : `Set ${i+1}`,
    count: 0
  }));
  const bucketDays = periodDays / numBuckets;
  let totalEffortScore = 0;
  const muscleTotals: Record<string, number> = {};

  filtered.forEach(r => {
    // Estimativa crua se falhar base: default de 30min ou 45min se tiver wellness impact
    const dur = r.evidenceSource ? (r.wellnessImpact ? 45 : 30) : 30; 
    totalDurationMinutes += dur;
    
    // Kinematic Tracking: Aggregate explicit scores, fallback to 0 if legacy
    if (r.totalExecutionScore) {
      totalEffortScore += r.totalExecutionScore;
    }

    const int = r.perceivedIntensity || 'unknown';
    intensityCounts[int] = (intensityCounts[int] || 0) + 1;
    
    const typ = r.workoutType || 'unknown';
    typeCounts[typ] = (typeCounts[typ] || 0) + 1;

    activeDates.add(new Date(r.confirmedAt).toISOString().split('T')[0]);

    // Trend bucketing
    const diffTime = now.getTime() - new Date(r.confirmedAt).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const bIndex = numBuckets - 1 - Math.floor(diffDays / bucketDays);
    if (bIndex >= 0 && bIndex < numBuckets) {
      buckets[bIndex].count += 1;
    }

    // Kinematic Tracking: Safely extract legacy or new frozen absolute distributions
    const extractedMuscles = extractLegacySafeSessionTotals(r);
    Object.entries(extractedMuscles).forEach(([group, score]) => {
      muscleTotals[group] = (muscleTotals[group] || 0) + score;
    });

  });

  return {
    periodDays,
    totalSessions: filtered.length,
    totalDurationMinutes,
    intensityCounts,
    typeCounts,
    activeDates,
    buckets,
    totalEffortScore,
    totalEffortTarget: filtered.length > 0 ? (filtered.length * 1500) : 1500, // Fallback estimate
    muscleTotals
  };
};

export const calculateStreak = (activeDates: Set<string>): number => {
  const sortedDates = Array.from(activeDates).sort();
  let currentStreak = 0;
  if (sortedDates.length > 0) {
    currentStreak = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const d1 = new Date(sortedDates[i]);
      const d2 = new Date(sortedDates[i-1]);
      const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
      if (diff === 1) currentStreak++;
      else break;
    }
  }
  return currentStreak;
};
