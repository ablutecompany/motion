import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSessionScreen } from './MotionSession';

export const MotionPlanScreen: React.FC = () => {
  const plan = useMotionStore(selectors.selectPlan);
  const phase = useMotionStore(selectors.selectPhase);
  const universe = useMotionStore(selectors.selectUniverse);
  const syncState = useMotionStore(selectors.selectSetupSyncState);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const isHistory = useMotionStore(selectors.selectIsHistory);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent(MotionEvents.PLAN_VIEWED);
  }, []);

  const getUniverseAccent = (u: string | null) => {
    switch (u) {
      case 'Balance': return '#10b981';
      case 'Performance Boost': return '#3b82f6';
      case 'Momentum': return '#8b5cf6';
      default: return '#9ca3af';
    }
  };

  const renderSyncBadge = () => {
    if (syncState === 'dirty') {
      return <Text style={styles.badgeDirty}>Ajuste local aplicado ao plano</Text>;
    } else if (syncState === 'failed') {
      return <Text style={styles.badgeFailed}>Sincronização indisponível. Plano local mantido.</Text>;
    } else if (syncState === 'blocked_demo') {
      return <Text style={styles.badgeDemo}>Modo demo: alterações apenas locais</Text>;
    } else if (syncState === 'blocked_history') {
      return <Text style={styles.badgeHistory}>Histórico: visualização sem edição</Text>;
    }
    return null;
  };

  if (selectedSessionId) {
    return <MotionSessionScreen explicitSessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
  }

  if (!plan || !plan.sessions || plan.sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Plano em estruturação</Text>
        <Text style={styles.emptyDesc}>A aguardar derivação operativa baseada no perfil atual.</Text>
      </View>
    );
  }

  const op = profile?.operational;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Plano Corrente</Text>
        <Text style={styles.subtitle}>{phase ? `Fase de ${phase}` : 'Diretiva em aberto'}</Text>
        {renderSyncBadge()}
      </View>

      <View style={styles.card}>
        <View style={styles.contextHeader}>
          <View style={[styles.dot, { backgroundColor: getUniverseAccent(universe) }]} />
          <Text style={styles.contextTitle}>Contexto Tático Vigente</Text>
        </View>
        <View style={styles.contextGrid}>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Foco Diretor</Text>
            <Text style={styles.contextValue}>{op?.currentGoal?.value ?? '-'}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Disponibilidade</Text>
            <Text style={styles.contextValue}>{op?.weeklyAvailability?.value ? `${op.weeklyAvailability.value} dias` : '-'}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={styles.contextLabel}>Ambiente</Text>
            <Text style={styles.contextValue}>{op?.trainingEnvironment?.value ?? '-'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.listSectionTitle}>Instâncias Operacionais ({plan.sessions.length})</Text>

      {plan.sessions.map((session, index) => (
        <TouchableOpacity 
          key={session.id} 
          style={styles.sessionCard}
          onPress={() => setSelectedSessionId(session.id)}
          activeOpacity={0.8}
        >
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>Sessão {index + 1}</Text>
            {session.completed ? (
              <View style={styles.tagCompleted}><Text style={styles.tagCompletedText}>Concluída</Text></View>
            ) : (
              <View style={styles.tagPending}><Text style={styles.tagPendingText}>Agendada</Text></View>
            )}
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Duração Base</Text>
              <Text style={styles.detailValue}>{session.durationMinutes} min</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Intensidade Relativa</Text>
              <Text style={styles.detailValue}>{session.intensityMultiplier}x</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.sessionIdText}>Ref: {session.id.split('-').pop()}</Text>
            <Text style={styles.actionText}>{session.completed || isHistory ? 'Visualizar detalhe →' : 'Abrir Sessão →'}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', fontWeight: '500', marginBottom: 8 },
  
  badgeDirty: { color: '#b45309', fontSize: 13, fontWeight: '600', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', overflow: 'hidden' },
  badgeFailed: { color: '#be185d', fontSize: 13, fontWeight: '600', backgroundColor: '#fdf2f8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', overflow: 'hidden' },
  badgeDemo: { color: '#4b5563', fontSize: 13, fontWeight: '600', backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', overflow: 'hidden' },
  badgeHistory: { color: '#1d4ed8', fontSize: 13, fontWeight: '600', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start', overflow: 'hidden' },
  
  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  contextHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  contextTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  contextItem: { minWidth: 100 },
  contextLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  contextValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  
  listSectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  
  sessionCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sessionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  tagCompleted: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagCompletedText: { color: '#047857', fontSize: 12, fontWeight: '600' },
  tagPending: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagPendingText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  
  sessionDetails: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  detailBlock: {},
  detailLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 12 },
  sessionIdText: { fontSize: 11, color: '#d1d5db', fontFamily: 'monospace' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#111827' }
});
