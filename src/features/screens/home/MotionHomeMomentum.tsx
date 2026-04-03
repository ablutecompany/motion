import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useMotionTheme } from '../../../theme/useMotionTheme';

export const MotionHomeMomentum = ({ viewModel, onNavigate }: any) => {
  const theme = useMotionTheme();
  const { evolutionPercentage, supportCopy } = viewModel.momentumMetrics;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.pageBg }]} showsVerticalScrollIndicator={false}>
      
      {/* Circle Banner Estilizado Momentum */}
      <View style={styles.bannerContainer}>
         <View style={[styles.circleGlow, { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary }]} />
         <Text style={[styles.percentage, { color: theme.colors.textMain }]}>{evolutionPercentage}%</Text>
         <Text style={[styles.label, { color: theme.colors.textSecondary }]}>DO PLANO CONCLUÍDO</Text>
      </View>

      <Text style={[styles.intro, { color: theme.colors.textMain }]}>A ganhar terreno.</Text>
      <Text style={[styles.support, { color: theme.colors.textSecondary }]}>{supportCopy}</Text>

      <TouchableOpacity 
         style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
         onPress={() => onNavigate('session')}
      >
         <Text style={[styles.actionText, { color: '#ffffff' }]}>Continuar Progresso</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  bannerContainer: { height: 300, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', borderRadius: 32, marginBottom: 32 },
  circleGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, opacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 60, elevation: 20 },
  percentage: { fontSize: 72, fontWeight: '300', letterSpacing: -2 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 2, marginTop: 8 },
  intro: { fontSize: 32, fontWeight: '400', letterSpacing: -1, marginBottom: 12 },
  support: { fontSize: 16, lineHeight: 24, marginBottom: 40 },
  actionBtn: { padding: 20, borderRadius: 20, alignItems: 'center' },
  actionText: { fontSize: 16, fontWeight: '600' }
});
