import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSetupScreen } from './MotionSetup';

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
      case 'dirty': 
        return <View style={[styles.badge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}><Text style={[styles.badgeText, { color: '#b45309' }]}>Ajuste aplicado ao plano atual</Text></View>;
      case 'syncing': 
        return <View style={[styles.badge, { backgroundColor: '#eff6ff', borderColor: '#3b82f6' }]}><Text style={[styles.badgeText, { color: '#1d4ed8' }]}>A sincronizar reestruturação</Text></View>;
      case 'synced': 
        return <View style={[styles.badge, { backgroundColor: '#ecfdf5', borderColor: '#10b981' }]}><Text style={[styles.badgeText, { color: '#047857' }]}>Integração base consolidada</Text></View>;
      case 'failed': 
        return <View style={[styles.badge, { backgroundColor: '#fdf2f8', borderColor: '#ec4899' }]}><Text style={[styles.badgeText, { color: '#be185d' }]}>Sincronização indisponível. Ajuste local contido.</Text></View>;
      case 'blocked_demo': 
        return <View style={[styles.badge, { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }]}><Text style={[styles.badgeText, { color: '#4b5563' }]}>Modo demo: ajuste apenas local garantido</Text></View>;
      case 'blocked_history': 
        return <View style={[styles.badge, { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }]}><Text style={[styles.badgeText, { color: '#4b5563' }]}>Histórico: edição parametral indisponível</Text></View>;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil Operacional</Text>
        {renderBadge()}
      </View>
      
      {!isEditing && profile && (
        <View style={styles.card}>
          <View style={styles.universeContainer}>
            <View style={[styles.universeIndicator, { backgroundColor: getUniverseAccent(profile.universe) }]} />
            <Text style={styles.universeLabel}>{profile.universe ?? 'Matriz Inespecífica'}</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.dataBlock}>
              <Text style={styles.dataLabel}>Foco Diretor (Objetivo)</Text>
              <Text style={styles.dataValue}>{profile.operational.currentGoal.value}</Text>
            </View>
            <View style={styles.dataBlock}>
              <Text style={styles.dataLabel}>Amplitude Semanal (Disponibilidade)</Text>
              <Text style={styles.dataValue}>{profile.operational.weeklyAvailability.value} dias de cobertura</Text>
            </View>
            <View style={styles.dataBlock}>
              <Text style={styles.dataLabel}>Natureza (Ambiente Base)</Text>
              <Text style={styles.dataValue}>{profile.operational.trainingEnvironment.value}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(true)}
            style={styles.editButton}
          >
             <Text style={styles.editButtonText}>Afinar Perímetro Operacional</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  badge: {
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
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
  dataBlock: {},
  dataLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
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
