import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMotionStore, selectors, storeActions } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { writebackService } from '../../services/writebackService';
import { MotionContribution } from '../../contracts/types';

interface MotionSessionProps {
  explicitSessionId?: string;
  onBack?: () => void;
}

export const MotionSessionScreen: React.FC<MotionSessionProps> = ({ explicitSessionId, onBack }) => {
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const hasWritePermission = useMotionStore(selectors.selectHasWritePermission);
  const plan = useMotionStore(selectors.selectPlan);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const universe = useMotionStore(selectors.selectUniverse);

  const [localSyncState, setLocalSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed' | 'blocked_demo' | 'blocked_history'>('idle');

  useEffect(() => {
    trackEvent(MotionEvents.SESSION_VIEWED);
  }, []);

  const session = explicitSessionId 
    ? plan?.sessions?.find(s => s.id === explicitSessionId) 
    : plan?.sessions?.find(s => !s.completed) ?? plan?.sessions?.[0];

  if (!session) {
    return (
      <View style={styles.emptyContainer}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar ao Plano</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.emptyTitle}>Sessão indisponível</Text>
        <Text style={styles.emptyDesc}>Não existem instâncias operacionais correlacionadas visíveis no plano corrente.</Text>
      </View>
    );
  }

  const handleComplete = async () => {
    if (isHistory) {
      setLocalSyncState('blocked_history');
      return;
    }
    
    if (!hasWritePermission && !isDemo) {
      setLocalSyncState('failed');
      return;
    }

    setLocalSyncState('syncing');
    trackEvent(MotionEvents.SESSION_COMPLETE_CLICKED, { sessionId: session.id });

    storeActions.markSessionCompletedLocal(session.id);
    trackEvent(MotionEvents.SESSION_COMPLETED_LOCAL, { sessionId: session.id });

    const contribution: MotionContribution = {
      source: '_motion_app',
      type: 'readiness_update', // Assuming placeholder type fits existing taxonomy
      timestamp: new Date().toISOString(),
      payload: { completedSessionId: session.id }
    };

    const result = await writebackService.attemptWriteback(contribution, isDemo, isHistory, hasWritePermission);

    if (result.success) {
      trackEvent(MotionEvents.WRITEBACK_SENT);
      setLocalSyncState('synced');
    } else {
      trackEvent(MotionEvents.WRITEBACK_FAILED);
      if (result.reason === 'blocked_demo') {
        setLocalSyncState('blocked_demo');
      } else if (result.reason === 'blocked_history') {
        setLocalSyncState('blocked_history');
      } else {
        setLocalSyncState('failed');
      }
    }
  };

  const getUniverseAccent = (u: string | null) => {
    switch (u) {
      case 'Balance': return '#10b981';
      case 'Performance Boost': return '#3b82f6';
      case 'Momentum': return '#8b5cf6';
      default: return '#9ca3af';
    }
  };

  const renderBadge = () => {
    if (session.completed && localSyncState === 'idle') {
      return <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeTextSuccess}>Sessão concluída</Text></View>;
    }
    switch (localSyncState) {
      case 'syncing': return <View style={[styles.badge, styles.badgeInfo]}><Text style={styles.badgeTextInfo}>A sincronizar conclusão</Text></View>;
      case 'synced': return <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeTextSuccess}>Conclusão registada e sincronizada</Text></View>;
      case 'failed': return <View style={[styles.badge, styles.badgeError]}><Text style={styles.badgeTextError}>Sincronização indisponível. Registo local mantido.</Text></View>;
      case 'blocked_demo': return <View style={[styles.badge, styles.badgeNeutral]}><Text style={styles.badgeTextNeutral}>Modo demo: conclusão apenas local</Text></View>;
      case 'blocked_history': return <View style={[styles.badge, styles.badgeNeutral]}><Text style={styles.badgeTextNeutral}>Histórico: conclusão indisponível</Text></View>;
      default: return <View style={[styles.badge, styles.badgeNeutral]}><Text style={styles.badgeTextNeutral}>Sessão agendada</Text></View>;
    }
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Regressar ao Plano</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Execução Operacional</Text>
          <Text style={styles.subtitle}>Instância em Análise</Text>
        </View>

        {renderBadge()}

        <View style={styles.contextBlock}>
          <View style={[styles.dot, { backgroundColor: getUniverseAccent(universe) }]} />
          <Text style={styles.contextText}>Eixo {universe ?? 'Universal'}</Text>
          <Text style={styles.contextSeparator}>•</Text>
          <Text style={styles.contextText}>{profile?.operational?.currentGoal?.value ?? 'Foco Base'}</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.dataBlock}>
            <Text style={styles.dataLabel}>Duração Prevista</Text>
            <Text style={styles.dataValue}>{session.durationMinutes} min</Text>
          </View>
          <View style={styles.dataBlock}>
            <Text style={styles.dataLabel}>Intensidade</Text>
            <Text style={styles.dataValue}>{session.intensityMultiplier}x</Text>
          </View>
          <View style={styles.dataBlock}>
            <Text style={styles.dataLabel}>Ambiente</Text>
            <Text style={styles.dataValue}>{profile?.operational?.trainingEnvironment?.value ?? 'Não especificado'}</Text>
          </View>
          <View style={styles.dataBlock}>
            <Text style={styles.dataLabel}>Referência ID</Text>
            <Text style={[styles.dataValue, { fontFamily: 'monospace', fontSize: 13 }]}>{session.id.split('-').pop()}</Text>
          </View>
        </View>

        {!session.completed && (
          <TouchableOpacity 
            onPress={handleComplete} 
            disabled={isHistory || localSyncState === 'syncing'}
            style={[styles.completeButton, (isHistory || localSyncState === 'syncing') && styles.completeButtonDisabled]}
          >
            <Text style={styles.completeButtonText}>{localSyncState === 'syncing' ? 'A Aferir...' : 'Concluir sessão'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  backButton: { marginBottom: 16, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#4b5563', fontSize: 14, fontWeight: '600' },
  
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center' },

  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', fontWeight: '500' },

  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 24, borderWidth: 1 },
  badgeSuccess: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  badgeTextSuccess: { color: '#047857', fontSize: 13, fontWeight: '600' },
  badgeInfo: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  badgeTextInfo: { color: '#1d4ed8', fontSize: 13, fontWeight: '600' },
  badgeError: { backgroundColor: '#fdf2f8', borderColor: '#ec4899' },
  badgeTextError: { color: '#be185d', fontSize: 13, fontWeight: '600' },
  badgeNeutral: { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' },
  badgeTextNeutral: { color: '#4b5563', fontSize: 13, fontWeight: '600' },

  contextBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  contextText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  contextSeparator: { marginHorizontal: 8, color: '#d1d5db', fontSize: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 32 },
  dataBlock: { minWidth: '40%' },
  dataLabel: { fontSize: 12, textTransform: 'uppercase', color: '#6b7280', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  dataValue: { fontSize: 16, color: '#111827', fontWeight: '500' },

  completeButton: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completeButtonDisabled: { backgroundColor: '#d1d5db' },
  completeButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});
