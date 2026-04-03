import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMotionStore, selectors, storeActions } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSetupScreen } from './MotionSetup';
import { MotionSurfaceCard, MotionStatusPill, MotionProfileIdentity, MotionUniverseSelectorCard, MotionInsightBentoCard, MotionSettingsRow } from '../components/MotionUI';
import { useMotionTheme } from '../../theme/useMotionTheme';

export const MotionProfileScreen: React.FC = () => {
  const profile = useMotionStore(selectors.selectMotionProfile);
  const syncState = useMotionStore(selectors.selectSetupSyncState);
  const universe = useMotionStore(selectors.selectUniverse);
  const phase = useMotionStore(selectors.selectPhase);
  const theme = useMotionTheme();
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    trackEvent(MotionEvents.PROFILE_VIEWED);
  }, []);



  const renderBadge = () => {
    switch (syncState) {
      case 'dirty': return <MotionStatusPill label="Ajuste aplicado ao plano atual" tone="warning" />;
      case 'syncing': return <MotionStatusPill label="A sincronizar reestruturação" tone="primary" />;
      case 'synced': return <MotionStatusPill label="Integração base consolidada" tone="success" />;
      case 'failed': return <MotionStatusPill label="Sincronização indisponível. Ajuste local contido." tone="error" />;
      case 'blocked_demo': return <MotionStatusPill label="Modo demo: ajuste apenas local garantido" tone="neutral" />;
      case 'blocked_history': return <MotionStatusPill label="Histórico: edição parametral indisponível" tone="neutral" />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {!isEditing && profile && (
        <>
          <MotionProfileIdentity 
            title="Sessão Local" 
            subtitle="Identidade Ablute Base" 
            universe={universe ?? 'Matriz Inespecífica'} 
          />
          
          <View style={{ marginBottom: 24, alignItems: 'center' }}>{renderBadge()}</View>

          <View style={{ marginBottom: 32 }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
               <Text style={[theme.typography.label, { color: theme.colors.textSecondary, letterSpacing: 1.5, fontSize: 11 }]}>UNIVERSO E MODO</Text>
             </View>
             <MotionUniverseSelectorCard 
                title="Balance" 
                subtitle="Orientação suave para recuperação e rotina orgânica."
                isActive={universe === 'Balance'}
                onPress={() => storeActions.setBootData({ universe: 'Balance' })}
             />
             <MotionUniverseSelectorCard 
                title="Performance Boost" 
                subtitle="Foco metabólico tenso de alta exigência calórica."
                isActive={universe === 'Performance Boost'}
                onPress={() => storeActions.setBootData({ universe: 'Performance Boost' })}
             />
             <MotionUniverseSelectorCard 
                title="Momentum" 
                subtitle="Acompanhamento fluído focado em consistência."
                isActive={universe === 'Momentum'}
                onPress={() => storeActions.setBootData({ universe: 'Momentum' })}
             />
          </View>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            <MotionInsightBentoCard 
              value={phase || '-'} 
              label="Fase Atual" 
            />
            <MotionInsightBentoCard 
              value={profile.operational.weeklyAvailability.value} 
              label="Disponibilidade"
              unit="dias"
            />
          </View>
          
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            <MotionInsightBentoCard 
              value={profile.operational.currentGoal.value} 
              label="Foco Diretor" 
            />
            <MotionInsightBentoCard 
              value={profile.operational.trainingEnvironment.value} 
              label="Ambiente Base" 
            />
          </View>

          <View style={{ marginBottom: 40 }}>
            <Text style={[theme.typography.label, { color: theme.colors.textSecondary, letterSpacing: 1.5, fontSize: 11, marginBottom: 12, paddingHorizontal: 8 }]}>DEFINIÇÕES</Text>
            <MotionSettingsRow 
              label="Reconfigurar Eixo Operacional" 
              onPress={() => setIsEditing(true)} 
            />
            <MotionSettingsRow 
              label="Privacidade da Telemetria Host" 
              onPress={() => {}} 
            />
          </View>
        </>
      )}

      {!isEditing && !profile && (
        <MotionSurfaceCard level="low" style={{ alignItems: 'center', padding: 40, marginTop: 40 }}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>A mapear contexto orgânico da shell raíz...</Text>
        </MotionSurfaceCard>
      )}

      {isEditing && <MotionSetupScreen onClose={() => setIsEditing(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  }
});
