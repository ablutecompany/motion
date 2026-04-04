import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert, Platform } from 'react-native';
import { Power } from 'lucide-react';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { storeActions, useMotionStore, selectors } from '../../store/useMotionStore';
import { MotionSurfaceCard } from '../components/MotionUI';
import { trackEvent, MotionEvents } from '../../analytics/events';

// Pictogramas Customizados Minimalistas
const SixPackIcon = ({ size, color }: { size: number, color: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
     <View style={{ width: size * 0.7, flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {[1,2,3,4,5,6].map(i => (
           <View key={i} style={{ width: size * 0.3, height: size * 0.2, backgroundColor: color, borderRadius: 4, opacity: 0.85 }} />
        ))}
     </View>
  </View>
);

const BridgeIcon = ({ size, color }: { size: number, color: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
    <View style={{ width: size * 0.75, height: size * 0.35, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderWidth: 3, borderBottomWidth: 0, borderColor: color, position: 'absolute', bottom: size * 0.25 }} />
    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, position: 'absolute', bottom: size * 0.15, right: size * 0.05 }} />
    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: size * 0.15, left: size * 0.05 }} />
  </View>
);

export const MotionNeutralEntry: React.FC = () => {
  const theme = useMotionTheme();
  const profile = useMotionStore(selectors.selectMotionProfile);
  const [isPaired, setIsPaired] = React.useState(false);
  const [showRecommendation, setShowRecommendation] = React.useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    let timer: any;
    if (isPaired) {
      timer = setTimeout(() => setShowRecommendation(true), 2000);
    } else {
      setShowRecommendation(false);
    }
    return () => clearTimeout(timer);
  }, [isPaired]);

  const handleSelectMode = (universe: 'Balance' | 'Momentum' | 'Performance Boost') => {
    if (!isPaired) {
      if (Platform.OS === 'web') {
        window.alert('Ative a partilha de dados');
      } else {
        Alert.alert('Emparelhamento Necessário', 'Active a partilha de dados');
      }
      
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 150, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 150, useNativeDriver: true })
      ]).start();
      
      return;
    }
    storeActions.setBootData({ universe });
    trackEvent('motion_neutral_entry_completed', { universe });
  };

  // Recomedação baseada no contexto operacional
  let recommended = 'Balance';
  if (profile?.operational?.currentGoal?.value === 'hipertrofia' || profile?.operational?.currentGoal?.value === 'força') {
    recommended = 'Performance Boost';
  } else if (profile?.operational?.weeklyAvailability?.value && profile.operational.weeklyAvailability.value > 3) {
    recommended = 'Momentum';
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>
      
      <View style={{ paddingTop: 4, paddingHorizontal: 24, paddingBottom: 0 }}>
        {/* Toggle Emparelhamento */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 80 }}>
          <Animated.Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.textSecondary, marginRight: 10, letterSpacing: -0.2, opacity: blinkAnim }}>
            emparelhar dados ablute_wellness
          </Animated.Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setIsPaired(!isPaired)}
            style={{ width: 52, height: 28, borderRadius: 14, backgroundColor: isPaired ? theme.colors.primary : '#94a3b8', padding: 2, justifyContent: 'center' }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2, transform: [{ translateX: isPaired ? 24 : 0 }] }} />
          </TouchableOpacity>
        </View>

        <Text style={[theme.typography.label, { marginBottom: 8, fontSize: 16 }]}>CONFIGURAÇÃO INICIAL</Text>
        <Text style={[theme.typography.hero, { fontSize: 36, lineHeight: 42 }]}>3 experiências distintas</Text>
        <Text style={[theme.typography.body, { marginTop: 16, color: theme.colors.textSecondary, fontSize: 18, lineHeight: 26 }]}>
          Personalize o modo de uso da app, aceitando a recomendação atual para si. Pode alterar quando quiser.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: 40, paddingBottom: 64 }}>
         {/* Balance */}
         <TouchableOpacity 
            activeOpacity={isPaired ? 0.8 : 1}
            onPress={() => handleSelectMode('Balance')}
            style={[styles.modeCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, opacity: isPaired ? 1 : 0.6 }]}
         >
           {showRecommendation && recommended === 'Balance' && <View style={[styles.recBadge, { backgroundColor: theme.colors.primary }]}><Text style={[styles.recText, { color: theme.colors.pageBg }]}>Recomendado</Text></View>}
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
             <BridgeIcon size={28} color={isPaired ? "#0284c7" : "#94a3b8"} />
             <Text style={[styles.balTitle, { marginBottom: 0 }, !isPaired && { color: '#94a3b8' }]}>Balance</Text>
           </View>
           <Text style={[styles.balDesc, !isPaired && { color: '#94a3b8' }]}>Controlo, suporte orgânico e recuperação ativa. O sistema vai priorizar equilibrio e agilidade, alinhando o seu plano ao seu reporte.</Text>
         </TouchableOpacity>

         {/* Momentum */}
         <TouchableOpacity 
            activeOpacity={isPaired ? 0.8 : 1}
            onPress={() => handleSelectMode('Momentum')}
            style={[styles.modeCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, opacity: isPaired ? 1 : 0.6 }]}
         >
           {showRecommendation && recommended === 'Momentum' && <View style={[styles.recBadge, { backgroundColor: theme.colors.primary }]}><Text style={[styles.recText, { color: theme.colors.pageBg }]}>Recomendado</Text></View>}
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
             <Power size={28} color={isPaired ? "#059669" : "#94a3b8"} />
             <Text style={[styles.momTitle, { marginBottom: 0 }, !isPaired && { color: '#94a3b8' }]}>Momentum</Text>
           </View>
           <Text style={[styles.momDesc, !isPaired && { color: '#94a3b8' }]}>Evolução e praticidade. O sistema ajusta-se na fluidez da tua motivação, valorizando a progressão e a % de consistência.</Text>
         </TouchableOpacity>

         {/* Performance Boost */}
         <TouchableOpacity 
            activeOpacity={isPaired ? 0.8 : 1}
            onPress={() => handleSelectMode('Performance Boost')}
            style={[styles.modeCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, opacity: isPaired ? 1 : 0.6 }]}
         >
           {showRecommendation && recommended === 'Performance Boost' && <View style={[styles.recBadge, { backgroundColor: theme.colors.primary }]}><Text style={[styles.recText, { color: theme.colors.pageBg }]}>Recomendado</Text></View>}
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
             <SixPackIcon size={28} color={isPaired ? "#dc2626" : "#94a3b8"} />
             <Text style={[styles.perfTitle, { marginBottom: 0 }, isPaired ? { backgroundImage: 'linear-gradient(90deg, #111111 10%, #ff0000 65%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: '#94a3b8', backgroundImage: 'none', WebkitTextFillColor: 'initial' }] as any}>Performance Boost</Text>
           </View>
           <Text style={[styles.perfDesc, !isPaired && { color: '#94a3b8' }]}>Foco estrito em métrica e tensão estrutural. Para momentos onde o planeamento agressivo toma o controlo. (Gráfico Histórico)</Text>
         </TouchableOpacity>
      </View>

      <View style={{ padding: 24, marginTop: 16 }}>
        <Text style={[theme.typography.caption, { textAlign: 'center', opacity: 0.6 }]}>Esta aplicação usa dados do ecossistema-mãe ablute_ wellness. A sua utilização compreende a aceitação de partilha de informação.</Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modeCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative'
  },
  recBadge: {
    position: 'absolute',
    top: -10,
    right: 24,
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  recText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  balTitle: { fontSize: 28, fontWeight: '400', color: '#0284c7', marginBottom: 8 },
  balDesc: { fontSize: 16, color: '#0369a1', lineHeight: 24 },

  momTitle: { fontSize: 28, fontWeight: '500', color: '#059669', marginBottom: 8 },
  momDesc: { fontSize: 16, color: '#047857', lineHeight: 24 },

  perfTitle: { fontSize: 28, fontWeight: '800', color: '#dc2626', marginBottom: 8 },
  perfDesc: { fontSize: 16, color: '#991b1b', lineHeight: 24 },
});
