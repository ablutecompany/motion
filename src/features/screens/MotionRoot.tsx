import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useMotionStore, storeActions, selectors } from '../../store/useMotionStore';
import { MotionDemoBanner, MotionHistoryContextBanner, MotionPermissionsBanner } from '../components/MotionBanners';
import { adaptShellContext } from '../../integration/shellContextAdapter';
import { hostBridge } from '../../integration/hostBridge';
import { buildMotionProfile } from '../../services/motionProfileBuilder';
import { derivePlanFromContext } from '../../resolvers/activeAnalysisResolver';
import { MotionHome } from './MotionHome';
import { MotionContextScreen } from './MotionContext';
import { MotionPlanScreen } from './MotionPlan';
import { MotionProgressScreen } from './MotionProgress';
import { MotionProfileScreen } from './MotionProfile';
import { MotionSessionScreen } from './MotionSession';
import { trackEvent, MotionEvents } from '../../analytics/events';

interface MotionRootProps {
  rawShellContext: any; 
}

export const MotionRoot: React.FC<MotionRootProps> = ({ rawShellContext }) => {
  const isBooted = useMotionStore(selectors.selectIsBooted);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home'|'plan'|'session'|'progress'|'profile'|'context'>('profile'); // Focado de base no Profile para testes lógicos

  useEffect(() => {
    try {
      const adapted = adaptShellContext(rawShellContext || {});
      const profile = buildMotionProfile(adapted);
      const plan = derivePlanFromContext(profile, adapted);

      storeActions.setBootData({
        uiOperational: { isBooted: true, setupSyncState: 'idle' },
        universe: profile.universe,
        phase: plan.targetPhase,
        plan: plan,
        motionProfile: profile,
        integration: {
          isDemoActive: adapted.isDemo,
          isHistoryModeActive: adapted.isHistory,
          shellSyncStatus: adapted.isPartial ? 'error' : 'synced'
        },
        activeContext: adapted.activeContext,
        permissions: adapted.permissions
      });
      
      // Validações concluídas, manifest injetado e bridge disponível. Anuncia ciclo.
      hostBridge.notifyAppReady();

    } catch (err: any) {
      setError(err.message);
      trackEvent(MotionEvents.FALLBACK_SHOWN, { reason: err.message });
    }
  }, [rawShellContext]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Configuração Sistémica Estagnada</Text>
        <Text style={styles.errorDesc}>Houve um impedimento de interpretação originário no adaptador.</Text>
        <Text style={styles.errorCode}>{error}</Text>
      </View>
    );
  }

  if (!isBooted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>A estabelecer coesão analítica basal...</Text>
      </View>
    );
  }

  const navTab = (id: typeof activeTab, label: string) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(id)}
      style={[styles.tab, activeTab === id && styles.tabActive]}
    >
      <Text style={[styles.tabText, activeTab === id && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandSubtitle}>ablute_ wellness ecossistema</Text>
          <Text style={styles.brandTitle}>_motion app</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotionDemoBanner />
        <MotionHistoryContextBanner />
        <MotionPermissionsBanner />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll}>
          <View style={styles.navRow}>
            {navTab('profile', 'Perfil Operacional')}
            {navTab('home', 'Visão Geral')}
            {navTab('plan', 'Plano Atual')}
            {navTab('session', 'Sessão')}
            {navTab('progress', 'Progresso')}
            {navTab('context', 'Shell/Debug')}
          </View>
        </ScrollView>

        <View style={styles.contentArea}>
          {activeTab === 'profile' && <MotionProfileScreen />}
          {activeTab === 'home' && <MotionHome />}
          {activeTab === 'plan' && <MotionPlanScreen />}
          {activeTab === 'session' && <MotionSessionScreen />}
          {activeTab === 'progress' && <MotionProgressScreen />}
          {activeTab === 'context' && <MotionContextScreen />}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f4f6', 
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  brandRow: {
    flexDirection: 'column',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 16,
  },
  navScroll: {
    marginBottom: 20,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4, 
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  contentArea: {
    paddingBottom: 40,
  },
  errorContainer: {
    padding: 24,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    margin: 16,
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorDesc: {
    color: '#7f1d1d',
    marginBottom: 12,
  },
  errorCode: {
    fontFamily: 'monospace',
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    color: '#7f1d1d',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  }
});
