import { useState, useMemo } from 'react';
import { useMotionStore, selectors } from '../store/useMotionStore';
import { 
  MotionTimelineFilterState, 
  MotionTimelineRange,
  ConfirmedWorkoutRecord
} from '../contracts/types';
import { motionTimelineAnalyticsService } from '../services/motionTimelineAnalyticsService';
import { trackEvent } from '../analytics/events';

export const useMotionTimelineFacade = () => {
  const rawHistory = useMotionStore(selectors.selectWorkoutHistory);

  const [filters, setFilters] = useState<MotionTimelineFilterState>({
    range: 'all',
    onlyEnriched: false
  });

  const setRange = (range: MotionTimelineRange) => {
    trackEvent('motion_timeline_filter_range', { range });
    setFilters(prev => ({ ...prev, range }));
  };

  const toggleEnriched = () => {
    setFilters(prev => {
      const nextVal = !prev.onlyEnriched;
      trackEvent('motion_timeline_filter_enriched', { on: nextVal });
      return { ...prev, onlyEnriched: nextVal };
    });
  };

  const toggleSource = (source?: ConfirmedWorkoutRecord['source']) => {
    setFilters(prev => {
      const isRemoving = prev.sourceType === source;
      trackEvent('motion_timeline_filter_source', { source: isRemoving ? 'all' : source });
      return { ...prev, sourceType: isRemoving ? undefined : source };
    });
  };

  const toggleSyncState = (syncState?: ConfirmedWorkoutRecord['syncStatus']) => {
    setFilters(prev => {
      const isRemoving = prev.syncState === syncState;
      trackEvent('motion_timeline_filter_sync', { syncState: isRemoving ? 'all' : syncState });
      return { ...prev, syncState: isRemoving ? undefined : syncState };
    });
  };

  // Computações Memorizadas
  const filteredRecords = useMemo(() => {
    return motionTimelineAnalyticsService.filterHistory(rawHistory, filters);
  }, [rawHistory, filters]);

  const analytics = useMemo(() => {
    return motionTimelineAnalyticsService.computeAnalytics(filteredRecords, filters.range);
  }, [filteredRecords, filters.range]);

  return {
    filters,
    setRange,
    toggleEnriched,
    toggleSource,
    toggleSyncState,
    filteredRecords,
    analytics
  };
};
