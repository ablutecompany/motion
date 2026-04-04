import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { 
  HeroSummaryModel,
  BodyMapModel,
  TrainingProfileModel,
  LongitudinalModel,
  ConsistencyModel,
  PlanComparisonModel,
  WellnessRelationModel,
  HighlightsModel
} from '../../contracts/metricsModels';
import { BodyMap3DViewModel } from '../../services/motionBodyMap3DService';
import { MotionBodyViewer3D } from './MotionBodyViewer3D';
import { Target, CalendarDays, Maximize, BrainCircuit, Dumbbell, Award, Flame, Workflow, Info } from 'lucide-react';

type VisualState = 'preview' | 'data-light' | 'full';

export const MotionMetricsHero = ({ summary, period, onSwitchWindow, visualState, universe }: { summary: HeroSummaryModel | null, period: string, onSwitchWindow: (w: any) => void, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 12 : universe?.id === 'momentum' ? 4 : 8;

  return (
    <View style={styles.section}>
      <View style={[styles.filterRow, { backgroundColor: theme.colors.surfaceLow }]}>
        {(['1d', '7d', '12w', 'all'] as const).map(w => {
           const label = w === '1d' ? 'HOJE' : w === '7d' ? 'SEMANA' : w === '12w' ? 'TRIMESTRE' : 'TOTAL';
           const isActive = period === w;
           return (
            <TouchableOpacity 
              key={w} 
              onPress={() => onSwitchWindow(w)}
              style={[styles.filterBtn, isActive && { backgroundColor: theme.colors.primary + '1A' }]} 
            >
              <Text style={[styles.filterTxt, { color: isActive ? theme.colors.primary : theme.colors.textMain, opacity: isActive ? 1 : 0.4 }]}>
                {label}
              </Text>
            </TouchableOpacity>
           );
        })}
      </View>

      <View style={[styles.heroWideCard, isPreview && styles.previewOp, { borderRadius: radius, borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceLow, flexDirection: 'column', alignItems: 'stretch', gap: 24 }]}>
        
        {/* Top 3 Metrics */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>Sessões</Text>
            <View style={styles.rowBase}>
              <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>{summary?.totalSessions || 0}</Text>
              {summary && <Text style={[styles.techLabelXxs, { color: theme.colors.primary }]}>+ OP</Text>}
            </View>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>Volume</Text>
            <View style={styles.rowBase}>
              <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>{summary?.totalDurationMinutes || 0}</Text>
              <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>MIN</Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>Média</Text>
            <View style={styles.rowBase}>
              <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>
                {summary?.totalSessions ? Math.round(summary.totalDurationMinutes / summary.totalSessions) : 0}
              </Text>
              <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>MIN/S</Text>
            </View>
          </View>
        </View>

        {/* Perfil de Esforço ProgressBar */}
        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceHigh }}>
          <View style={[styles.rowBetweenCenter, { marginBottom: 12 }]}>
            <Text style={[
              styles.techLabelXxs, 
              { color: summary?.isBeastMode ? '#FF3366' : theme.colors.textMain }
             ]}>
              {summary?.isBeastMode ? 'BEAST MODE UNLOCK' : 'Perfil de Esforço'}
             </Text>
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.techLabelXxs, { color: summary?.isBeastMode ? '#FF3366' : theme.colors.textSecondary }]}>
                 {summary?.effortScore || 0} / {summary?.effortTarget || 0} PTS
               </Text>
            </View>
          </View>

          {/* Effort Bar Indicator */}
          <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceHigh, overflow: 'hidden' }}>
             <View style={{ 
                width: `${Math.min(100, Math.max(5, ((summary?.effortScore || 0) / Math.max(1, (summary?.effortTarget || 1))) * 100))}%`, 
                height: '100%', 
                backgroundColor: summary?.isBeastMode ? '#FF3366' : theme.colors.primary,
                borderRadius: 3 
              }} />
          </View>
          
          <View style={[styles.rowBetweenCenter, { marginTop: 8 }]}>
             <Text style={{ fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, opacity: 0.5, letterSpacing: 0.5 }}>LEVE</Text>
             <Text style={{ fontSize: 9, fontWeight: '700', color: summary?.isBeastMode ? '#FF3366' : theme.colors.textMuted, opacity: summary?.isBeastMode ? 1 : 0.5, letterSpacing: 0.5 }}>100% OVERDRIVE</Text>
          </View>
        </View>

      </View>
    </View>
  );
};

export const MotionMetricsBodyMap = ({ bodyMap, bodyMap3D, visualState, universe, gender }: { bodyMap: BodyMapModel | null, bodyMap3D: BodyMap3DViewModel, visualState: VisualState, universe: any, gender: string }) => {
  const theme = useMotionTheme();
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 16 : universe?.id === 'momentum' ? 0 : 8;
  const isMomentum = universe?.id === 'momentum';

  return (
    <View style={[styles.mapContainer, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow, borderWidth: isMomentum ? 1 : 0, borderColor: theme.colors.outline }, isPreview && styles.previewOp]}>
      <View style={[styles.rowBetweenCenter, { marginBottom: 24, alignItems: 'flex-start' }]}>
         <View style={{ flex: 1, paddingRight: 16 }}>
           <Text style={[styles.techLabelXs, { color: theme.colors.textSecondary }]}>Dominância Corporal</Text>
           <Text style={{ fontSize: 11, color: theme.colors.textSecondary, opacity: 0.6, marginTop: 4 }}>Visualização de zonas de maior intensidade de trabalho</Text>
         </View>
         <Target color={theme.colors.textSecondary} size={16} style={{ opacity: 0.5, marginTop: 2 }} />
      </View>
      
      <View style={styles.mapVisualArea}>
        <MotionBodyViewer3D 
          gender={gender} 
          visualState={visualState} 
          universe={universe} 
          model3D={bodyMap3D} 
        />
      </View>

      <View style={{ marginTop: 32 }}>
         <Text style={[styles.techLabelXxs, { color: theme.colors.primary, marginBottom: 4 }]}>DOMINÂNCIA REGISTADA</Text>
         <Text style={[styles.headline, { color: theme.colors.textMain, fontSize: 16 }]}>{bodyMap3D?.dominantRegionLabel || 'Construção Carga'}</Text>
      </View>
    </View>
  );
};


export const MotionMetricsWorkoutProfile = ({ profile, visualState, universe }: { profile: TrainingProfileModel | null, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  if (!profile || profile.distributionByType.length === 0) return null;
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 16 : universe?.id === 'momentum' ? 0 : 8;

  return (
    <View style={[styles.section, isPreview && styles.previewOp]}>
      <View style={[styles.rowBetweenCenter, { marginBottom: 16 }]}>
        <Text style={[styles.techLabelXs, { color: theme.colors.textSecondary }]}>Perfil Frequente</Text>
      </View>
      
      <View style={[styles.profileContainer, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow }]}>
        {profile.distributionByType.map((item, i) => (
          <View key={item.id} style={styles.profileRow}>
            <View style={styles.rowBetweenCenter}>
              <Text style={[styles.techLabelXxs, { color: theme.colors.textMain }]}>{item.label}</Text>
              <Text style={[styles.metricValueXs, { color: theme.colors.textMain }]}>{item.percentage}%</Text>
            </View>
            <View style={[styles.stackedBarBg, { backgroundColor: theme.colors.surfaceHigh }]}>
               <View style={[styles.stackedBarFill, { backgroundColor: theme.colors.primary, width: `${item.percentage}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};


export const MotionMetricsLongitudinal = ({ model, visualState, universe }: { model: LongitudinalModel | null, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  if (!model) return null;
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 16 : universe?.id === 'momentum' ? 0 : 8;
  const barRadius = universe?.id === 'balance' ? 4 : universe?.id === 'momentum' ? 0 : 2;

  const max = Math.max(...model.temporalTrend.map(d => d.value), 1);
  return (
    <View style={[styles.section, isPreview && styles.previewOp]}>
      <View style={[styles.rowBetweenCenter, { marginBottom: 16 }]}>
         <Text style={[styles.techLabelXs, { color: theme.colors.textSecondary }]}>Volume e Progresso</Text>
      </View>

      <View style={[styles.longChartArea, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow }]}>
        <View style={styles.barGraphContainer}>
          {model.temporalTrend.map((col, idx) => {
            const heightPerc = (col.value / max) * 100;
            return (
              <View key={idx} style={styles.colContainer}>
                <View style={[styles.barWrapper, { backgroundColor: theme.colors.surfaceHigh, borderRadius: barRadius }]}>
                  <View style={[styles.barFillEvolution, { backgroundColor: theme.colors.primary, height: `${heightPerc}%`, borderRadius: barRadius, opacity: heightPerc === 100 ? 1 : 0.6 }]} />
                </View>
                <Text style={[styles.techLabelXxxs, { color: idx === model.temporalTrend.length -1 ? theme.colors.primary : theme.colors.textSecondary, marginTop: 12 }]}>{col.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};


export const MotionMetricsConsistency = ({ model, plan, visualState, universe }: { model: ConsistencyModel | null, plan: PlanComparisonModel | null, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  if (!model) return null;
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 16 : universe?.id === 'momentum' ? 0 : 8;

  const adherence = plan && plan.plannedSessions > 0 ? Math.round((plan.executedSessions / plan.plannedSessions) * 100) : 0;
  const consistencyBlocks = Array.from({length: 28}).map((_, i) => isPreview ? (Math.random() > 0.4 ? 1 : 0) : (i % 3 === 0 ? 0 : 1));

  return (
    <View style={[styles.twoColGrid, isPreview && styles.previewOp]}>
      <View style={[styles.consistCard, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow }]}>
        <View style={styles.rowBetweenCenter}>
            <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>Ritmo e Frequência</Text>
        </View>
        
        <View style={styles.heatmapGrid}>
          {consistencyBlocks.map((v, i) => (
             <View key={i} style={[styles.heatmapCell, { backgroundColor: v > 0 ? theme.colors.primary : theme.colors.surfaceHigh, opacity: v > 0 ? 1 : 0.3 }]} />
          ))}
        </View>

        <View style={styles.rowBase}>
          <Text style={[styles.metricValue, { color: theme.colors.textMain }]}>{model.currentStreak}</Text>
          <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary }]}>DIAS STREAK</Text>
        </View>
      </View>

      <View style={[styles.consistCard, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow, alignItems: 'center' }]}>
        <Text style={[styles.techLabelXxs, { color: theme.colors.textSecondary, alignSelf: 'flex-start' }]}>Execução vs Plano</Text>
        
        <View style={styles.ringContainer}>
          <View style={[styles.ringTrack, { borderColor: theme.colors.surfaceHigh }]} />
          <View style={[styles.ringFill, { borderColor: theme.colors.primary }]} />
          <Text style={[styles.metricValue, { color: theme.colors.textMain, fontSize: 18, position: 'absolute' }]}>{plan ? adherence : 0}%</Text>
        </View>
        
        <Text style={[styles.bodyText, { fontSize: 10, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
           {plan ? `${plan.executedSessions} de ${plan.plannedSessions} concluídas` : 'Esforço Contínuo'}
        </Text>
      </View>
    </View>
  );
};


export const MotionMetricsWellnessIntersection = ({ wellness, hasDataOverride, visualState, universe }: { wellness: WellnessRelationModel | null, hasDataOverride: boolean, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  if (!hasDataOverride || !wellness) return null;
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 12 : universe?.id === 'momentum' ? 0 : 8;

  return (
    <View style={[styles.wellnessCard, { borderRadius: radius, backgroundColor: theme.colors.surfaceHigh, borderLeftColor: theme.colors.accent }, isPreview && styles.previewOp]}>
      <View style={[styles.rowBetweenCenter, { marginBottom: 16 }]}>
        <View style={styles.rowGapXxs}>
            <Workflow color={theme.colors.accent} size={14} />
            <Text style={[styles.techLabelXs, { color: theme.colors.accent }]}>Treino & Sinais Vitais</Text>
        </View>
      </View>

      <View style={styles.wellnessRelationsBox}>
        {wellness.associations.map(a => (
            <View key={a.id} style={styles.wellnessRow}>
            <View style={[styles.wellnessDot, { backgroundColor: theme.colors.accent }]} />
            <Text style={[styles.bodyText, { color: theme.colors.textMain, flex: 1, fontSize: 13, lineHeight: 20 }]}>
                {a.narrative}
            </Text>
            </View>
        ))}
      </View>

      <View style={[styles.twoColGrid, { marginBottom: 0, marginTop: 16 }]}>
        <View style={[styles.wellnessSubCard, { borderRadius: radius, backgroundColor: theme.colors.pageBg }]}>
           <Text style={[styles.techLabelXxxs, { color: theme.colors.textSecondary }]}>Sinal Principal</Text>
           <Text style={[styles.metricValueXs, { color: theme.colors.accent, marginTop: 4 }]}>Extraído</Text>
        </View>
        <View style={[styles.wellnessSubCard, { borderRadius: radius, backgroundColor: theme.colors.pageBg }]}>
           <Text style={[styles.techLabelXxxs, { color: theme.colors.textSecondary }]}>Estado Base</Text>
           <Text style={[styles.metricValueXs, { color: theme.colors.textMain, marginTop: 4 }]}>Vigente</Text>
        </View>
      </View>
    </View>
  );
};


export const MotionMetricsHighlights = ({ highlights, visualState, universe }: { highlights: HighlightsModel | null, visualState: VisualState, universe: any }) => {
  const theme = useMotionTheme();
  if (!highlights || (!highlights.longestSession && !highlights.mostFrequentType)) return null;
  const isPreview = visualState === 'preview';
  const radius = universe?.id === 'balance' ? 12 : universe?.id === 'momentum' ? 0 : 8;

  return (
    <View style={[styles.section, { paddingBottom: 16 }, isPreview && styles.previewOp]}>
      <Text style={[styles.techLabelXs, { color: theme.colors.textSecondary, marginBottom: 16 }]}>Marcos Visíveis</Text>
      
      <View style={styles.gapY}>
        {highlights.longestSession && (
          <View style={[styles.highlightRow, { borderRadius: radius, backgroundColor: theme.colors.surfaceLow }]}>
             <View style={[styles.highlightIcon, { backgroundColor: theme.colors.primary + '1A', borderRadius: radius / 1.5 }]}>
                <Award color={theme.colors.primary} size={24} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.headline, { color: theme.colors.textMain, fontSize: 14 }]}>Maior Sessão Contínua</Text>
                <Text style={[styles.bodyText, { color: theme.colors.textSecondary, fontSize: 12 }]}>{highlights.longestSession.value} {highlights.longestSession.label}</Text>
             </View>
          </View>
        )}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  section: { marginBottom: 32 },
  rowBetweenCenter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBase: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rowGapXs: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  rowGapXxs: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  gapY: { gap: 16 },
  twoColGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  
  previewOp: { opacity: 0.8 },
  previewBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  previewBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // Typography matches
  metricValue: { fontFamily: 'sans-serif', fontWeight: '800', letterSpacing: -1, fontSize: 30 },
  metricValueXs: { fontFamily: 'sans-serif', fontWeight: '800', fontSize: 12 },
  techLabelXs: { fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 12 },
  techLabelXxs: { fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 },
  techLabelXxxs: { fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 8 },
  headline: { fontFamily: 'sans-serif', fontWeight: '800', fontSize: 20 },
  bodyText: { fontFamily: 'sans-serif', fontWeight: '400', fontSize: 14, lineHeight: 22 },

  // Hero
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderRadius: 8, marginBottom: 24 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  filterTxt: { fontFamily: 'sans-serif', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 10 },
  heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  heroCard: { flex: 1, minWidth: '30%', padding: 20, gap: 12 },
  heroWideCard: { width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },

  // Body Map Visuals Backed by Local Generated Artifacts
  mapContainer: { padding: 28, overflow: 'hidden' },
  mapVisualArea: { flexDirection: 'row', justifyContent: 'center', height: 260, alignItems: 'center' },
  meshContainer: { position: 'relative', width: 220, height: '100%', justifyContent: 'center', alignItems: 'center' },
  abstractVector: { position: 'absolute' },
  hotspotGlow: { position: 'absolute', borderRadius: 999, shadowOffset: {width: 0, height: 0}, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 30, filter: 'blur(10px)' as any },

  // Profile
  profileContainer: { padding: 24, gap: 24 },
  profileRow: { gap: 8 },
  stackedBarBg: { height: 4, width: '100%', borderRadius: 2 },
  stackedBarFill: { height: '100%', borderRadius: 2 },

  // Longitudinal
  tinyDot: { width: 8, height: 8, borderRadius: 4 },
  longChartArea: { height: 192, padding: 24 },
  barGraphContainer: { flexDirection: 'row', height: '100%', alignItems: 'flex-end', justifyContent: 'space-between' },
  colContainer: { flex: 1, alignItems: 'center', height: '100%' },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end', padding: 4, overflow: 'hidden' },
  barFillEvolution: { width: '100%' },

  // Consistency & Adherence
  consistCard: { flex: 1, padding: 20, gap: 16 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: '100%' },
  heatmapCell: { width: 12, height: 12, borderRadius: 2 },
  ringContainer: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  ringTrack: { width: '100%', height: '100%', borderRadius: 32, borderWidth: 4, position: 'absolute' },
  ringFill: { width: '100%', height: '100%', borderRadius: 32, borderWidth: 4, position: 'absolute', borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] },

  // Wellness Correlation
  wellnessCard: { padding: 24, borderLeftWidth: 4, marginBottom: 32 },
  wellnessRelationsBox: { gap: 16 },
  wellnessRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  wellnessDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  wellnessSubCard: { flex: 1, padding: 12, justifyContent: 'space-between' },

  // Highlights
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  highlightIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }
});
