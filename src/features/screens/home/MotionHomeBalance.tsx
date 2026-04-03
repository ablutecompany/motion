import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useMotionTheme } from '../../../theme/useMotionTheme';

export const MotionHomeBalance = ({ viewModel, onNavigate }: any) => {
  const theme = useMotionTheme();
  const { readinessLabel, supportCopy } = viewModel.balanceMetrics;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.pageBg }]} showsVerticalScrollIndicator={false}>
      
      <View style={{ paddingTop: 40, paddingBottom: 24 }}>
         <Text style={[styles.greeting, { color: theme.colors.textMain }]}>Prontidão Atual</Text>
         <Text style={[styles.headline, { color: theme.colors.primary }]}>{readinessLabel}</Text>
         <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{supportCopy}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline }]}>
         <View style={styles.cardHeader}>
            <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.cardTitle, { color: theme.colors.textMain }]}>Fase de Execução</Text>
         </View>
         <Text style={[styles.cardValue, { color: theme.colors.textMain }]}>{viewModel.phase || 'A Aguardar'}</Text>
         <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Fundação Operacional</Text>
      </View>

      <TouchableOpacity 
         style={[styles.button, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline }]}
         onPress={() => onNavigate('session')}
      >
         <Text style={[styles.buttonText, { color: theme.colors.textMain }]}>Iniciar Sessão Equilibrada</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  greeting: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  headline: { fontSize: 40, fontWeight: '700', letterSpacing: -1, marginBottom: 16 },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  card: { padding: 24, borderRadius: 24, borderWidth: 1, marginVertical: 32 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 13 },
  button: { padding: 20, borderRadius: 100, borderWidth: 1, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' }
});
