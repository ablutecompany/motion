import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';

export const MotionContextScreen: React.FC = () => {
  const isHistory = useMotionStore(selectors.selectIsHistory);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const context = useMotionStore(selectors.selectActiveContext);
  const permissions = useMotionStore(selectors.selectHasWritePermission);

  useEffect(() => {
    trackEvent(MotionEvents.CONTEXT_VIEWED);
  }, []);

  const getStatusColor = (v: string) => {
    if (v === 'eligible') return '#059669';
    if (v === 'limited') return '#d97706';
    return '#4b5563';
  };

  const FormatDate = (dateString: string | null) => {
    if (!dateString) return 'Referência Omisso';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT');
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Contexto Base</Text>
        <Text style={styles.subtitle}>Enquadramento semântico e estrutural fornecido pela Shell para esta instância ativa.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Enquadramento Temporal</Text>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Modo de Resolução</Text>
          <Text style={styles.dataValue}>{isHistory ? 'Passado Ancorado (Read-Only)' : 'Presente (Dinâmico)'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Timestamp Vínculo</Text>
          <Text style={styles.dataValue}>{FormatDate(context.analysisDate)}</Text>
        </View>
        <View style={styles.dataRowNoBorder}>
          <Text style={styles.dataLabel}>ID Transacional</Text>
          <Text style={styles.dataValueMono}>{context.analysisId?.split('-').pop() ?? 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estado de Interação e Permissões</Text>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Ambiente</Text>
          <Text style={styles.dataValue}>{isDemo ? 'Sandbox Estanque (Upload Bloqueado)' : 'Produção Real (Ativa)'}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Elegibilidade Root</Text>
          <Text style={[styles.dataValue, { color: getStatusColor(context.motionEligibilityStatus) }]}>
            {context.motionEligibilityStatus.toUpperCase()}
          </Text>
        </View>
        <View style={styles.dataRowNoBorder}>
          <Text style={styles.dataLabel}>Sincronização Integrada</Text>
          <Text style={[styles.dataValue, { color: permissions && !isDemo && !isHistory ? '#059669' : '#dc2626' }]}>
            {permissions && !isDemo && !isHistory ? 'Permitida' : 'Limitada num destes fatores (Demo/Histórico/Permissão restrita)'}
          </Text>
        </View>
      </View>

      {(!context.analysisId && !isDemo) && (
        <View style={styles.fallbackBox}>
          <Text style={styles.fallbackText}>Alguns dados base encontram-se temporariamente limitados. A interface operará na robustez primária dos módulos _offline_.</Text>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500', lineHeight: 18 },

  card: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginVertical: 8, marginBottom: 16 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6', marginBottom: 12 },
  dataRowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 4 },
  
  dataLabel: { fontSize: 13, color: '#4b5563', fontWeight: '600', flexShrink: 0, paddingRight: 16 },
  dataValue: { fontSize: 13, color: '#111827', fontWeight: '500', textAlign: 'right', flexShrink: 1, flexWrap: 'wrap' },
  dataValueMono: { fontSize: 13, color: '#6b7280', fontWeight: '500', textAlign: 'right', fontFamily: 'monospace' },

  fallbackBox: { padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6', marginTop: 8 },
  fallbackText: { color: '#6b7280', fontSize: 12, lineHeight: 18, textAlign: 'center' }
});
