import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const MotionColors = {
  primary: '#2563eb',
  primaryBg: '#eff6ff',
  success: '#10b981',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  error: '#ef4444',
  errorBg: '#fef2f2',
  passive: '#ec4899',
  passiveBg: '#fdf2f8',
  textMain: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  cardBg: '#ffffff',
  pageBg: '#f9fafb'
};

interface HeaderProps { title: string; subtitle?: string; style?: ViewStyle }
export const MotionSectionHeader: React.FC<HeaderProps> = ({ title, subtitle, style }) => (
  <View style={[styles.headerBox, style]}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

interface CardProps { children: React.ReactNode; style?: ViewStyle }
export const MotionSectionCard: React.FC<CardProps> = ({ children, style }) => (
  <View style={[styles.sectionCard, style]}>
    {children}
  </View>
);

interface PillProps { label: string; tone?: 'primary' | 'success' | 'warning' | 'error' | 'passive' | 'neutral' }
export const MotionStatusPill: React.FC<PillProps> = ({ label, tone = 'neutral' }) => {
  let bg = '#f3f4f6';
  let color = '#374151';
  let border = '#d1d5db';

  if (tone === 'primary') { bg = MotionColors.primaryBg; color = MotionColors.primary; border = '#bfdbfe'; }
  if (tone === 'success') { bg = MotionColors.successBg; color = MotionColors.success; border = '#a7f3d0'; }
  if (tone === 'warning') { bg = MotionColors.warningBg; color = MotionColors.warning; border = '#fde68a'; }
  if (tone === 'error') { bg = MotionColors.errorBg; color = MotionColors.error; border = '#fca5a5'; }
  if (tone === 'passive') { bg = MotionColors.passiveBg; color = MotionColors.passive; border = '#fbcfe8'; }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
};

interface MetaProps { label: string; value: string; isEnriched?: boolean }
export const MotionMetaRow: React.FC<MetaProps> = ({ label, value, isEnriched }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={[styles.metaValue, isEnriched && { color: MotionColors.success }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  headerBox: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: MotionColors.textMain, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: MotionColors.textSecondary, fontWeight: '500', lineHeight: 22 },

  sectionCard: {
    backgroundColor: MotionColors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MotionColors.border,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6'
  },
  metaLabel: {
    fontSize: 13,
    color: MotionColors.textMuted,
    fontWeight: '600'
  },
  metaValue: {
    fontSize: 14,
    color: MotionColors.textMain,
    fontWeight: '700'
  }
});
