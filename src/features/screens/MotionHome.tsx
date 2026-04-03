import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { WorkoutConfirmationState, WorkoutEnrichmentInput } from '../../contracts/types';
import { useMotionSignalFacade } from '../../facades/useMotionSignalFacade';
import { MotionSurfaceCard, MotionStatusPill } from '../components/MotionUI';

// ViewModels & Sub-Views
import { useMotionHomeViewModel } from './viewModels/useMotionHomeViewModel';
import { MotionHomeBalance } from './home/MotionHomeBalance';
import { MotionHomePerformance } from './home/MotionHomePerformance';
import { MotionHomeMomentum } from './home/MotionHomeMomentum';

export const MotionHome = ({ onNavigate }: { onNavigate: (route: string) => void }) => {
  const theme = useMotionTheme();
  const viewModel = useMotionHomeViewModel();
  const exec = useMotionExecutionFacade();
  const signalFacade = useMotionSignalFacade();
  
  const [localSyncState, setLocalSyncState] = React.useState<'idle' | 'syncing' | 'synced' | 'failed' | 'blocked_demo' | 'blocked_history'>('idle');
  const [enrichmentInput, setEnrichmentInput] = React.useState<WorkoutEnrichmentInput>({});

  useEffect(() => {
    trackEvent(MotionEvents.HOME_VIEWED);
  }, []);

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

  // Bloco de Inferência do Host Shell - Mantido rígido conforme requisitos de backend
  const renderInferencesArea = () => {
    if (exec.pendingEnrichmentTarget?.source === 'passive_inference') {
      return (
        <View style={{ padding: 24, paddingBottom: 0, backgroundColor: theme.colors.pageBg }}>
           <MotionSurfaceCard level="high" style={{ padding: 24 }}>
            <Text style={[theme.typography.title, { marginBottom: 4, color: theme.colors.primary }]}>Treino Registado</Text>
            {/* Lógica Simplificada de Enriquecimento Preservada */}
            <View style={styles.enrichmentActions}>
               <TouchableOpacity onPress={() => handleEnrichment(false)} disabled={localSyncState === 'syncing'} style={[styles.confBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[theme.typography.body, { color: theme.colors.ctaPrimaryText, fontWeight: '700' }]}>Consolidar Registo</Text>
              </TouchableOpacity>
            </View>
          </MotionSurfaceCard>
        </View>
      );
    }

    if (exec.inferredWorkout && exec.inferredWorkout.detectionState !== 'suspected' && !exec.pendingEnrichmentTarget) {
      return (
        <View style={{ padding: 24, paddingBottom: 0, backgroundColor: theme.colors.pageBg }}>
          <MotionSurfaceCard level="high" style={{ padding: 24 }}>
            <View style={styles.inferredHeaderBlock}>
              <View style={[styles.inferredPulseDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[theme.typography.title, { color: theme.colors.textMain }]}>Deteção Sinalizada</Text>
            </View>
            <View style={styles.confirmationActions}>
               <TouchableOpacity onPress={() => handleInferredConfirmation('confirmed')} disabled={localSyncState === 'syncing'} style={[styles.confBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={[theme.typography.body, { color: theme.colors.ctaPrimaryText, fontWeight: '700' }]}>Validar Integração</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleInferredConfirmation('dismissed')} disabled={localSyncState === 'syncing'} style={[styles.confBtn, { backgroundColor: 'transparent' }]}>
                <Text style={[theme.typography.body, { color: theme.colors.error, fontWeight: '700' }]}>Descartar Captura</Text>
              </TouchableOpacity>
            </View>
          </MotionSurfaceCard>
        </View>
      );
    }

    return null;
  };

  // Roteamento Core Desacoplado
  const renderUniverse = () => {
    switch (viewModel.universe) {
      case 'Performance Boost':
        return <MotionHomePerformance viewModel={viewModel} onNavigate={onNavigate} />;
      case 'Momentum':
        return <MotionHomeMomentum viewModel={viewModel} onNavigate={onNavigate} />;
      case 'Balance':
      default:
        return <MotionHomeBalance viewModel={viewModel} onNavigate={onNavigate} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderInferencesArea()}
      {renderUniverse()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inferredHeaderBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inferredPulseDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  confirmationActions: { flexDirection: 'column', gap: 8 },
  enrichmentActions: { flexDirection: 'column', gap: 8, marginTop: 16 },
  confBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' }
});

