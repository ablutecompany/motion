import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { useMotionSyncFacade } from '../../facades/useMotionSyncFacade';
import { useMotionTimelineFacade } from '../../facades/useMotionTimelineFacade';
import { useMotionHostFeedbackFacade } from '../../facades/useMotionHostFeedbackFacade';
import { generateMotionTimeline } from '../../presenters/timelinePresenter';
import { MotionSectionHeader, MotionSectionCard, MotionStatusPill } from '../components/MotionUI';
import { MotionTimelineFilters, MotionTimelineAnalyticsSummary } from '../components/MotionTimelineAnalyticsViews';

export const MotionProgressScreen: React.FC = () => {
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  const facade = useMotionExecutionFacade();
  const syncFacade = useMotionSyncFacade();
  const timelineFacade = useMotionTimelineFacade();
  const feedbackFacade = useMotionHostFeedbackFacade();
  
  const plan = useMotionStore(selectors.selectPlan);
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const universe = useMotionStore(selectors.selectUniverse);
  const workoutHistory = useMotionStore(selectors.selectWorkoutHistory);

  useEffect(() => {
    trackEvent(MotionEvents.PROGRESS_VIEWED);
    if (workoutHistory.length > 0) {
      trackEvent(MotionEvents.WORKOUT_REFLECTED);
    }
  }, [workoutHistory.length]);

  const totalPlanned = plan?.sessions?.length || 0;
  const totalCompleted = workoutHistory.length;
  
  const timelineGroups = generateMotionTimeline(timelineFacade.filteredRecords);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev: Record<string, boolean>) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) trackEvent('motion_timeline_item_expanded', { id });
      return next;
    });
  };

  const renderHistoryBadge = () => {
    if (!isHistory) return null;
    return (
      <View style={styles.historyBadge}>
        <Text style={styles.historyBadgeText}>Ecosistema fechado. Histórico validado.</Text>
      </View>
    );
  };

  if (totalCompleted === 0) {
    return (
      <View style={styles.emptyContainer}>
        {renderHistoryBadge()}
        <Text style={styles.emptyTitle}>Progresso Neutro</Text>
        <Text style={styles.emptyDesc}>Ainda não há instâncias processadas com dados elegíveis para reportar consolidação orgânica.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHistoryBadge()}

      <MotionSectionHeader 
        title="Auditoria de Progresso" 
        subtitle={`Eixo ${universe ?? 'Universal'}`} 
      />

      {totalCompleted > 0 && (
        <MotionTimelineFilters 
          filters={timelineFacade.filters}
          onSelectRange={timelineFacade.setRange}
          onToggleEnriched={timelineFacade.toggleEnriched}
          onToggleSource={timelineFacade.toggleSource}
          onToggleSync={timelineFacade.toggleSyncState}
        />
      )}

      {totalCompleted > 0 && (
        <MotionTimelineAnalyticsSummary 
          analytics={timelineFacade.analytics}
          isAllRange={timelineFacade.filters.range === 'all'}
          totalPlannedCycle={totalPlanned}
        />
      )}

      {timelineGroups.length === 0 && totalCompleted > 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sem Resultados</Text>
          <Text style={styles.emptyDesc}>Nenhum treino obedece aos filtros analíticos submetidos.</Text>
        </View>
      )}

      {timelineGroups.map((group) => (
        <View key={group.key} style={styles.timelineGroup}>
          <Text style={styles.listTitle}>{group.title}</Text>
          
          {group.items.map(({ record, displayTime, sourceLabel, primarySummary, secondarySummary, hasWellnessImpact, hasWellnessFeedback, isEnriched }) => {
            const syncDisplay = syncFacade.getSyncDisplayState(record.id, record.syncStatus);
            const feedbackDisplay = feedbackFacade.getFeedbackSummary(record.id);
            const adjustments = feedbackFacade.getOperationalAdjustments(record.id);
            
            const isExpanded = !!expandedItems[record.id];
            
            return (
              <MotionSectionCard key={record.id} style={{ marginBottom: 12 }}>
                <View style={styles.historyCardHeader}>
                  <MotionStatusPill label={sourceLabel} tone={record.source === 'session' ? 'primary' : 'passive'} />
                  <MotionStatusPill label={syncDisplay.label} tone={record.syncStatus === 'synced' ? 'success' : record.syncStatus === 'failed' ? 'error' : record.syncStatus === 'local_only' ? 'warning' : 'neutral'} />
                </View>

                <View style={styles.historyRef}>
                  <View>
                    <Text style={styles.historyValPrimary}>{primarySummary}</Text>
                    {secondarySummary && <Text style={styles.historyValSecondary}>{secondarySummary}</Text>}
                  </View>
                  <Text style={styles.historyDateText}>{displayTime}</Text>
                </View>

                <TouchableOpacity onPress={() => toggleExpand(record.id)} style={styles.expandTrigger}>
                  <Text style={styles.expandTriggerText}>{isExpanded ? 'Esconder Contexto' : 'Aprofundar Detalhe'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {syncFacade.canRetrySync(record.id) && (
                      <TouchableOpacity 
                        onPress={() => syncFacade.retrySync(record.id)} 
                        style={styles.retryBtn}
                      >
                        <Text style={styles.retryBtnText}>Tentar Novamente (Sync)</Text>
                      </TouchableOpacity>
                    )}
                    {hasWellnessImpact && record.wellnessImpact && (
                      <View style={[styles.wellnessImpactBox, isEnriched && styles.wellnessImpactBoxEnriched]}>
                        <Text style={[styles.wellnessTitle, isEnriched && styles.wellnessTitleEnriched]}>
                          {isEnriched ? 'Sinal Forte para o Perfil Wellness' : 'Sinal Base para Wellness'}
                        </Text>
                        <View style={styles.wellnessTraits}>
                          {record.wellnessImpact.interestingOutcome && (
                            <Text style={styles.wellnessTraitText}>• {record.wellnessImpact.interestingOutcome}</Text>
                          )}
                          {record.wellnessImpact.usefulOutcome && (
                            <Text style={styles.wellnessTraitText}>• {record.wellnessImpact.usefulOutcome}</Text>
                          )}
                          {record.wellnessImpact.displayState === 'local_only' && (
                            <Text style={styles.wellnessTraitLocal}>• Retido no Demo (Não visível externamente)</Text>
                          )}
                        </View>
                      </View>
                    )}

                    {hasWellnessFeedback && record.wellnessFeedback && (
                      <View style={[styles.wellnessImpactBox, styles.wellnessFeedbackBox]}>
                        <Text style={styles.wellnessTitleRet}>
                          {feedbackDisplay.label}
                        </Text>
                        <View style={styles.wellnessTraits}>
                          {record.wellnessFeedback.consistencySignal && (
                            <Text style={styles.wellnessTraitRet}>• {record.wellnessFeedback.consistencySignal}</Text>
                          )}
                          {record.wellnessFeedback.recoverySignal && (
                            <Text style={styles.wellnessTraitRet}>• {record.wellnessFeedback.recoverySignal}</Text>
                          )}
                          {record.hostFeedback?.actionableFlags && record.hostFeedback.actionableFlags.map(flag => (
                            <Text key={flag} style={styles.wellnessTraitRet}>• Host Flag Ref: {flag}</Text>
                          ))}
                        </View>
                      </View>
                    )}

                    {adjustments.length > 0 && (
                      <View style={[styles.wellnessImpactBox, { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }]}>
                        <Text style={[styles.wellnessTitleRet, { color: '#d97706' }]}>Meta Operacional Dinâmica</Text>
                        {adjustments.map(adj => (
                           <View key={adj.adjustmentId} style={styles.wellnessTraits}>
                             <Text style={[styles.wellnessTraitRet, { color: '#b45309', fontWeight: 'bold' }]}>Meta ajustada: {adj.reasonSummary}</Text>
                             <Text style={[styles.wellnessTraitRet, { color: '#b45309' }]}>Ajuste aplicado: {adj.nextValue}</Text>
                           </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.historyDataGrid}>
                      <View style={styles.histDataCol}>
                        <Text style={styles.histDataLabel}>Estado Base</Text>
                        <Text style={styles.histDataValue}>Confirmado</Text>
                      </View>
                      <View style={styles.histDataCol}>
                        <Text style={styles.histDataLabel}>Referência ID</Text>
                        <Text style={styles.historyRefText}>REF: {record.id.slice(-8)}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </MotionSectionCard>
            );
          })}
        </View>
      ))}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  
  historyBadge: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 20 },
  historyBadgeText: { color: '#1d4ed8', fontSize: 13, fontWeight: '600' },
  
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', fontWeight: '500' },

  listTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  
  historyCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 12 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyBadgeSrc: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  historyBadgeSrcText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncLabelText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  
  historyRef: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  historyRefText: { fontSize: 13, fontFamily: 'monospace', color: '#6b7280' },
  historyDateText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  historyValPrimary: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  historyValSecondary: { fontSize: 13, color: '#4b5563' },
  
  expandTrigger: { marginTop: 4, paddingVertical: 8, alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8 },
  expandTriggerText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#f3f4f6' },
  retryBtn: { marginBottom: 16, padding: 10, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  retryBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '600' },

  historyDataGrid: { flexDirection: 'row', gap: 24 },
  histDataCol: { flex: 1 },
  histDataLabel: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  histDataValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  wellnessImpactBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderColor: '#d1d5db' },
  wellnessImpactBoxEnriched: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  wellnessTitle: { fontSize: 12, fontWeight: '700', color: '#4b5563', marginBottom: 6 },
  wellnessTitleEnriched: { color: '#047857' },
  wellnessTraits: { flexDirection: 'column', gap: 4 },
  wellnessTraitText: { fontSize: 12, color: '#374151', fontStyle: 'italic' },
  wellnessTraitLocal: { fontSize: 12, color: '#d97706', fontStyle: 'italic' },
  
  wellnessFeedbackBox: { backgroundColor: '#f5f3ff', borderColor: '#8b5cf6' },
  wellnessTitleRet: { fontSize: 12, fontWeight: '700', color: '#6d28d9', marginBottom: 6 },
  wellnessTraitRet: { fontSize: 12, color: '#4c1d95', fontStyle: 'italic' }
});
