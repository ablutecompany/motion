import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSetupScreen } from './MotionSetup';
import { MotionSectionHeader, MotionSectionCard, MotionStatusPill, MotionMetaRow } from '../components/MotionUI';

export const MotionProfileScreen: React.FC = () => {
  const profile = useMotionStore(selectors.selectMotionProfile);
  const syncState = useMotionStore(selectors.selectSetupSyncState);
  
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    trackEvent(MotionEvents.PROFILE_VIEWED);
  }, []);

  const getUniverseAccent = (universe: string | null) => {
    switch (universe) {
      case 'Balance': return '#10b981'; // Green
      case 'Performance Boost': return '#3b82f6'; // Blue
      case 'Momentum': return '#8b5cf6'; // Purple
      default: return '#9ca3af'; // Gray
    }
  };

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
      <MotionSectionHeader title="Perfil Operacional" />
      <View style={{ marginBottom: 16 }}>{renderBadge()}</View>
      
      {!isEditing && profile && (
        <MotionSectionCard>
          <View style={styles.universeContainer}>
            <View style={[styles.universeIndicator, { backgroundColor: getUniverseAccent(profile.universe) }]} />
            <Text style={styles.universeLabel}>{profile.universe ?? 'Matriz Inespecífica'}</Text>
          </View>

          <View style={styles.grid}>
            <MotionMetaRow label="Foco Diretor (Objetivo)" value={profile.operational.currentGoal.value} />
            <MotionMetaRow label="Amplitude Semanal (Disponibilidade)" value={`${profile.operational.weeklyAvailability.value} dias de cobertura`} />
            <MotionMetaRow label="Natureza (Ambiente Base)" value={profile.operational.trainingEnvironment.value} />
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(true)}
            style={styles.editButton}
          >
             <Text style={styles.editButtonText}>Afinar Perímetro Operacional</Text>
          </TouchableOpacity>
        </MotionSectionCard>
      )}

      {!isEditing && !profile && (
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>A mapear contexto orgânico da shell raíz...</Text>
        </View>
      )}

      {isEditing && <MotionSetupScreen onClose={() => setIsEditing(false)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  universeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  universeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  universeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  grid: {
    gap: 16,
    marginBottom: 24,
  },
  editButton: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  editButtonText: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 14,
  }
});
