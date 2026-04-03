import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MotionColors } from './MotionUI';
import { MotionTimelineFilterState, MotionTimelineRange, MotionTimelineAnalytics, ConfirmedWorkoutRecord } from '../../contracts/types';

interface FiltersProps {
  filters: MotionTimelineFilterState;
  onSelectRange: (r: MotionTimelineRange) => void;
  onToggleEnriched: () => void;
  onToggleSource: (s: ConfirmedWorkoutRecord['source']) => void;
  onToggleSync: (s: ConfirmedWorkoutRecord['syncStatus']) => void;
}

export const MotionTimelineFilters: React.FC<FiltersProps> = ({
  filters,
  onSelectRange,
  onToggleEnriched,
  onToggleSource,
  onToggleSync
}) => {
  const isSelected = (val: boolean) => val ? styles.chipSelected : {};
  const isSelectedText = (val: boolean) => val ? styles.chipTextSelected : {};

  return (
    <View style={styles.filterWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <View style={styles.groupLine}>
          <TouchableOpacity style={[styles.chip, isSelected(filters.range === '7d')]} onPress={() => onSelectRange('7d')}>
            <Text style={[styles.chipText, isSelectedText(filters.range === '7d')]}>7 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isSelected(filters.range === '30d')]} onPress={() => onSelectRange('30d')}>
            <Text style={[styles.chipText, isSelectedText(filters.range === '30d')]}>30 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isSelected(filters.range === '90d')]} onPress={() => onSelectRange('90d')}>
            <Text style={[styles.chipText, isSelectedText(filters.range === '90d')]}>90 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isSelected(filters.range === 'all')]} onPress={() => onSelectRange('all')}>
            <Text style={[styles.chipText, isSelectedText(filters.range === 'all')]}>Tudo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.groupLine}>
          <TouchableOpacity style={[styles.chip, isSelected(filters.sourceType === 'session')]} onPress={() => onToggleSource('session')}>
            <Text style={[styles.chipText, isSelectedText(filters.sourceType === 'session')]}>Ativos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isSelected(filters.sourceType === 'passive_inference')]} onPress={() => onToggleSource('passive_inference')}>
            <Text style={[styles.chipText, isSelectedText(filters.sourceType === 'passive_inference')]}>Inferidos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.groupLine}>
           <TouchableOpacity style={[styles.chip, isSelected(filters.syncState === 'failed')]} onPress={() => onToggleSync('failed')}>
            <Text style={[styles.chipText, isSelectedText(filters.syncState === 'failed')]}>Falhas Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isSelected(filters.onlyEnriched)]} onPress={onToggleEnriched}>
            <Text style={[styles.chipText, isSelectedText(filters.onlyEnriched)]}>Apenas Enriquecidos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

interface AnalyticsCardProps {
  analytics: MotionTimelineAnalytics;
  isAllRange: boolean;
  totalPlannedCycle?: number;
}

export const MotionTimelineAnalyticsSummary: React.FC<AnalyticsCardProps> = ({ analytics, isAllRange, totalPlannedCycle }) => {
  return (
    <View style={styles.analyticsCard}>
      <View style={styles.primaryGrid}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiVal}>{analytics.totalWorkouts}</Text>
          <Text style={styles.kpiLabel}>Sessões</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiVal}>{analytics.weeklyFrequency}x</Text>
          <Text style={styles.kpiLabel}>por semana</Text>
        </View>
        
        {isAllRange && totalPlannedCycle && totalPlannedCycle > 0 && (
          <View style={[styles.kpiBox, styles.kpiBoxDim]}>
            <Text style={styles.kpiVal}>{totalPlannedCycle}</Text>
            <Text style={styles.kpiLabel}>Ciclo Total</Text>
          </View>
        )}
      </View>

      {analytics.totalWorkouts > 0 && (
        <View style={styles.compactBreakdownRow}>
          <View style={styles.bkCol}>
             <Text style={styles.bkTitle}>Origem</Text>
             <Text style={styles.bkVal}>{analytics.confirmedCount} <Text style={styles.bkMuted}>Ativos</Text></Text>
             <Text style={styles.bkVal}>{analytics.inferredCount} <Text style={styles.bkMuted}>Inferidos</Text></Text>
          </View>
          <View style={styles.bkCol}>
             <Text style={styles.bkTitle}>Qualidade</Text>
             <Text style={styles.bkVal}>{analytics.enrichedCount} <Text style={styles.bkMuted}>Enriquecidos</Text></Text>
             <Text style={styles.bkVal}>{analytics.totalWorkouts - analytics.enrichedCount} <Text style={styles.bkMuted}>Básicos</Text></Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterWrapper: {
    marginBottom: 20,
    marginTop: -8 // Tucks closely under existing top spacing
  },
  filterScroll: {
    paddingHorizontal: 0,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  groupLine: {
    flexDirection: 'row',
    gap: 8
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: MotionColors.border
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: MotionColors.border
  },
  chipSelected: {
    backgroundColor: MotionColors.primaryBg,
    borderColor: MotionColors.primary
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: MotionColors.textSecondary
  },
  chipTextSelected: {
    color: MotionColors.primary
  },

  analyticsCard: {
    backgroundColor: MotionColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MotionColors.border,
    padding: 16,
    marginBottom: 24
  },
  primaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: MotionColors.primaryBg,
    borderRadius: 12
  },
  kpiBoxDim: {
    backgroundColor: '#f3f4f6'
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '800',
    color: MotionColors.textMain,
    marginBottom: 2
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MotionColors.textSecondary,
    textTransform: 'uppercase'
  },
  compactBreakdownRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    paddingTop: 16
  },
  bkCol: {
    flex: 1
  },
  bkTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MotionColors.textMain,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  bkVal: {
    fontSize: 13,
    fontWeight: '600',
    color: MotionColors.textMain,
    marginBottom: 2
  },
  bkMuted: {
    color: MotionColors.textMuted,
    fontWeight: '500'
  }
});
