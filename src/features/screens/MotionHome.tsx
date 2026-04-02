import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';

export const MotionHome: React.FC = () => {
  const universe = useMotionStore(selectors.selectUniverse);
  const phase = useMotionStore(selectors.selectPhase);
  const plan = useMotionStore(selectors.selectPlan);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const activeContext = useMotionStore(selectors.selectActiveContext);
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);

  useEffect(() => {
    trackEvent(MotionEvents.HOME_VIEWED);
  }, []);

  const getUniverseAccent = (u: string | null) => {
    switch (u) {
      case 'Balance': return '#10b981';
      case 'Performance Boost': return '#3b82f6';
      case 'Momentum': return '#8b5cf6';
      default: return '#9ca3af';
    }
  };

  const getEnvironmentStateLabel = () => {
    if (isHistory) return 'Histórico Fechado';
    if (isDemo) return 'Ambiente Simulado';
    return 'Tempo Real';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Visão Geral</Text>
        <Text style={styles.subtitle}>Enquadramento central da mini-app.</Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <View style={[styles.kpiDot, { backgroundColor: getUniverseAccent(universe) }]} />
            <Text style={styles.kpiLabel}>Eixo Analítico</Text>
          </View>
          <Text style={styles.kpiValue}>{universe ?? 'Indisponível'}</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <View style={[styles.kpiDot, { backgroundColor: '#9ca3af' }]} />
            <Text style={styles.kpiLabel}>Fase Corrente</Text>
          </View>
          <Text style={styles.kpiValue}>{phase ?? 'Pendente'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Resumo Operacional</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Contexto Aplicado</Text>
          <Text style={styles.rowValue}>{getEnvironmentStateLabel()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Foco Diretor</Text>
          <Text style={styles.rowValue}>{profile?.operational?.currentGoal?.value ?? 'Por definir'}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Sessões Agendadas</Text>
          <Text style={styles.rowValue}>{plan?.sessions?.length ?? 0} Módulos</Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          Esta camada é servida estaticamente pelo núcleo de compatibilidade root analítico. Todos os ajustes derivam dos pacotes da Shell base.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  
  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  kpiDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  kpiLabel: { fontSize: 12, textTransform: 'uppercase', color: '#6b7280', fontWeight: '700', letterSpacing: 0.5 },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24 },
  cardSectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  rowLabel: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '600' },

  footerNote: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  footerText: { color: '#9ca3af', fontSize: 12, lineHeight: 18, textAlign: 'center' }
});
