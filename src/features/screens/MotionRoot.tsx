import React, { useEffect, useState } from 'react';
import { useMotionTheme } from '../../theme/useMotionTheme';
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
import { MotionNeutralEntry } from './MotionNeutralEntry';
import { trackEvent, MotionEvents } from '../../analytics/events';

interface MotionRootProps {
  rawShellContext: any; 
}

export const MotionRoot: React.FC<MotionRootProps> = ({ rawShellContext }) => {
  const isBooted = useMotionStore(selectors.selectIsBooted);
  const universe = useMotionStore(selectors.selectUniverse);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home'|'plan'|'session'|'progress'|'profile'|'context'>('home'); 
  const theme = useMotionTheme();

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
    <View style={[styles.root, { 
       backgroundColor: theme.colors.pageBg,
       ...(!universe && { backgroundImage: 'linear-gradient(to bottom, #e2e8f0 0%, #ffffff 100%)' })
    } as any]}>
      {/* HEADER PREMIUM */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity 
          style={styles.brandRow} 
          activeOpacity={0.7} 
          onPress={() => universe && setActiveTab('home')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Kinetic Typography Trail (Efeito Subtil de Velocidade Direcional) */}
            <View style={{ position: 'relative' }}>
              <Text style={[theme.typography.title, { position: 'absolute', left: -5, opacity: 0.08, letterSpacing: -1, fontSize: 24, fontStyle: 'italic', fontWeight: '900', color: theme.colors.textMain }]}>_motion</Text>
              <Text style={[theme.typography.title, { position: 'absolute', left: -2, opacity: 0.2, letterSpacing: -1, fontSize: 24, fontStyle: 'italic', fontWeight: '900', color: theme.colors.textMain }]}>_motion</Text>
              
              <Text style={[theme.typography.title, { letterSpacing: -1, fontSize: 24, fontStyle: 'italic', fontWeight: '900', color: theme.colors.textMain }]}>_motion</Text>
            </View>

            {universe === 'Momentum' && <View style={[styles.universeDot, { backgroundColor: theme.colors.accent }]} />}
            {universe === 'Performance Boost' && <View style={[styles.universeDot, { backgroundColor: theme.colors.accent }]} />}
            {universe === 'Balance' && <View style={[styles.universeDot, { backgroundColor: theme.colors.accent }]} />}
          </View>
        </TouchableOpacity>
        
        {/* Ícone de Perfil no Topo Direita */}
        {universe && (
          <TouchableOpacity 
            style={[styles.profileIcon, { backgroundColor: activeTab === 'profile' ? theme.colors.primary : theme.colors.surfaceLow }]} 
            onPress={() => setActiveTab(activeTab === 'profile' ? 'home' : 'profile')}
          >
            <Text style={{ color: activeTab === 'profile' ? theme.colors.ctaPrimaryText : theme.colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1 }}>EU</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotionDemoBanner />
        <MotionHistoryContextBanner />
        <MotionPermissionsBanner />
        
        {/* Pilha de Navegação: Botão Voltar genérico se não for Home */}
        {activeTab !== 'home' && activeTab !== 'profile' && (
           <TouchableOpacity 
             style={[styles.backButton, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]} 
             onPress={() => setActiveTab('home')}
           >
             <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>← Voltar à Visão Geral</Text>
           </TouchableOpacity>
        )}

        <View style={styles.contentArea}>
          {!universe ? (
            <MotionNeutralEntry />
          ) : (
            <>
              {activeTab === 'home' && <MotionHome onNavigate={(t: any) => setActiveTab(t)} />}
              {activeTab === 'profile' && <MotionProfileScreen />}
              {activeTab === 'plan' && <MotionPlanScreen />}
              {activeTab === 'session' && <MotionSessionScreen />}
              {activeTab === 'progress' && <MotionProgressScreen />}
              {activeTab === 'context' && <MotionContextScreen />}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  universeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    marginTop: 6
  },
  brandRow: {
    flexDirection: 'column',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 24
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
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
