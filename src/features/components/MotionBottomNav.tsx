import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { ClipboardList, Settings, Zap, BarChart2, Lightbulb } from 'lucide-react';
import { useMotionTheme } from '../../theme/useMotionTheme';

interface MotionBottomNavProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const MotionBottomNav: React.FC<MotionBottomNavProps> = ({ activeTab, onTabPress }) => {
  const theme = useMotionTheme();

  return (
    <View style={[styles.dockBar, { backgroundColor: theme.colors.pageBg, borderTopColor: theme.colors.outline }]}>
      <TouchableOpacity style={styles.dockItem}>
        <ClipboardList size={28} color={theme.colors.textSecondary} />
        <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Plano</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dockItem} onPress={() => onTabPress('Config')}>
        <Settings size={28} color={activeTab === 'Config' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.dockText, { color: activeTab === 'Config' ? theme.colors.primary : theme.colors.textSecondary, fontWeight: activeTab === 'Config' ? '800' : 'normal' }]}>Conf</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dockItem} onPress={() => onTabPress('Treino')}>
        <Zap size={28} color={activeTab === 'Treino' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.dockText, { color: activeTab === 'Treino' ? theme.colors.primary : theme.colors.textSecondary, fontWeight: activeTab === 'Treino' ? '800' : 'normal' }]}>Treino</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dockItem} onPress={() => onTabPress('Métricas')}>
        <BarChart2 size={28} color={activeTab === 'Métricas' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.dockText, { color: activeTab === 'Métricas' ? theme.colors.primary : theme.colors.textSecondary, fontWeight: activeTab === 'Métricas' ? '800' : 'normal' }]}>Métricas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dockItem}>
        <Lightbulb size={28} color={theme.colors.textSecondary} />
        <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Sugestões</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dockBar: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 100,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  dockItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 6,
    opacity: 0.9
  },
  dockText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5
  }
});
