import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMotionStore, selectors } from '../../store/useMotionStore';
import { trackEvent, MotionEvents } from '../../analytics/events';

export const MotionDemoBanner: React.FC = () => {
  const isDemo = useMotionStore(selectors.selectIsDemo);
  
  useEffect(() => {
    if (isDemo) trackEvent(MotionEvents.DEMO_BANNER_SHOWN);
  }, [isDemo]);

  if (!isDemo) return null;
  
  return (
    <View style={[styles.banner, styles.demoTheme]}>
      <View style={styles.dotDemo} />
      <Text style={[styles.text, styles.demoText]}>Modo demo: alterações apenas locais.</Text>
    </View>
  );
};

export const MotionHistoryContextBanner: React.FC = () => {
  const isHistory = useMotionStore(selectors.selectIsHistory);

  useEffect(() => {
    if (isHistory) trackEvent(MotionEvents.HISTORY_CONTEXT_SHOWN);
  }, [isHistory]);

  if (!isHistory) return null;

  return (
    <View style={[styles.banner, styles.historyTheme]}>
      <View style={styles.dotHistory} />
      <Text style={[styles.text, styles.historyText]}>Histórico: visualização sem edição.</Text>
    </View>
  );
};

export const MotionPermissionsBanner: React.FC = () => {
  const hasPerms = useMotionStore(selectors.selectHasWritePermission);
  const isDemo = useMotionStore(selectors.selectIsDemo);
  const isHistory = useMotionStore(selectors.selectIsHistory);

  // Não mostra alerta de "sem permissão" se já for demo ou histórico (ambientes isolados por default)
  if (hasPerms || isDemo || isHistory) return null;

  return (
    <View style={[styles.banner, styles.errorTheme]}>
      <View style={styles.dotError} />
      <Text style={[styles.text, styles.errorText]}>Permissões restritas neste contexto. Edição bloqueada.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  text: { fontSize: 13, fontWeight: '600', flexShrink: 1 },

  dotDemo: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6b7280', marginRight: 10 },
  demoTheme: { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
  demoText: { color: '#374151' },

  dotHistory: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginRight: 10 },
  historyTheme: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  historyText: { color: '#1e40af' },

  dotError: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 10 },
  errorTheme: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  errorText: { color: '#991b1b' },
});
