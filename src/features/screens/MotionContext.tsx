import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';
import { MotionSectionHeader, MotionSectionCard, MotionMetaRow } from '../components/MotionUI';

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
      <MotionSectionHeader 
        title="Contexto Base"
        subtitle="Enquadramento semântico e estrutural fornecido pela Shell para esta instância ativa."
      />

      <MotionSectionCard style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Enquadramento Temporal</Text>
        <MotionMetaRow label="Modo de Resolução" value={isHistory ? 'Passado Ancorado (Read-Only)' : 'Presente (Dinâmico)'} />
        <MotionMetaRow label="Timestamp Vínculo" value={FormatDate(context.analysisDate)} />
        <MotionMetaRow label="ID Transacional" value={context.analysisId?.split('-').pop() ?? 'N/A'} />
      </MotionSectionCard>

      <MotionSectionCard style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Estado de Interação e Permissões</Text>
        <MotionMetaRow label="Ambiente" value={isDemo ? 'Sandbox Estanque (Upload Bloqueado)' : 'Produção Real (Ativa)'} />
        <MotionMetaRow label="Elegibilidade Root" value={context.motionEligibilityStatus.toUpperCase()} />
        <MotionMetaRow label="Sincronização Integrada" value={permissions && !isDemo && !isHistory ? 'Permitida' : 'Limitada num destes fatores (Demo/Histórico/Permissão restrita)'} />
      </MotionSectionCard>

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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginVertical: 8, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  fallbackBox: { padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#f3f4f6', marginTop: 8 },
  fallbackText: { color: '#6b7280', fontSize: 12, lineHeight: 18, textAlign: 'center' }
});
