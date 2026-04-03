import { useMemo } from 'react';
import { useMotionStore, selectors } from '../store/useMotionStore';
import { TextStyle, ViewStyle } from 'react-native';

export type MotionThemeTokens = {
  colors: {
    pageBg: string;
    cardBg: string;
    primary: string;
    primaryBg: string;
    accent: string;
    accentBg: string;
    textMain: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    success: string;
    successBg: string;
    error: string;
    errorBg: string;
    warning: string;
    warningBg: string;
    ctaPrimaryText: string;
    surfaceLow: string;
    surfaceHigh: string;
    outline: string;

    // --- Approved Explicit Palettes ---
    stone: Record<string, string>;
    sage: Record<string, string>;
    navy: Record<string, string>;
    cyan: Record<string, string>;
    slate: Record<string, string>;
    impulse: Record<string, string>;
    commercial: Record<string, string>;
  };
  metrics: {
    radiusCore: number;
    radiusCard: number;
    radiusPill: number;
    spacingX: number;
    spacingY: number;
  };
  typography: {
    hero: TextStyle;
    heroLabel: TextStyle;
    title: TextStyle;
    subtitle: TextStyle;
    label: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    fontFamilyBase: string; // Base font name to use for inline styles if needed
  };
  shadows: {
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
    momentum: ViewStyle;
  };
};

export const useMotionTheme = (): MotionThemeTokens => {
  const universe = useMotionStore(selectors.selectUniverse);

  return useMemo(() => {
    // 0. Base Paletas Aprovadas (Source of Truth)
    const palettes = {
      stone: { 50: '#fafafa', 100: '#f4f5f6', 200: '#e8ecef', 300: '#d5dadd' },
      sage: { 400: '#6b9c92', 600: '#4a7c73', 800: '#2d4b45', 900: '#1a2e2a' },
      navy: { 900: '#030509', 800: '#070b13', 700: '#152136', 600: '#1c283a', 500: '#2d3748' },
      cyan: { glow: '#00e5ff', muted: '#00e5ff99' },
      slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
      impulse: { 500: '#f97316', 600: '#ea580c' },
      commercial: { 400: '#8c95e0', 600: '#434ca5', 800: '#262b66', 900: '#23285c' },
    };

    // 1. NEUTRAL / DEFAULT (Fallback if not selected)
    let themeConfig = {
      pageBg: '#fefefe', 
      cardBg: '#ffffff',
      surfaceLow: '#f8f9fa',
      surfaceHigh: '#eef0f2',
      primary: '#333333',
      primaryBg: '#f5f5f5',
      accent: '#666666',
      accentBg: '#eaeaea',
      textMain: '#111111',
      textSecondary: '#555555',
      textMuted: '#888888',
      border: '#dddddd',
      outline: '#cccccc',
      radiusCore: 12,
      radiusCard: 24,
      fontFamilyBase: 'sans-serif'
    };

    // 2. BALANCE (Calma, Suave, Orgânico)
    if (universe === 'Balance') {
      themeConfig = {
        ...themeConfig,
        pageBg: palettes.stone[50], 
        cardBg: '#ffffff',
        surfaceLow: palettes.stone[100],
        surfaceHigh: palettes.stone[200],
        primary: palettes.sage[800],
        primaryBg: palettes.sage[600] + '1A',
        accent: palettes.sage[600],
        accentBg: palettes.stone[200],
        textMain: palettes.sage[900],
        textSecondary: palettes.sage[800],
        textMuted: palettes.sage[600],
        border: palettes.stone[200],
        outline: palettes.stone[300],
        radiusCore: 24, // 4xl
        radiusCard: 40, // 5xl organic
        fontFamilyBase: 'sans-serif' // Em HTML usávamos Outfit
      };
    }

    // 3. PERFORMANCE BOOST (Tensão, Afiado, Contraste Escuro)
    if (universe === 'Performance Boost') {
      themeConfig = {
        ...themeConfig,
        pageBg: palettes.navy[900],
        cardBg: palettes.navy[800],
        surfaceLow: palettes.navy[900],
        surfaceHigh: palettes.navy[700],
        primary: palettes.cyan.glow,
        primaryBg: palettes.cyan.glow + '1A',
        accent: palettes.cyan.glow,
        accentBg: palettes.navy[600],
        textMain: '#ffffff', // Crisp white
        textSecondary: palettes.slate[300],
        textMuted: palettes.slate[500],
        border: palettes.navy[700],
        outline: palettes.navy[600],
        radiusCore: 4,     // Sharp edges
        radiusCard: 8,     // Sharp edges
        fontFamilyBase: 'monospace' // Em HTML usávamos JetBrains Mono/Inter
      };
    }

    // 4. MOMENTUM (Continuidade, Progresso, Energia Clara)
    if (universe === 'Momentum') {
      themeConfig = {
        ...themeConfig,
        pageBg: palettes.slate[50],
        cardBg: '#ffffff',
        surfaceLow: palettes.slate[100],
        surfaceHigh: palettes.slate[200],
        primary: palettes.commercial[600],
        primaryBg: palettes.commercial[600] + '0D', // /5 opacity
        accent: palettes.impulse[500],
        accentBg: palettes.impulse[500] + '1A',
        textMain: palettes.slate[900],
        textSecondary: palettes.slate[700],
        textMuted: palettes.slate[400],
        border: palettes.slate[100],
        outline: palettes.slate[200],
        radiusCore: 24, // 1.5rem
        radiusCard: 32, // 2rem Flowing
        fontFamilyBase: 'sans-serif' // Em HTML usávamos Plus Jakarta Sans
      };
    }

    const baseColors = {
      ...themeConfig,
      ...palettes,
      success: '#10b981', successBg: '#ecfdf5',
      error: '#ba1a1a', errorBg: '#ffdad6',
      warning: '#f59e0b', warningBg: '#fffbeb',
      ctaPrimaryText: universe === 'Performance Boost' ? palettes.navy[900] : '#ffffff'
    };

    const isDark = universe === 'Performance Boost';

    return {
      colors: baseColors as any, // Cast to avoid deep nesting checks against the mapped type
      metrics: {
        radiusCore: themeConfig.radiusCore,
        radiusCard: themeConfig.radiusCard,
        radiusPill: 999,
        spacingX: 24,
        spacingY: 32,
      },
      typography: {
        hero: { fontSize: 36, fontWeight: '800', color: baseColors.textMain, letterSpacing: -1.2, fontFamily: themeConfig.fontFamilyBase },
        heroLabel: { fontSize: 11, fontWeight: '800', color: baseColors.accent, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace' },
        title: { fontSize: 20, fontWeight: '800', color: baseColors.textMain, letterSpacing: -0.5, textTransform: isDark ? 'uppercase' : 'none', fontFamily: themeConfig.fontFamilyBase },
        subtitle: { fontSize: 14, fontWeight: '500', color: baseColors.textSecondary, lineHeight: 20, fontFamily: themeConfig.fontFamilyBase },
        label: { fontSize: 10, fontWeight: '800', color: baseColors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: isDark ? 'monospace' : themeConfig.fontFamilyBase },
        body: { fontSize: 15, color: baseColors.textMain, lineHeight: 24, fontWeight: '500', fontFamily: themeConfig.fontFamilyBase },
        caption: { fontSize: 13, color: baseColors.textMuted, fontWeight: '500', fontFamily: themeConfig.fontFamilyBase },
        fontFamilyBase: themeConfig.fontFamilyBase
      },
      shadows: {
        sm: { shadowColor: isDark ? palettes.cyan.glow : '#191c1e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.03, shadowRadius: 8, elevation: 2 },
        md: { shadowColor: isDark ? palettes.cyan.glow : '#191c1e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 16, elevation: 8 },
        lg: { shadowColor: isDark ? palettes.cyan.glow : '#191c1e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 32, elevation: 12 },
        momentum: { shadowColor: '#434ca5', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 15 } // Especial para Momentum
      }
    };
  }, [universe]);
};
