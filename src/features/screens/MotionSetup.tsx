import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useMotionStore, selectors, storeActions } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { writebackService } from '../../services/writebackService';
import { useMotionExecutionFacade } from '../../facades/useMotionExecutionFacade';
import { MotionContribution, ExecutionMode } from '../../contracts/types';
import { MotionSectionHeader, MotionSectionCard } from '../components/MotionUI';

export const MotionSetupScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const hasWritePermission = useMotionStore(selectors.selectHasWritePermission);
  const profile = useMotionStore(selectors.selectMotionProfile);
  
  const op = profile?.operational;

  const [currentGoal, setCurrentGoal] = useState(op?.currentGoal?.value || 'manutencao');
  const [weeklyAvailability, setWeeklyAvailability] = useState(String(op?.weeklyAvailability?.value || 3));
  const [trainingEnvironment, setTrainingEnvironment] = useState(op?.trainingEnvironment?.value || 'casa');

  const exec = useMotionExecutionFacade();
  const [executionModePref, setExecutionModePref] = useState<ExecutionMode>(exec.currentExecutionMode);
  const [showAdvancedExec, setShowAdvancedExec] = useState(false);

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
    if (executionModePref !== exec.currentExecutionMode) exec.dispatchUpdateExecutionMode(executionModePref);

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
      <MotionSectionHeader 
        title="Ajustar Perfil" 
        subtitle="Ajustes locais ao contexto operativo." 
      />

      {isHistory && (
        <View style={styles.historyBlock}>
          <Text style={styles.historyBlockText}>Histórico: visualização apenas de leitura</Text>
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

      <View style={styles.formGroup}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
          <Text style={styles.label}>Modo de Treino</Text>
          <TouchableOpacity onPress={() => setShowAdvancedExec(!showAdvancedExec)}>
            <Text style={styles.advancedExecLink}>{showAdvancedExec ? 'Ocultar opções' : 'Mais opções'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.radioGroup}>
          <TouchableOpacity onPress={() => setExecutionModePref('follow')} disabled={isHistory} style={[styles.radioOption, executionModePref === 'follow' && styles.radioActive, isHistory && styles.inputDisabled]}>
             <Text style={[styles.radioText, executionModePref === 'follow' && styles.radioTextActive]}>Acompanhar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExecutionModePref('guide')} disabled={isHistory} style={[styles.radioOption, executionModePref === 'guide' && styles.radioActive, isHistory && styles.inputDisabled]}>
             <Text style={[styles.radioText, executionModePref === 'guide' && styles.radioTextActive]}>Orientar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExecutionModePref('hybrid')} disabled={isHistory} style={[styles.radioOption, executionModePref === 'hybrid' && styles.radioActive, isHistory && styles.inputDisabled]}>
             <Text style={[styles.radioText, executionModePref === 'hybrid' && styles.radioTextActive]}>Misto</Text>
          </TouchableOpacity>
        </View>

        {showAdvancedExec && (
          <View style={styles.advancedExecBox}>
            <Text style={styles.advancedNote}>• Acompanhar: regista e conclui silenciosamente.</Text>
            <Text style={styles.advancedNote}>• Orientar: conduz por blocos com prompts.</Text>
            <Text style={styles.advancedNote}>• Misto: orienta quando necessário e abstrai-se de microgerir.</Text>
            <Text style={[styles.advancedNote, { marginTop: 8, fontStyle: 'italic', color: '#9ca3af' }]}>* A captação de hardware é ativada se autorizada e sempre sugerida via recomendação visual na sessão.</Text>
          </View>
        )}
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
          <Text style={styles.saveButtonText}>Guardar Alterações</Text>
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
    elevation: 2,
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
  },
  advancedExecLink: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#111827',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
  },
  radioText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  radioTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  advancedExecBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  advancedNote: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  }
});
