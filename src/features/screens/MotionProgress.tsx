import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { useMotionStore } from '../../store/useMotionStore';
import { useMotionMetricsFacade } from '../../facades/useMotionMetricsFacade';
import { Settings } from 'lucide-react';
import { 
  MotionMetricsHero, 
  MotionMetricsBodyMap, 
  MotionMetricsWorkoutProfile, 
  MotionMetricsLongitudinal, 
  MotionMetricsConsistency, 
  MotionMetricsWellnessIntersection, 
  MotionMetricsHighlights 
} from '../components/MotionMetricsViews';

class MetricsErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#ba1a1a', padding: 40, justifyContent: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>CRASH NO DASHBOARD</Text>
          <Text style={{ color: 'white', marginTop: 10 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return (this.props as any).children;
  }
}

const MetricsContent = () => {
  const theme = useMotionTheme();
  const { viewModel, setPeriod } = useMotionMetricsFacade();
  const universe = useMotionStore(s => s.universe) || { id: 'performance-boost' };
  const gender = useMotionStore(s => s.motionProfile?.structural?.gender) || 'male';

  useEffect(() => {
    trackEvent(MotionEvents.PROGRESS_VIEWED);
  }, []);

  return (
    <View style={[styles.superContainer, { backgroundColor: theme.colors.pageBg }]}>
      
      {/* TopAppBar - Fixed at top matching HTML design */}
      <View style={[styles.appBar, { backgroundColor: theme.colors.pageBg }]}>
        <View style={styles.appBarLeft}>
          <Text style={[styles.appBarTitle, { color: theme.colors.primary }]}>Métricas</Text>
        </View>
        <TouchableOpacity style={styles.appBarBtn}>
           <Settings color={theme.colors.primary} size={20} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <MotionMetricsHero 
          summary={viewModel.heroSummary} 
          period={viewModel.period} 
          onSwitchWindow={setPeriod} 
          visualState={viewModel.globalStates.visualState}
          universe={universe}
        />

        <View style={styles.modulesFlow}>          <MotionMetricsBodyMap bodyMap={viewModel.bodyMap} bodyMap3D={viewModel.bodyMap3D} visualState={viewModel.globalStates.visualState} universe={universe} gender={gender} />
          <MotionMetricsWorkoutProfile profile={viewModel.trainingProfile} visualState={viewModel.globalStates.visualState} universe={universe} />
          <MotionMetricsLongitudinal model={viewModel.longitudinal} visualState={viewModel.globalStates.visualState} universe={universe} />
          <MotionMetricsConsistency model={viewModel.consistency} plan={viewModel.planVsExecuted} visualState={viewModel.globalStates.visualState} universe={universe} />
          <MotionMetricsWellnessIntersection 
            wellness={viewModel.trainingWellnessRelations} 
            hasDataOverride={viewModel.globalStates.hasWellnessData} 
            visualState={viewModel.globalStates.visualState}
            universe={universe}
          />
          <MotionMetricsHighlights highlights={viewModel.highlights} visualState={viewModel.globalStates.visualState} universe={universe} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

export const MotionProgressScreen: React.FC = () => (
  <MetricsErrorBoundary>
    <MetricsContent />
  </MetricsErrorBoundary>
);

const styles = StyleSheet.create({
  superContainer: {
    flex: 1
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 50
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  appBarTitle: {
    fontFamily: 'sans-serif',
    fontWeight: '800',
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: -1
  },
  appBarBtn: {
    padding: 8
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modulesFlow: {
    gap: 32 // replaces all those marginBottom: 48 with a safer gap strategy
  },
  previewBanner: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  previewBannerText: {
    fontFamily: 'sans-serif',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  block: {
    marginBottom: 16
  }
});
