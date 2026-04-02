import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useMotionStore, selectors, storeActions } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { writebackService } from '../../services/writebackService';
import { MotionContribution } from '../../contracts/types';

export const MotionSetupScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const hasWritePermission = useMotionStore(selectors.selectHasWritePermission);
  const profile = useMotionStore(selectors.selectMotionProfile);
  
  const op = profile?.operational;

  const [currentGoal, setCurrentGoal] = useState(op?.currentGoal?.value || 'manutencao');
  const [weeklyAvailability, setWeeklyAvailability] = useState(String(op?.weeklyAvailability?.value || 3));
  const [trainingEnvironment, setTrainingEnvironment] = useState(op?.trainingEnvironment?.value || 'casa');

  useEffect(() => {
    trackEvent(MotionEvents.PROFILE_EDIT_OPENED);
  }, []);

  const handleSave = async () => {
    if (isHistory) {
      storeActions.setSetupSyncState('blocked_history');
      trackEvent(MotionEvents.PROFILE_WRITEBACK_BLOCKED_HISTORY);
      return;
    }
    
    if (!hasWritePermission && !isDemo) {
      storeActions.setSetupSyncState('failed');
      return;
    }

    const numericDays = parseInt(weeklyAvailability, 10) || 3;

    if (currentGoal !== op?.currentGoal?.value) trackEvent(MotionEvents.GOAL_UPDATED_LOCAL, { currentGoal });
    if (numericDays !== op?.weeklyAvailability?.value) trackEvent(MotionEvents.WEEKLY_AVAILABILITY_UPDATED_LOCAL, { weeklyAvailability: numericDays });
    if (trainingEnvironment !== op?.trainingEnvironment?.value) trackEvent(MotionEvents.TRAINING_ENVIRONMENT_UPDATED_LOCAL, { trainingEnvironment });

    storeActions.updateOperationalSetupLocal({
      currentGoal,
      weeklyAvailability: numericDays,
      trainingEnvironment
    });

    storeActions.regeneratePlanLocal();

    trackEvent(MotionEvents.PROFILE_WRITEBACK_PREPARED);
    storeActions.setSetupSyncState('syncing');

    const contribution: MotionContribution = {
      source: '_motion_app',
      type: 'setup_updated',
      timestamp: new Date().toISOString(),
      payload: { currentGoal, weeklyAvailability: numericDays, trainingEnvironment }
    };

    const result = await writebackService.attemptWriteback(contribution, isDemo, isHistory, hasWritePermission);
    
    if (result.success) {
      trackEvent(MotionEvents.PROFILE_WRITEBACK_SENT);
      storeActions.setSetupSyncState('synced');
    } else {
      if (result.reason === 'blocked_demo') {
        trackEvent(MotionEvents.PROFILE_WRITEBACK_BLOCKED_DEMO);
        storeActions.setSetupSyncState('blocked_demo');
      } else if (result.reason === 'blocked_history') {
        storeActions.setSetupSyncState('blocked_history');
      } else {
        trackEvent(MotionEvents.PROFILE_WRITEBACK_FAILED);
        storeActions.setSetupSyncState('failed');
      }
    }
    onClose();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Ajustar Perfil</Text>
      <Text style={styles.headerSubtitle}>Providencie afinações controladas ao seu pacote tático.</Text>

      {isHistory && (
        <View style={styles.historyBlock}>
          <Text style={styles.historyBlockText}>Histórico: edição indisponível face a limite temporal</Text>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Foco primário (Objetivo)</Text>
        <TextInput 
          value={currentGoal} 
          onChangeText={setCurrentGoal} 
          editable={!isHistory}
          style={[styles.input, isHistory && styles.inputDisabled]} 
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Dotação semanal (Dias)</Text>
        <TextInput 
          value={weeklyAvailability} 
          onChangeText={setWeeklyAvailability} 
          keyboardType="numeric"
          editable={!isHistory}
          style={[styles.input, isHistory && styles.inputDisabled]} 
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Instalação Padrão (Ambiente)</Text>
        <TextInput 
          value={trainingEnvironment} 
          onChangeText={setTrainingEnvironment} 
          editable={!isHistory}
          style={[styles.input, isHistory && styles.inputDisabled]} 
        />
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isHistory}
          style={[styles.saveButton, isHistory && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>Aplicar Ajuste Orgânico</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  historyBlock: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  historyBlockText: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  }
});
