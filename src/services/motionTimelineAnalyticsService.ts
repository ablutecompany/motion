import { ConfirmedWorkoutRecord, MotionTimelineAnalytics, MotionTimelineFilterState, MotionTimelineRange } from '../contracts/types';

export const motionTimelineAnalyticsService = {
  
  /**
   * getDaysFromRange
   */
  getDaysFromRange: (range: MotionTimelineRange): number | null => {
    if (range === '7d') return 7;
    if (range === '30d') return 30;
    if (range === '90d') return 90;
    return null;
  },

  /**
   * Aplica localmente os filtros limitadores selecionados na View.
   */
  filterHistory: (
    history: ConfirmedWorkoutRecord[],
    filters: MotionTimelineFilterState
  ): ConfirmedWorkoutRecord[] => {
    const days = motionTimelineAnalyticsService.getDaysFromRange(filters.range);
    const cutoffTime = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime() : 0;

    return history.filter(record => {
      // 1. Time filter
      const recordTime = new Date(record.confirmedAt).getTime();
      if (cutoffTime && recordTime < cutoffTime) return false;

      // 2. Type filter
      if (filters.workoutType && record.workoutType !== filters.workoutType) return false;

      // 3. Source filter
      if (filters.sourceType && record.source !== filters.sourceType) return false;

      // 4. Sync filter
      if (filters.syncState && record.syncStatus !== filters.syncState) return false;

      // 5. Enriched filter
      if (filters.onlyEnriched && record.enrichmentStatus !== 'enriched' && record.enrichmentStatus !== 'partial') return false;

      return true;
    });
  },

  /**
   * Computa o Micro-Analytics de uma amostragem de treinos (já filtrada).
   */
  computeAnalytics: (
    filteredRecords: ConfirmedWorkoutRecord[],
    range: MotionTimelineRange
  ): MotionTimelineAnalytics => {
    let confirmedCount = 0;
    let inferredCount = 0;
    let enrichedCount = 0;
    
    const sourceBreakdown: Record<string, number> = {};
    const syncBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    let lastWorkoutAt: string | undefined;

    filteredRecords.forEach((record, index) => {
      // Breakdown Counts
      if (record.source === 'session') confirmedCount++;
      if (record.source === 'passive_inference') inferredCount++;
      if (record.enrichmentStatus === 'enriched' || record.enrichmentStatus === 'partial') enrichedCount++;

      // Latest Workout Record (Assumes history is usually sorted latest first, but we do robust check)
      if (!lastWorkoutAt || new Date(record.confirmedAt).getTime() > new Date(lastWorkoutAt).getTime()) {
        lastWorkoutAt = record.confirmedAt;
      }

      // Groupings
      sourceBreakdown[record.source] = (sourceBreakdown[record.source] || 0) + 1;
      syncBreakdown[record.syncStatus] = (syncBreakdown[record.syncStatus] || 0) + 1;
      
      const wType = record.workoutType || 'unspecified';
      typeBreakdown[wType] = (typeBreakdown[wType] || 0) + 1;
    });

    const totalWorkouts = filteredRecords.length;

    // Frequência semanal aproxima-se com rigor consoante o Range
    let weeklyFrequency = 0;
    const days = motionTimelineAnalyticsService.getDaysFromRange(range);
    
    if (days && totalWorkouts > 0) {
      // Num limitador temporal, dividimos os treinos pelas semanas da janela (ex: treinos / 4 para 30d)
      weeklyFrequency = Number((totalWorkouts / (days / 7)).toFixed(1));
    } else if (range === 'all' && totalWorkouts > 0) {
      // Se All e houver dados, medimos a distância da primeirísma e a última para dar a vel.
      const first = new Date(filteredRecords[filteredRecords.length - 1].confirmedAt).getTime();
      const last = new Date(lastWorkoutAt || Date.now()).getTime();
      const weeksElapsed = Math.max(1, (last - first) / (7 * 24 * 60 * 60 * 1000));
      weeklyFrequency = Number((totalWorkouts / weeksElapsed).toFixed(1));
    }

    return {
      totalWorkouts,
      confirmedCount,
      inferredCount,
      enrichedCount,
      weeklyFrequency,
      lastWorkoutAt,
      sourceBreakdown,
      syncBreakdown,
      typeBreakdown
    };
  }
};
