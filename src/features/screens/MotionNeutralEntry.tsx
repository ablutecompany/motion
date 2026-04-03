import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useMotionTheme } from '../../theme/useMotionTheme';
import { storeActions, useMotionStore, selectors } from '../../store/useMotionStore';
import { MotionSurfaceCard } from '../components/MotionUI';
import { trackEvent, MotionEvents } from '../../analytics/events';

export const MotionNeutralEntry: React.FC = () => {
  const theme = useMotionTheme();
  const profile = useMotionStore(selectors.selectMotionProfile);

  const handleSelectMode = (universe: string) => {
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.pageBg }]} showsVerticalScrollIndicator={false}>
      
      <View style={{ padding: 24, marginTop: 40, marginBottom: 24 }}>
        <Text style={[theme.typography.label, { marginBottom: 8 }]}>CONFIGURAÇÃO INICIAL</Text>
        <Text style={[theme.typography.hero, { fontSize: 32, lineHeight: 38 }]}>O teu contexto dita o perfil da interação.</Text>
        <Text style={[theme.typography.body, { marginTop: 16, color: theme.colors.textSecondary }]}>
          A tua atividade física externa já foi importada. Para que o ecossistema reaja corretamente, precisamos de definir a postura (Modo) com que queres interagir connosco com base no teu ambiente atual.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24 }}>
         {/* Balance */}
         <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleSelectMode('Balance')}
            style={[styles.modeCard, { backgroundColor: '#ffffff', borderColor: '#e8ecef', shadowColor: '#191c1e' }]}
         >
           {recommended === 'Balance' && <View style={styles.recBadge}><Text style={styles.recText}>Recomendado</Text></View>}
           <Text style={styles.balTitle}>Balance</Text>
           <Text style={styles.balDesc}>Controlo, suporte orgânico e recuperação ativa. O sistema vai priorizar qualidade e alinhamento face à tração.</Text>
         </TouchableOpacity>

         {/* Momentum */}
         <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleSelectMode('Momentum')}
            style={[styles.modeCard, { backgroundColor: '#ffffff', borderColor: '#e2e8f0', shadowColor: '#434ca5' }]}
         >
           {recommended === 'Momentum' && <View style={styles.recBadge}><Text style={styles.recText}>Recomendado</Text></View>}
           <Text style={styles.momTitle}>Momentum</Text>
           <Text style={styles.momDesc}>Fluidez e evolução. O sistema converte os teus treinos frequentes numa narrativa de impacto de ciclo (% evolução de consistência).</Text>
         </TouchableOpacity>

         {/* Performance Boost */}
         <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => handleSelectMode('Performance Boost')}
            style={[styles.modeCard, { backgroundColor: '#131c2b', borderColor: '#1c283a', shadowColor: '#00e5ff' }]}
         >
           {recommended === 'Performance Boost' && <View style={[styles.recBadge, { backgroundColor: '#00e5ff' }]}><Text style={[styles.recText, {color: '#131c2b'}]}>Recomendado</Text></View>}
           <Text style={styles.perfTitle}>Performance Boost</Text>
           <Text style={styles.perfDesc}>Foco estrito em métrica e tensão estrutural. Para momentos onde o planeamento agressivo toma o controlo. (Gráfico Histórico)</Text>
         </TouchableOpacity>
      </View>

      <View style={{ padding: 24, marginTop: 16 }}>
        <Text style={[theme.typography.caption, { textAlign: 'center', opacity: 0.6 }]}>*Podes alterar o perfil selecionado a qualquer momento a partir da área Perfil.</Text>
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
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  balTitle: { fontSize: 24, fontWeight: '400', color: '#1a2e2a', marginBottom: 8 },
  balDesc: { fontSize: 14, color: '#4a7c73', lineHeight: 20 },

  momTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  momDesc: { fontSize: 14, color: '#475569', lineHeight: 20 },

  perfTitle: { fontSize: 24, fontWeight: '900', color: '#ffffff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: -0.5 },
  perfDesc: { fontSize: 14, color: '#bac9cc', lineHeight: 20, fontFamily: 'monospace' },
});
