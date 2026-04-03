import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { useMotionSyncFacade } from '../../facades/useMotionSyncFacade';
import { useMotionExecutionRuntimeFacade } from '../../facades/useMotionExecutionRuntimeFacade';
import { WorkoutConfirmationState, WorkoutEnrichmentInput, MotionGuidanceMode } from '../../contracts/types';
import { MotionSectionHeader, MotionSectionCard, MotionStatusPill } from '../components/MotionUI';

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

  const exec = useMotionExecutionFacade();
  const syncFacade = useMotionSyncFacade();
  const [localSyncState, setLocalSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed' | 'blocked_demo' | 'blocked_history'>('idle');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMoreEnrichment, setShowMoreEnrichment] = useState(false);
  const [enrichmentInput, setEnrichmentInput] = useState<WorkoutEnrichmentInput>({});

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

  const uiModel = exec.selectExecutionViewModel(session.completed, showConfirmation);
  const runtimeCore = useMotionExecutionRuntimeFacade(session.id);

  const handleCompleteRequest = () => {
    trackEvent(MotionEvents.WORKOUT_CONFIRMATION_SHOWN, { sessionId: session.id });
    setShowConfirmation(true);
  };

  const handleConfirm = async (state: WorkoutConfirmationState) => {
    if (state === 'dismissed' || state === 'deferred') {
       await exec.dispatchWorkoutConfirmation(session.id, state);
       setShowConfirmation(false);
       if (state === 'dismissed') {
         if (onBack) onBack();
       }
       return;
    }

    setLocalSyncState('syncing');
    const result = await exec.dispatchWorkoutConfirmation(session.id, state);

    if (result.success) {
      setLocalSyncState('synced');
      setShowConfirmation(false);
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
      return <MotionStatusPill label="Sessão concluída" tone="success" />;
    }
    
    const syncDisplay = syncFacade.getSyncDisplayState(localSyncState === 'idle' ? 'synced' : localSyncState as any);

    switch (localSyncState) {
      case 'syncing': return <MotionStatusPill label={syncDisplay.label} tone="primary" />;
      case 'synced': return <MotionStatusPill label={syncDisplay.label} tone="success" />;
      case 'failed': return <MotionStatusPill label="Sincronização pendente. Registo guardado." tone="error" />;
      case 'blocked_demo': return <MotionStatusPill label="Retido no Demo" tone="warning" />;
      case 'blocked_history': return <MotionStatusPill label="Leitura (Histórico)" tone="primary" />;
      default: return <MotionStatusPill label="Sessão Agendada" tone="neutral" />;
    }
  };

  const renderHardwareIndicators = () => {
    return (
      <View style={styles.hwIndicators}>
        {runtimeCore.runtimeState.wakeLockStatus === 'active' && <Text style={styles.hwText}>Ecrã ativo</Text>}
        {runtimeCore.runtimeState.wakeLockStatus === 'unsupported' && <Text style={[styles.hwText, { color: '#9ca3af' }]}>Controlo do ecrã indisponível</Text>}
        {runtimeCore.runtimeState.wakeLockStatus === 'failed' && <Text style={[styles.hwText, { color: '#ef4444' }]}>Falha ao manter ecrã ativo</Text>}

        <Text style={styles.hwSeparator}>•</Text>

        <TouchableOpacity onPress={() => {
           let n: MotionGuidanceMode = 'silent';
           if (runtimeCore.guidanceMode === 'silent') n = 'text_only';
           else if (runtimeCore.guidanceMode === 'text_only' && runtimeCore.runtimeState.guidanceStatus !== 'unsupported') n = 'voice_optional';
           runtimeCore.setGuidanceLevel(n);
        }}>
          {runtimeCore.guidanceMode === 'silent' && <Text style={[styles.hwText, { color: '#9ca3af' }]}>Sem guidance</Text>}
          {runtimeCore.guidanceMode === 'text_only' && <Text style={styles.hwText}>Guidance textual</Text>}
          {runtimeCore.guidanceMode === 'voice_optional' && <Text style={[styles.hwText, { color: '#3b82f6' }]}>Guidance por voz</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRuntimeBlocks = () => {
    return (
      <View style={styles.runtimeBox}>
         <View style={styles.runtimeHeader}>
            <Text style={styles.runtimeTitle}>
              {runtimeCore.runtimeState.sessionStatus === 'idle' ? 'Pronto a arrancar' : 
               runtimeCore.runtimeState.sessionStatus === 'paused' ? 'Pausado' : 'Em execução'}
            </Text>
            
            {runtimeCore.runtimeState.sessionStatus === 'idle' && (
              <TouchableOpacity onPress={runtimeCore.actions.startSession} style={styles.runtimeAction}>
                <Text style={styles.runtimeActionText}>Iniciar Fases</Text>
              </TouchableOpacity>
            )}
            {runtimeCore.runtimeState.sessionStatus === 'running' && (
              <TouchableOpacity onPress={runtimeCore.actions.pauseSession} style={[styles.runtimeAction, {backgroundColor: '#fef2f2', borderColor: '#fca5a5'}]}>
                <Text style={[styles.runtimeActionText, {color: '#ef4444'}]}>Pausar</Text>
              </TouchableOpacity>
            )}
            {runtimeCore.runtimeState.sessionStatus === 'paused' && (
               <TouchableOpacity onPress={runtimeCore.actions.resumeSession} style={[styles.runtimeAction, {backgroundColor: '#ecfdf5', borderColor: '#a7f3d0'}]}>
                 <Text style={[styles.runtimeActionText, {color: '#10b981'}]}>Retomar</Text>
               </TouchableOpacity>
            )}
         </View>

         {runtimeCore.runtimeState.sessionStatus !== 'idle' && (
           <View style={styles.blocksList}>
             {runtimeCore.blocks.map((b) => (
                <View key={b.blockId} style={[styles.blockItem, b.status === 'active' && styles.blockItemActive]}>
                   <View>
                     <Text style={[styles.blockTitle, b.status === 'active' && {color: '#2563eb'}]}>{b.title}</Text>
                     {(runtimeCore.guidanceMode === 'text_only' || runtimeCore.guidanceMode === 'voice_optional') && b.status === 'active' && b.guidanceText && (
                        <Text style={styles.blockGuidance}>{b.guidanceText}</Text>
                     )}
                   </View>
                   {b.status === 'active' && (
                     <Text style={styles.blockStatus}>Bloco atual</Text>
                   )}
                   {b.status === 'upcoming' && (
                     <Text style={styles.blockStatusOff}>Prox</Text>
                   )}
                </View>
             ))}
           </View>
         )}
      </View>
    );
  };

  return (
    <View style={[styles.container, uiModel.ambientVisible && styles.ambientContainer]}>
      {uiModel.showDetailedUI && onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Regressar ao Plano</Text>
        </TouchableOpacity>
      )}

      <MotionSectionCard>
        <MotionSectionHeader title="Execução Operacional" subtitle="Instância em Análise" />

        <View style={{ marginBottom: 24 }}>
          {renderBadge()}
        </View>

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

        {uiModel.showDetailedUI && (
          <View style={styles.executionBox}>
            <View style={styles.rowBetween}>
              <Text style={styles.executionLabel}>Contexto Tático: <Text style={{fontWeight:'700'}}>{uiModel.executionModeLabel}</Text></Text>
              <TouchableOpacity onPress={() => exec.setAmbientMode(true)} style={styles.ambientTrigger}>
                <Text style={styles.ambientTriggerText}>Ativar Modo Foco</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.stateSubtitle, {marginBottom: 12}]}>{uiModel.executionModeHint}</Text>

            {renderHardwareIndicators()}
            {renderRuntimeBlocks()}

            {uiModel.placementPrompt && (
              <View style={styles.sensorBlock}>
                <Text style={styles.sensorText}>{uiModel.placementPrompt}</Text>
              </View>
            )}
            
            {uiModel.captureNotice && (
              <Text style={styles.stateSubtitle}>{uiModel.captureNotice}</Text>
            )}
          </View>
        )}

        {uiModel.ambientVisible && (
          <TouchableOpacity onPress={() => exec.setAmbientMode(false)} style={styles.ambientResume}>
             <Text style={styles.ambientResumeText}>Treino Ativo: {uiModel.executionModeLabel}</Text>
             <Text style={[styles.ambientResumeText, {fontSize: 12, opacity: 0.8, marginTop: 4}]}>Tocar aqui para expandir visualização.</Text>
          </TouchableOpacity>
        )}

        {exec.pendingEnrichmentTarget?.executionId === session.id && (
          <View style={styles.enrichmentBox}>
            <Text style={styles.enrichmentTitle}>Sessão Concluída e Registada</Text>
            <Text style={styles.enrichmentSubtitle}>Para calibrar o histórico detalhado do wellness, queres adicionar mais detalhe?</Text>
            
            <View style={styles.enrichmentGrid}>
               <View style={styles.optBlock}>
                  <Text style={styles.optLabel}>Tipo de Treino Predominante (Layer 1)</Text>
                  <View style={styles.optToggles}>
                    {['strength', 'cardio', 'mobility'].map(val => (
                      <TouchableOpacity 
                        key={val} 
                        style={[styles.optBtn, enrichmentInput.workoutType === val && styles.optBtnActive]}
                        onPress={() => setEnrichmentInput({ ...enrichmentInput, workoutType: val as any })}
                      >
                         <Text style={[styles.optBtnText, enrichmentInput.workoutType === val && styles.optBtnTextActive]}>
                           {val === 'strength' ? 'Força' : val === 'cardio' ? 'Cardio' : 'Mobilidade'}
                         </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
               </View>

               <View style={styles.optBlock}>
                  <Text style={styles.optLabel}>Sensação de Intensidade (Layer 1)</Text>
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

               {showMoreEnrichment && (
                 <>
                   <View style={styles.optBlock}>
                      <Text style={styles.optLabel}>Resposta Corporal (Layer 2)</Text>
                      <View style={styles.optToggles}>
                        {['good', 'heavy', 'stiff'].map(val => (
                          <TouchableOpacity 
                            key={val} 
                            style={[styles.optBtn, enrichmentInput.feltState === val && styles.optBtnActive]}
                            onPress={() => setEnrichmentInput({ ...enrichmentInput, feltState: val as any })}
                          >
                             <Text style={[styles.optBtnText, enrichmentInput.feltState === val && styles.optBtnTextActive]}>
                               {val === 'good' ? 'Solto / Bem' : val === 'heavy' ? 'Pesado' : 'Tenso'}
                             </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                   </View>
                   <View style={styles.optBlock}>
                      <Text style={styles.optLabel}>Sinais de Desconforto (Layer 2)</Text>
                      <View style={styles.optToggles}>
                        {['none', 'mild'].map(val => (
                          <TouchableOpacity 
                            key={val} 
                            style={[styles.optBtn, enrichmentInput.discomfortReported === val && styles.optBtnActive]}
                            onPress={() => setEnrichmentInput({ ...enrichmentInput, discomfortReported: val as any })}
                          >
                             <Text style={[styles.optBtnText, enrichmentInput.discomfortReported === val && styles.optBtnTextActive]}>
                               {val === 'none' ? 'Nenhum' : 'Ligeiro'}
                             </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                   </View>
                 </>
               )}
            </View>

            <View style={styles.enrichmentActions}>
              {!showMoreEnrichment && (
                <TouchableOpacity onPress={() => setShowMoreEnrichment(true)} style={styles.confBtn}>
                  <Text style={styles.confBtnText}>+ Detalhe Opcional</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleEnrichment(false)} disabled={localSyncState === 'syncing' || (!enrichmentInput.perceivedIntensity && !enrichmentInput.workoutType)} style={[styles.confBtn, styles.confBtnPrimary, ((!enrichmentInput.perceivedIntensity && !enrichmentInput.workoutType) || localSyncState === 'syncing') && styles.completeButtonDisabled]}>
                <Text style={styles.confBtnPrimaryText}>Guardar (Parcial ou Total)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEnrichment(true)} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
                <Text style={styles.confBtnText}>Ignorar Enriquecimento</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {uiModel.primaryTrainingState === 'active' && !exec.pendingEnrichmentTarget && (
          <View style={styles.actionsBox}>
            <TouchableOpacity 
              onPress={handleCompleteRequest} 
              disabled={isHistory || localSyncState === 'syncing'}
              style={[styles.completeButton, (isHistory || localSyncState === 'syncing') && styles.completeButtonDisabled]}
            >
              <Text style={styles.completeButtonText}>{localSyncState === 'syncing' ? 'A Aferir...' : 'Concluir Treino'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiModel.confirmationReady && (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Confirmar Fecho</Text>
            <View style={styles.confirmationActions}>
              <TouchableOpacity onPress={() => handleConfirm('confirmed')} disabled={localSyncState === 'syncing'} style={[styles.confBtn, styles.confBtnPrimary, localSyncState === 'syncing' && styles.completeButtonDisabled]}>
                <Text style={styles.confBtnPrimaryText}>{localSyncState === 'syncing' ? 'A Enviar...' : 'Confirmar Rescaldo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConfirm('deferred')} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
                <Text style={styles.confBtnText}>Deixar Pendente</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConfirm('dismissed')} disabled={localSyncState === 'syncing'} style={styles.confBtn}>
                <Text style={styles.confBtnText}>Cancelar Registo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </MotionSectionCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  backButton: { marginBottom: 16, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  backButtonText: { color: '#4b5563', fontSize: 14, fontWeight: '600' },
  
  ambientContainer: { backgroundColor: '#111827' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center' },

  contextBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  contextText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  contextSeparator: { marginHorizontal: 8, color: '#d1d5db', fontSize: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginBottom: 32 },
  dataBlock: { minWidth: '40%' },
  dataLabel: { fontSize: 12, textTransform: 'uppercase', color: '#6b7280', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  dataValue: { fontSize: 16, color: '#111827', fontWeight: '500' },

  executionBox: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 24 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  executionLabel: { fontSize: 13, color: '#4b5563' },
  ambientTrigger: { backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  ambientTriggerText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  sensorBlock: { padding: 12, backgroundColor: '#eff6ff', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  sensorText: { color: '#1e40af', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  stateSubtitle: { fontSize: 11, color: '#9ca3af', fontStyle: 'italic' },
  
  ambientResume: { backgroundColor: '#374151', padding: 24, borderRadius: 12, marginBottom: 24, alignItems: 'center', borderColor: '#4b5563', borderWidth: 1 },
  ambientResumeText: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },

  actionsBox: { flexDirection: 'column', gap: 12 },
  completeButton: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  completeButtonDisabled: { backgroundColor: '#d1d5db' },
  completeButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },

  hwIndicators: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#d1d5db' },
  hwText: { fontSize: 11, fontWeight: '600', color: '#4b5563' },
  hwSeparator: { marginHorizontal: 8, color: '#9ca3af' },

  runtimeBox: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginBottom: 12 },
  runtimeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  runtimeTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  runtimeAction: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  runtimeActionText: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase' },

  blocksList: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, gap: 12 },
  blockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  blockItemActive: {  },
  blockTitle: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 2 },
  blockGuidance: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', maxWidth: '90%' },
  blockStatus: { fontSize: 10, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  blockStatusOff: { fontSize: 10, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },

  confirmationBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 16, borderRadius: 12 },
  confirmationTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  confirmationActions: { flexDirection: 'column', gap: 8 },
  confBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#e5e7eb' },
  confBtnPrimary: { backgroundColor: '#111827' },
  confBtnText: { color: '#4b5563', fontSize: 14, fontWeight: '600' },
  confBtnPrimaryText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  enrichmentBox: { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#ccfbf1', padding: 16, borderRadius: 12 },
  enrichmentTitle: { fontSize: 14, fontWeight: '700', color: '#134e4a', marginBottom: 4 },
  enrichmentSubtitle: { fontSize: 13, color: '#115e59', marginBottom: 16 },
  enrichmentGrid: { marginBottom: 16, gap: 12 },
  optBlock: { marginBottom: 8 },
  optLabel: { fontSize: 12, fontWeight: '600', color: '#0f766e', marginBottom: 8 },
  optToggles: { flexDirection: 'row', gap: 6 },
  optBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#99f6e4', backgroundColor: '#e0f2fe' },
  optBtnActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  optBtnText: { fontSize: 12, color: '#0f766e', fontWeight: '500' },
  optBtnTextActive: { color: '#ffffff' },
  enrichmentActions: { flexDirection: 'column', gap: 8 }
});
