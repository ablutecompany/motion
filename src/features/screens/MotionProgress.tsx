import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';

export const MotionProgressScreen: React.FC = () => {
  const completedIds = useMotionStore(selectors.selectCompletedSessions);
  const plan = useMotionStore(selectors.selectPlan);
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const universe = useMotionStore(selectors.selectUniverse);

  useEffect(() => {
    trackEvent(MotionEvents.PROGRESS_VIEWED);
  }, []);

  const totalPlanned = plan?.sessions?.length || 0;
  const totalCompleted = completedIds.length;

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

      <View style={styles.header}>
        <Text style={styles.title}>Auditoria de Progresso</Text>
        <Text style={styles.subtitle}>Eixo {universe ?? 'Universal'}</Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{totalCompleted}</Text>
          <Text style={styles.kpiLabel}>Sessões Executadas</Text>
        </View>

        {totalPlanned > 0 && (
          <View style={[styles.kpiCard, styles.kpiCardDim]}>
            <Text style={styles.kpiValue}>{totalPlanned}</Text>
            <Text style={styles.kpiLabel}>Teto Planeado (Ciclo)</Text>
          </View>
        )}
      </View>

      <Text style={styles.listTitle}>Registo Corrente (IDs Validados)</Text>
      
      {completedIds.map((id, index) => (
        <View key={id} style={styles.recordRow}>
          <View style={styles.recordLeft}>
            <View style={styles.recordIndex}><Text style={styles.recordIndexText}>{index + 1}</Text></View>
            <Text style={styles.recordId}>{id}</Text>
          </View>
          <Text style={styles.recordStatus}>Homologado</Text>
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

  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  kpiCard: { flex: 1, backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  kpiCardDim: { backgroundColor: '#f9fafb', borderColor: '#f3f4f6' },
  kpiValue: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 4 },
  kpiLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },

  listTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 8 },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordIndex: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  recordIndexText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  recordId: { fontSize: 13, fontFamily: 'monospace', color: '#374151' },
  recordStatus: { fontSize: 13, fontWeight: '600', color: '#10b981' }
});
