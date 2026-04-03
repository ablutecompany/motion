import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useMotionTheme } from '../../theme/useMotionTheme';

export const MotionSectionHeader = ({ title, subtitle, style }: { title: string; subtitle?: string; style?: ViewStyle }) => {
  const theme = useMotionTheme();
  return (
    <View style={[{ marginBottom: theme.metrics.spacingY }, style]}>
      <Text style={theme.typography.title}>{title}</Text>
      {subtitle && <Text style={[theme.typography.subtitle, { marginTop: 4 }]}>{subtitle}</Text>}
    </View>
  );
};

export const MotionSurfaceCard = ({ children, style, noPadding, level = 'low' }: { children: React.ReactNode; style?: ViewStyle; noPadding?: boolean; level?: 'low' | 'high' | 'base' }) => {
  const theme = useMotionTheme();
  let bg = theme.colors.cardBg;
  if (level === 'low') bg = theme.colors.surfaceLow;
  if (level === 'high') bg = theme.colors.surfaceHigh;

  return (
    <View style={[
      styles.surfaceCard, 
      level === 'base' ? theme.shadows.md : null,
      { backgroundColor: bg, borderColor: theme.colors.border, borderRadius: theme.metrics.radiusCard, padding: noPadding ? 0 : theme.metrics.spacingX },
      style
    ]}>
      {children}
    </View>
  );
};

export const MotionHeroCard = ({ title, subtitle, overline, highlight, progress, children }: { title: string; subtitle?: string; overline?: string; highlight?: string; progress?: number; children?: React.ReactNode }) => {
  const theme = useMotionTheme();
  return (
    <View style={[
      styles.heroCard,
      theme.shadows.lg,
      { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.primary, borderLeftWidth: 4, borderRadius: theme.metrics.radiusCore }
    ]}>
      {/* Decorative pulse glow in background */}
      <View style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: theme.colors.primary, opacity: 0.05 }} />
      <View style={{ position: 'absolute', right: '10%', top: '20%', width: 300, height: 300, borderRadius: 150, backgroundColor: theme.colors.accent, opacity: 0.03 }} />
      
      <View style={{ flex: 1, zIndex: 10 }}>
         {overline && (
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
             <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginRight: 8 }} />
             <Text style={[theme.typography.heroLabel, { opacity: 0.8 }]}>{overline}</Text>
           </View>
         )}
         
         <Text style={[theme.typography.hero, { color: theme.colors.primary, fontSize: 44, lineHeight: 48, textTransform: 'uppercase' }]}>{title}</Text>
         {subtitle && <Text style={[theme.typography.title, { color: theme.colors.textSecondary, marginTop: 12, fontSize: 22, opacity: 0.9, maxWidth: '85%' }]}>{subtitle}</Text>}
         
         {(highlight || progress !== undefined) && (
           <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
             {highlight && <Text style={[theme.typography.hero, { color: theme.colors.textMain, fontSize: 56, lineHeight: 56 }]}>{highlight}</Text>}
             {progress !== undefined && (
               <View style={{ flex: 1, paddingBottom: 12 }}>
                 <View style={{ height: 4, backgroundColor: theme.colors.surfaceLow, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${progress}%`, backgroundColor: theme.colors.primary, borderRadius: 2 }} />
                 </View>
               </View>
             )}
           </View>
         )}
         {children && <View style={{ marginTop: 32 }}>{children}</View>}
      </View>
    </View>
  );
};

export const MotionPrimaryActionCard = ({ title, subtitle, iconLabel, onPress, isPrimary }: { title: string; subtitle: string; iconLabel?: string; onPress: () => void; isPrimary?: boolean }) => {
  const theme = useMotionTheme();
  const bg = isPrimary ? theme.colors.primaryBg : theme.colors.surfaceHigh;
  const tc = isPrimary ? theme.colors.primary : theme.colors.textMain;
  const sc = isPrimary ? theme.colors.textSecondary : theme.colors.textSecondary;
  const bc = isPrimary ? theme.colors.primary : theme.colors.border;
  
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.actionCard,
        theme.shadows.lg,
        { backgroundColor: bg, borderColor: bc, borderTopWidth: isPrimary ? 2 : 1, borderRadius: theme.metrics.radiusCore }
      ]}
    >
      {/* Decorative typographic watermark */}
      <Text style={{ position: 'absolute', top: -10, right: -10, fontSize: 140, fontWeight: '900', color: tc, opacity: 0.05, letterSpacing: -10 }} allowFontScaling={false}>
         {title.charAt(0).toUpperCase()}
      </Text>

      <View style={{ zIndex: 10, flex: 1, justifyContent: 'space-between' }}>
        <View>
          {iconLabel && <Text style={[theme.typography.label, { color: tc, letterSpacing: 4, marginBottom: 16 }]}>{iconLabel}</Text>}
          <Text style={[theme.typography.hero, { color: tc, fontSize: 32, lineHeight: 36, textTransform: 'uppercase' }]}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 32 }}>
          <Text style={[theme.typography.body, { color: sc, maxWidth: '75%', fontSize: 13, lineHeight: 20 }]}>{subtitle}</Text>
          <View style={[styles.actionCaret, { backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceLow }]}>
            <Text style={{ color: isPrimary ? theme.colors.primaryBg : theme.colors.textMain, fontWeight: '900', fontSize: 20 }}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const MotionStatusPill = ({ label, tone = 'neutral' }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'error' | 'passive' | 'neutral' }) => {
  const theme = useMotionTheme();
  let bg = theme.colors.surfaceLow; let color = theme.colors.textSecondary; let border = 'transparent';

  if (tone === 'primary') { bg = theme.colors.primaryBg; color = theme.colors.primary; border = bg; }
  if (tone === 'success') { bg = theme.colors.successBg; color = theme.colors.success; border = bg; }
  if (tone === 'warning') { bg = theme.colors.warningBg; color = theme.colors.warning; border = bg; }
  if (tone === 'error') { bg = theme.colors.errorBg; color = theme.colors.error; border = bg; }
  if (tone === 'passive') { bg = theme.colors.accentBg; color = theme.colors.accent; border = bg; }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg, borderColor: border, borderRadius: theme.metrics.radiusPill }]}>
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
};

export const MotionMetaRow = ({ label, value, isEnriched }: { label: string; value: string; isEnriched?: boolean }) => {
  const theme = useMotionTheme();
  return (
    <View style={[styles.metaRow, { borderColor: theme.colors.pageBg }]}>
      <Text style={[theme.typography.label, { textTransform: 'none' }]}>{label}</Text>
      <Text style={[theme.typography.body, { fontWeight: '600', color: isEnriched ? theme.colors.success : theme.colors.textMain }]}>{value}</Text>
    </View>
  );
};

export const MotionProfileIdentity = ({ title, subtitle, universe }: { title: string; subtitle?: string; universe: string }) => {
  const theme = useMotionTheme();
  return (
    <View style={styles.profileIdentityBox}>
      <View style={[styles.profileAvatarWrap, { borderColor: theme.colors.cardBg, backgroundColor: theme.colors.surfaceLow }]}>
         <Text style={{ fontSize: 40, color: theme.colors.primary, fontWeight: '800' }}>{title.charAt(0)}</Text>
      </View>
      <View style={{ transform: [{ translateY: -32 }]}}>
         <MotionStatusPill label={universe} tone="passive" />
      </View>
      <View style={{ alignItems: 'center', marginTop: -16 }}>
        <Text style={[theme.typography.hero, { color: theme.colors.textMain, fontSize: 24, marginBottom: 4 }]}>{title}</Text>
        {subtitle && <Text style={[theme.typography.body, { color: theme.colors.textSecondary, fontWeight: '600' }]}>{subtitle}</Text>}
      </View>
    </View>
  );
};

export const MotionUniverseSelectorCard = ({ 
  title, 
  subtitle, 
  isActive, 
  onPress 
}: { 
  title: string; 
  subtitle: string; 
  isActive?: boolean;
  onPress: () => void;
}) => {
  const theme = useMotionTheme();
  
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.universeSelector, 
        { 
          backgroundColor: isActive ? theme.colors.accentBg : theme.colors.surfaceLow,
          borderColor: isActive ? theme.colors.accent : 'transparent'
        }
      ]}
    >
       <View style={[styles.universeSelectorDot, { backgroundColor: isActive ? theme.colors.cardBg : theme.colors.primaryBg }]}>
          <Text style={{ color: isActive ? theme.colors.accent : theme.colors.primary, fontWeight: '800' }}>O</Text>
       </View>
       <View style={{ flex: 1 }}>
         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[theme.typography.title, { color: isActive ? theme.colors.accent : theme.colors.textMain }]}>{title}</Text>
            {isActive && <Text style={[theme.typography.label, { color: theme.colors.accent, fontSize: 10 }]}>ATUAL</Text>}
         </View>
         <Text style={[theme.typography.body, { color: isActive ? theme.colors.accent : theme.colors.textSecondary, marginTop: 4, fontSize: 13 }]}>{subtitle}</Text>
       </View>
    </TouchableOpacity>
  );
};

export const MotionInsightBentoCard = ({ value, label, unit }: { value: string | number; label: string; unit?: string }) => {
  const theme = useMotionTheme();
  return (
    <View style={[styles.bentoSquare, { backgroundColor: theme.colors.cardBg, ...theme.shadows.sm }]}>
      <Text style={{ fontSize: 24, color: theme.colors.primary }}>•</Text>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
           <Text style={[theme.typography.hero, { color: theme.colors.textMain, fontSize: 32 }]}>{value}</Text>
           {unit && <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginLeft: 4, fontWeight: '700' }]}>{unit}</Text>}
        </View>
        <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginTop: 4, fontSize: 10 }]}>{label}</Text>
      </View>
    </View>
  );
};

export const MotionSettingsRow = ({ label, isDestructive, onPress }: { label: string; isDestructive?: boolean; onPress: () => void; }) => {
  const theme = useMotionTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.settingsRow, { backgroundColor: theme.colors.surfaceLow }]}>
       <Text style={[theme.typography.body, { fontWeight: '700', color: isDestructive ? theme.colors.error : theme.colors.textMain }]}>{label}</Text>
       <Text style={{ color: isDestructive ? theme.colors.error : theme.colors.textMuted, fontWeight: '800' }}>→</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  surfaceCard: {
    borderWidth: 1,
    marginBottom: 20,
  },
  heroCard: {
    padding: 24,
    marginBottom: 24,
    minHeight: 200,
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'hidden'
  },
  actionCard: {
    borderWidth: 1,
    padding: 32,
    marginBottom: 16,
    minHeight: 240,
    overflow: 'hidden',
    position: 'relative'
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardText: {
    flex: 1,
  },
  actionIconPill: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  actionCaret: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center'
  },
  profileIdentityBox: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 16
  },
  profileAvatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 40,
    borderWidth: 4,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  universeSelector: {
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1
  },
  universeSelectorDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  bentoSquare: {
    flex: 1,
    aspectRatio: 1,
    padding: 24,
    borderRadius: 24,
    justifyContent: 'space-between'
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 4
  }
});
