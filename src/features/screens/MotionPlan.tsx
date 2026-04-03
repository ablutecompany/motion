import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSessionScreen } from './MotionSession';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { MotionSurfaceCard, MotionStatusPill, MotionHeroCard } from '../components/MotionUI';
import { useMotionTheme } from '../../theme/useMotionTheme';

export const MotionPlanScreen: React.FC = () => {
  const theme = useMotionTheme();
  const plan = useMotionStore(selectors.selectPlan);
  const phase = useMotionStore(selectors.selectPhase);
  const universe = useMotionStore(selectors.selectUniverse);
  const syncState = useMotionStore(selectors.selectSetupSyncState);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const isHistory = useMotionStore(selectors.selectIsHistory);

  const exec = useMotionExecutionFacade();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    trackEvent(MotionEvents.PLAN_VIEWED);
  }, []);


  const renderSyncBadge = () => {
    if (syncState === 'dirty') {
      return <MotionStatusPill label="Ajuste local aplicado ao plano" tone="warning" />;
    } else if (syncState === 'failed') {
      return <MotionStatusPill label="Sincronização indisponível. Plano local mantido." tone="error" />;
    } else if (syncState === 'blocked_demo') {
      return <MotionStatusPill label="Restrito ao Demo" tone="neutral" />;
    } else if (syncState === 'blocked_history') {
      return <MotionStatusPill label="Leitura (Histórico)" tone="primary" />;
    }
    return null;
  };

  const getExecutionCardCopy = () => {
    switch (exec.currentExecutionMode) {
      case 'follow': return { title: 'Acompanhamento Silencioso', desc: 'A aplicação assiste e sinaliza métricas apenas quando exigido.' };
      case 'guide': return { title: 'Doutrina Guiada', desc: 'Condução dedicada ativa de bloco a bloco, com gestão de cadências.' };
      case 'hybrid': return { title: 'Execução Mista', desc: 'Orienta apenas nas transições críticas, mantendo discrição base.' };
      default: return { title: 'Pendente', desc: '-' };
    }
  };

  if (selectedSessionId) {
    return <MotionSessionScreen explicitSessionId={selectedSessionId} onBack={() => setSelectedSessionId(null)} />;
  }

  if (!plan || !plan.sessions || plan.sessions.length === 0) {
    return (
      <View style={[styles.emptyContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBg }]}>
        <Text style={[theme.typography.title, { marginBottom: 8 }]}>Plano em estruturação</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>A aguardar derivação operativa baseada no perfil atual.</Text>
      </View>
    );
  }

  const op = profile?.operational;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MotionHeroCard 
        overline="Visão Angular"
        title="Plano Delineado" 
        subtitle={phase ? `Foco predominante: ${phase}` : 'Diretiva em aberto'} 
      >
        <View style={{ marginBottom: 8 }}>
          {renderSyncBadge()}
        </View>
      </MotionHeroCard>

      <MotionSurfaceCard level="high" style={{ marginBottom: 32 }}>
        <View style={styles.contextHeader}>
          <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
          <Text style={theme.typography.title}>Eixo Diretor Vigente</Text>
        </View>
        <View style={styles.contextGrid}>
          <View style={styles.contextItem}>
            <Text style={theme.typography.label}>Foco</Text>
            <Text style={[theme.typography.body, {fontWeight: '700'}]}>{op?.currentGoal?.value ?? '-'}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={theme.typography.label}>Disponibilidade</Text>
            <Text style={[theme.typography.body, {fontWeight: '700'}]}>{op?.weeklyAvailability?.value ? `${op.weeklyAvailability.value} dias` : '-'}</Text>
          </View>
          <View style={styles.contextItem}>
            <Text style={theme.typography.label}>Ambiente</Text>
            <Text style={[theme.typography.body, {fontWeight: '700'}]}>{op?.trainingEnvironment?.value ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.execSummaryBox}>
           <Text style={[theme.typography.body, {fontWeight: '700', color: theme.colors.textMain}]}>Modo preferencial: {getExecutionCardCopy().title}</Text>
           <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]}>{getExecutionCardCopy().desc}</Text>
           <Text style={[theme.typography.caption, { marginTop: 8 }]}>* Suporta adaptação discreta via Hardware Tracking passivo quando relevante.</Text>
        </View>
      </MotionSurfaceCard>

      <Text style={[theme.typography.title, { marginBottom: 16 }]}>Instâncias Operacionais ({plan.sessions.length})</Text>

      {plan.sessions.map((session, index) => (
        <TouchableOpacity 
          key={session.id} 
          style={[styles.sessionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, borderRadius: theme.metrics.radiusCard }]}
          onPress={() => setSelectedSessionId(session.id)}
          activeOpacity={0.8}
        >
          <View style={styles.sessionHeader}>
            <Text style={theme.typography.title}>Módulo {index + 1}</Text>
            {session.completed ? (
              <View style={[styles.tagCompleted, { backgroundColor: theme.colors.successBg }]}><Text style={{ color: theme.colors.success, fontSize: 12, fontWeight: '700' }}>Concluída</Text></View>
            ) : (
              <View style={[styles.tagPending, { backgroundColor: theme.colors.pageBg }]}><Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Agendada</Text></View>
            )}
          </View>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailBlock}>
              <Text style={theme.typography.label}>Duração Predita</Text>
              <Text style={[theme.typography.body, {fontWeight: '700'}]}>{session.durationMinutes} min</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={theme.typography.label}>Intensidade Base</Text>
              <Text style={[theme.typography.body, {fontWeight: '700'}]}>{session.intensityMultiplier}x</Text>
            </View>
          </View>

          {/* Execution Readiness Signal */}
          <View style={[styles.readinessBox, { backgroundColor: theme.colors.pageBg }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.textMain, fontWeight: '600' }]}>Formato ativo de execução: {exec.currentExecutionMode.toUpperCase()}</Text>
            {exec.getPlacementCopy('corrida_base', 0.8).copy.showPlacement && (
              <Text style={[theme.typography.caption, { color: theme.colors.primary, marginTop: 4 }]}>✓ Hardware Tracking Elegível</Text>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.sessionIdText}>Ref: {session.id.split('-').pop()}</Text>
            <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '700' }]}>{session.completed || isHistory ? 'Escrutinar registo →' : 'Iniciar runtime →'}</Text>
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
  actionText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  
  execSummaryBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#f3f4f6' },
  execSummaryTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  execSummaryDesc: { fontSize: 13, color: '#4b5563', marginBottom: 8 },
  execSummaryMicro: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
  
  readinessBox: { backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, marginBottom: 12 },
  readinessText: { fontSize: 12, fontWeight: '500', color: '#374151' },
  readinessSubtext: { fontSize: 11, color: '#10b981', marginTop: 2 }
});
