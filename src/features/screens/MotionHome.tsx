import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { WorkoutConfirmationState, WorkoutEnrichmentInput } from '../../contracts/types';
import { TouchableOpacity } from 'react-native';
import { MotionSectionHeader, MotionSectionCard, MotionMetaRow, MotionStatusPill } from '../components/MotionUI';

export const MotionHome: React.FC = () => {
  const universe = useMotionStore(selectors.selectUniverse);
  const phase = useMotionStore(selectors.selectPhase);
  const plan = useMotionStore(selectors.selectPlan);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const activeContext = useMotionStore(selectors.selectActiveContext);
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const exec = useMotionExecutionFacade();
  
  const [localSyncState, setLocalSyncState] = React.useState<'idle' | 'syncing' | 'synced' | 'failed' | 'blocked_demo' | 'blocked_history'>('idle');
  const [enrichmentInput, setEnrichmentInput] = React.useState<WorkoutEnrichmentInput>({});

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
    if (isHistory) return 'Leitura (Histórico)';
    if (isDemo) return 'Restrito ao Demo';
    return 'Tempo Real';
  };

  const handleInferredConfirmation = async (state: WorkoutConfirmationState) => {
    if (!exec.inferredWorkout) return;
    
    setLocalSyncState('syncing');
    const result = await exec.dispatchInferredWorkoutConfirmation(state);
    
    if (result.success) {
      setLocalSyncState('synced');
    } else {
      setLocalSyncState(result.reason as any || 'failed');
    }
  };

  const handleEnrichment = async (skip: boolean) => {
    setLocalSyncState('syncing');
    const result = await exec.dispatchWorkoutEnrichment(skip ? null : enrichmentInput);
    
    if (result.success) {
      setLocalSyncState('synced');
    } else {
      setLocalSyncState(result.reason as any || 'failed');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MotionSectionHeader title="Visão Geral" subtitle="Enquadramento central da mini-app." />

      {exec.pendingEnrichmentTarget?.source === 'passive_inference' && (
        <View style={styles.enrichmentBox}>
          <Text style={styles.enrichmentTitle}>Treino Registado</Text>
          <Text style={styles.enrichmentSubtitle}>Para calibrar o sinal para o wellness, queres adicionar mais detalhe a este registo?</Text>
          
          <View style={styles.enrichmentGrid}>
             <View style={styles.optBlock}>
                <Text style={styles.optLabel}>Sensação</Text>
                <View style={styles.optToggles}>
                  {['light', 'moderate', 'hard'].map(val => (
                    <TouchableOpacity 
                      key={val} 
                      style={[styles.optBtn, enrichmentInput.perceivedIntensity === val && styles.optBtnActive]}
                      onPress={() => setEnrichmentInput({ ...enrichmentInput, perceivedIntensity: val as any })}
                    >
                       <Text style={[styles.optBtnText, enrichmentInput.perceivedIntensity === val && styles.optBtnTextActive]}>
                         {val === 'light' ? 'Leve' : val === 'moderate' ? 'Moderada' : 'Intensa'}
                       </Text>
                    </TouchableOpacity>
                  ))}
                </View>
             </View>
             <View style={styles.optBlock}>
                <Text style={styles.optLabel}>Tipo Primário</Text>
                <View style={styles.optToggles}>
                  {['strength', 'cardio', 'walk'].map(val => (
                    <TouchableOpacity 
                      key={val} 
                      style={[styles.optBtn, enrichmentInput.workoutType === val && styles.optBtnActive]}
                      onPress={() => setEnrichmentInput({ ...enrichmentInput, workoutType: val as any })}
                    >
                       <Text style={[styles.optBtnText, enrichmentInput.workoutType === val && styles.optBtnTextActive]}>
                         {val === 'strength' ? 'Força' : val === 'cardio' ? 'Cardio' : 'Caminhada'}
                       </Text>
                    </TouchableOpacity>
                  ))}
                </View>
             </View>
          </View>

          <View style={styles.enrichmentActions}>
            <TouchableOpacity onPress={() => handleEnrichment(false)} disabled={localSyncState === 'syncing' || !enrichmentInput.perceivedIntensity} style={[styles.confBtn, styles.confBtnPrimary, (!enrichmentInput.perceivedIntensity || localSyncState === 'syncing') && styles.confBtnDisabled]}>
              <Text style={styles.confBtnPrimaryText}>Guardar Detalhe</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEnrichment(true)} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
              <Text style={styles.confBtnText}>Ignorar Opcional</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {exec.inferredWorkout && exec.inferredWorkout.detectionState !== 'suspected' && !exec.pendingEnrichmentTarget && (
        <View style={styles.inferredCard}>
          <View style={styles.inferredHeaderBlock}>
            <View style={styles.inferredPulseDot} />
            <Text style={styles.inferredTitle}>Nova Atividade Detetada</Text>
          </View>
          <Text style={styles.inferredSubtitle}>
            {exec.inferredWorkout.reasonSummary || 'Detetámos comportamentos elegíveis. Confirmas o fecho de um novo treino?'}
          </Text>
          
          <View style={styles.confirmationActions}>
            <TouchableOpacity onPress={() => handleInferredConfirmation('confirmed')} disabled={localSyncState === 'syncing'} style={[styles.confBtn, styles.confBtnPrimary, localSyncState === 'syncing' && styles.confBtnDisabled]}>
              <Text style={styles.confBtnPrimaryText}>{localSyncState === 'syncing' ? 'A Enviar...' : 'Confirmar Treino'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleInferredConfirmation('deferred')} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
              <Text style={styles.confBtnText}>Deixar Pendente</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleInferredConfirmation('dismissed')} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
              <Text style={styles.confBtnText}>Rejeitar (Falso Positivo)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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

      <MotionSectionCard>
        <Text style={styles.cardSectionTitle}>Resumo Operacional</Text>
        <MotionMetaRow label="Contexto Aplicado" value={getEnvironmentStateLabel()} />
        <MotionMetaRow label="Foco Diretor" value={profile?.operational?.currentGoal?.value ?? 'Por definir'} />
        <MotionMetaRow label="Sessões Agendadas" value={`${plan?.sessions?.length ?? 0} Módulos`} />
      </MotionSectionCard>

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
  
  cardSectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },

  footerNote: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  footerText: { color: '#9ca3af', fontSize: 12, lineHeight: 18, textAlign: 'center' },

  inferredCard: { backgroundColor: '#fdf4ff', borderRadius: 12, borderWidth: 1, borderColor: '#fbcfe8', padding: 16, marginBottom: 24 },
  inferredHeaderBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inferredPulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ec4899', marginRight: 8 },
  inferredTitle: { fontSize: 14, fontWeight: '700', color: '#831843' },
  inferredSubtitle: { fontSize: 13, color: '#9d174d', marginBottom: 16 },

  confirmationActions: { flexDirection: 'column', gap: 8 },
  confBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#fce7f3' },
  confBtnPrimary: { backgroundColor: '#be185d' },
  confBtnDisabled: { backgroundColor: '#fdf2f8', opacity: 0.6 },
  confBtnText: { color: '#831843', fontSize: 14, fontWeight: '600' },
  confBtnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  
  enrichmentBox: { backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#fbcfe8', padding: 16, borderRadius: 12, marginBottom: 24 },
  enrichmentTitle: { fontSize: 14, fontWeight: '700', color: '#831843', marginBottom: 4 },
  enrichmentSubtitle: { fontSize: 13, color: '#9d174d', marginBottom: 16 },
  enrichmentGrid: { marginBottom: 16, gap: 12 },
  optBlock: { marginBottom: 8 },
  optLabel: { fontSize: 12, fontWeight: '600', color: '#9d174d', marginBottom: 8 },
  optToggles: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  optBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#fbcfe8', backgroundColor: '#fce7f3' },
  optBtnActive: { backgroundColor: '#be185d', borderColor: '#be185d' },
  optBtnText: { fontSize: 12, color: '#9d174d', fontWeight: '500' },
  optBtnTextActive: { color: '#ffffff' },
  enrichmentActions: { flexDirection: 'column', gap: 8 }
});
