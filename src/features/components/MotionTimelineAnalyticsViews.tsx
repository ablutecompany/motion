import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { MotionTimelineFilterState, MotionTimelineRange, MotionTimelineAnalytics, ConfirmedWorkoutRecord } from '../../contracts/types';

interface FiltersProps {
  filters: MotionTimelineFilterState;
  onSelectRange: (r: MotionTimelineRange) => void;
  onToggleEnriched: () => void;
  onToggleSource: (s: ConfirmedWorkoutRecord['source']) => void;
  onToggleSync: (s: ConfirmedWorkoutRecord['syncStatus']) => void;
}

export const MotionTimelineFilters = ({
  filters,
  onSelectRange,
  onToggleEnriched,
  onToggleSource,
  onToggleSync
}: FiltersProps) => {
  const theme = useMotionTheme();

  const isSelected = (val: boolean) => val ? [styles.chipSelected, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.primary }] : {};
  const isSelectedText = (val: boolean) => val ? [styles.chipTextSelected, { color: theme.colors.primary }] : {};

  return (
    <View style={styles.filterWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <View style={styles.groupLine}>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.range === '7d')]} onPress={() => onSelectRange('7d')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.range === '7d')]}>7 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.range === '30d')]} onPress={() => onSelectRange('30d')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.range === '30d')]}>30 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.range === '90d')]} onPress={() => onSelectRange('90d')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.range === '90d')]}>90 Dias</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.range === 'all')]} onPress={() => onSelectRange('all')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.range === 'all')]}>Tudo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.groupLine}>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.sourceType === 'session')]} onPress={() => onToggleSource('session')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.sourceType === 'session')]}>Ativos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.sourceType === 'passive_inference')]} onPress={() => onToggleSource('passive_inference')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.sourceType === 'passive_inference')]}>Inferidos</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.groupLine}>
           <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.syncState === 'failed')]} onPress={() => onToggleSync('failed')}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.syncState === 'failed')]}>Falhas Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, { borderColor: theme.colors.border }, isSelected(filters.onlyEnriched)]} onPress={onToggleEnriched}>
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }, isSelectedText(filters.onlyEnriched)]}>Apenas Enriquecidos</Text>
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

export const MotionTimelineAnalyticsSummary = ({ analytics, isAllRange, totalPlannedCycle }: AnalyticsCardProps) => {
  const theme = useMotionTheme();

  return (
    <View style={[styles.analyticsCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
      <View style={styles.primaryGrid}>
        <View style={[styles.kpiBox, { backgroundColor: theme.colors.primaryBg }]}>
          <Text style={[styles.kpiVal, { color: theme.colors.textMain }]}>{analytics.totalWorkouts}</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Sessões</Text>
        </View>
        <View style={[styles.kpiBox, { backgroundColor: theme.colors.primaryBg }]}>
          <Text style={[styles.kpiVal, { color: theme.colors.textMain }]}>{analytics.weeklyFrequency}x</Text>
          <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>por semana</Text>
        </View>
        
        {isAllRange && totalPlannedCycle && totalPlannedCycle > 0 && (
          <View style={[styles.kpiBox, styles.kpiBoxDim]}>
            <Text style={[styles.kpiVal, { color: theme.colors.textMain }]}>{totalPlannedCycle}</Text>
            <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>Ciclo Total</Text>
          </View>
        )}
      </View>

      {analytics.totalWorkouts > 0 && (
        <View style={styles.compactBreakdownRow}>
          <View style={styles.bkCol}>
             <Text style={[styles.bkTitle, { color: theme.colors.textMain }]}>Origem</Text>
             <Text style={[styles.bkVal, { color: theme.colors.textMain }]}>{analytics.confirmedCount} <Text style={[styles.bkMuted, { color: theme.colors.textSecondary }]}>Ativos</Text></Text>
             <Text style={[styles.bkVal, { color: theme.colors.textMain }]}>{analytics.inferredCount} <Text style={[styles.bkMuted, { color: theme.colors.textSecondary }]}>Inferidos</Text></Text>
          </View>
          <View style={styles.bkCol}>
             <Text style={[styles.bkTitle, { color: theme.colors.textMain }]}>Qualidade</Text>
             <Text style={[styles.bkVal, { color: theme.colors.textMain }]}>{analytics.enrichedCount} <Text style={[styles.bkMuted, { color: theme.colors.textSecondary }]}>Enriquecidos</Text></Text>
             <Text style={[styles.bkVal, { color: theme.colors.textMain }]}>{analytics.totalWorkouts - analytics.enrichedCount} <Text style={[styles.bkMuted, { color: theme.colors.textSecondary }]}>Básicos</Text></Text>
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
    backgroundColor: '#e5e7eb'
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  chipSelected: { },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280'
  },
  chipTextSelected: { },

  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 12
  },
  kpiBoxDim: {
    backgroundColor: '#f3f4f6'
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
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
    color: '#111827',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  bkVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  bkMuted: {
    color: '#6b7280',
    fontWeight: '500'
  }
});
