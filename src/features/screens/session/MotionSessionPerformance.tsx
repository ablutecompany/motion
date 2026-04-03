import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useMotionTheme } from '../../../theme/useMotionTheme';

export const MotionSessionPerformance = ({ session, runtimeCore, uiModel, onComplete }: any) => {
  const theme = useMotionTheme();

  // Active Block extraction
  const activeBlockIndex = runtimeCore.blocks.findIndex((b: any) => b.status === 'active');
  const activeBlock = runtimeCore.blocks[activeBlockIndex > -1 ? activeBlockIndex : 0];
  const totalBlocks = runtimeCore.blocks.length;
  
  const isRunning = runtimeCore.runtimeState.sessionStatus === 'running';
  const [seconds, setSeconds] = useState(0); 
  const MAX_SECONDS = (session?.durationMinutes || 45) * 60;

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s: number) => Math.min(s + 1, MAX_SECONDS));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, MAX_SECONDS]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderRing = (progress: number, size: number, stroke: number) => {
     const radius = size / 2;
     const p = Math.max(0, Math.min(1, progress));
     const rightRot = Math.min(p * 360, 180);
     const leftRot = Math.max(p * 360 - 180, 0);

     return (
       <View style={[styles.effortRingGlow, { width: size, height: size, borderRadius: radius, shadowColor: theme.colors.primary }]}>
         {/* Fundo outline base */}
         <View style={{ position: 'absolute', width: size, height: size, borderRadius: radius, borderWidth: stroke, borderColor: theme.colors.outline, opacity: 0.5 }} />

         {/* Mascara Direita */}
         <View style={{ position: 'absolute', width: radius, height: size, right: 0, overflow: 'hidden' }}>
            <View style={{ width: size, height: size, borderRadius: radius, borderWidth: stroke, borderBottomColor: theme.colors.primary, borderLeftColor: theme.colors.primary, borderTopColor: 'transparent', borderRightColor: 'transparent', position: 'absolute', right: 0, transform: [{ rotate: '-45deg' }, { rotate: `${rightRot}deg` }] }} />
         </View>

         {/* Mascara Esquerda */}
         <View style={{ position: 'absolute', width: radius, height: size, left: 0, overflow: 'hidden' }}>
            <View style={{ width: size, height: size, borderRadius: radius, borderWidth: stroke, borderTopColor: theme.colors.primary, borderRightColor: theme.colors.primary, borderBottomColor: 'transparent', borderLeftColor: 'transparent', position: 'absolute', left: 0, transform: [{ rotate: '-45deg' }, { rotate: `${leftRot}deg` }] }} />
         </View>
       </View>
     );
  };

  // Mocking "Reps" since runtimeCore currently only handles "blocks". 
  // In a real scenario, this comes from activeBlock.reps / activeBlock.targetReps.
  const currentRep = isRunning ? Math.floor((seconds % 30) / 3) : 0; // Fake pacing for reps
  const targetReps = 12;
  
  const currentSet = activeBlockIndex > -1 ? activeBlockIndex + 1 : 1;
  const targetSets = totalBlocks > 0 ? totalBlocks : 4;
  
  // Extract block title "Flexões" and type "Peitorais"
  // Assuming format like "Peitorais: Flexões" or standard.
  const exerciseName = activeBlock?.title || "Mobi-Flow";
  const exerciseType = activeBlock?.guidanceText?.split(' ')[0] || "TÁTICO";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.pageBg }]} showsVerticalScrollIndicator={false}>
      
      {/* Hero Reimaginado com Relógio e Medidor (Cockpit View) */}
      <View style={[styles.heroBlock, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, overflow: 'visible' }]}>
         
         <View style={styles.topInfo}>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20', borderLeftColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{exerciseType.toUpperCase()}</Text>
            </View>
            <Text style={[styles.clockText, { color: theme.colors.primary }]}>
              REPS: {currentRep}/{targetReps}  |  SÉRIE: {currentSet}/{targetSets}
            </Text>
         </View>

         <View style={styles.heroLayout}>
           {/* Left text column */}
           <View style={{ flex: 1, justifyContent: 'center' }}>
             <Text style={[styles.metaText, { color: theme.colors.textSecondary, marginBottom: 4 }]}>EXERCÍCIO</Text>
             <Text style={[styles.heroHeadline, { color: theme.colors.textMain }]}>{exerciseName.toUpperCase()}</Text>
             <Text style={[styles.metaText, { color: theme.colors.primary, marginTop: 12 }]}>■ {activeBlock?.status === 'active' ? 'EM EXECUÇÃO' : 'AGUARDAR'}</Text>
           </View>

           {/* Right Data column: BIG CLOCK RING with Glow */}
           <View style={styles.meterWrapper}>
             <TouchableOpacity activeOpacity={0.8} onPress={() => {
                if(isRunning) runtimeCore.actions.pauseSession();
                else runtimeCore.actions.resumeSession();
             }}>
               
               {renderRing(seconds / MAX_SECONDS, 140, 6)}
               
               <View style={styles.effortCenterLabel}>
                 <Text style={[styles.effortValue, { color: theme.colors.textMain }]}>{formatTime(seconds)}</Text>
                 <Text style={[styles.effortUnit, { color: isRunning ? theme.colors.textMain : theme.colors.primary }]}>
                   {isRunning ? 'EM CURSO' : 'TOCAR P/ PAUSAR'}
                 </Text>
               </View>
             </TouchableOpacity>
           </View>
         </View>

         {/* Bottom Action / Status Bar */}
         <View style={styles.bottomBar}>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>MEDIDOR DE ESFORÇO: <Text style={{ color: theme.colors.textMain }}>ALTO</Text></Text>
            <View style={{ flexDirection: 'row', gap: 2 }}>
               {Array.from({ length: targetSets }).map((_, i) => (
                 <View key={i} style={[styles.mechBar, { backgroundColor: i < currentSet ? theme.colors.primary : theme.colors.outline }]} />
               ))}
            </View>
         </View>
      </View>

      {/* Control Actions / Guidance */}
      <View style={{ gap: 16, marginBottom: 32, marginTop: 24 }}>
          {activeBlock?.guidanceText && (
             <Text style={[styles.supportCopy, { color: theme.colors.textSecondary, borderLeftColor: theme.colors.outline }]}>{activeBlock.guidanceText}</Text>
          )}

         <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={runtimeCore.actions.resumeSession} style={[styles.metricCard, { flex: 1, backgroundColor: isRunning ? theme.colors.primaryBg: theme.colors.cardBg, borderColor: theme.colors.outline }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>Passo Atual</Text>
              <Text style={[styles.metricValue, { color: theme.colors.textMain, marginTop: 8 }]}>Avançar</Text>
            </TouchableOpacity>
            {uiModel.confirmationReady && (
              <TouchableOpacity onPress={onComplete} style={[styles.metricCard, { flex: 1, backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }]}>
                <Text style={[styles.metricLabel, { color: theme.colors.success }]}>Checkpoint</Text>
                <Text style={[styles.metricValue, { color: theme.colors.success, marginTop: 8 }]}>Terminar</Text>
              </TouchableOpacity>
            )}
         </View>
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 12 },
  heroBlock: { minHeight: 340, borderRadius: 24, borderWidth: 1, padding: 24, justifyContent: 'space-between', marginBottom: 8 },
  topInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderLeftWidth: 2 },
  badgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: '800', letterSpacing: 1 },
  clockText: { fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  heroLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  heroHeadline: { fontSize: 32, fontWeight: '500', fontStyle: 'italic', letterSpacing: 2, lineHeight: 34, marginTop: 4 },
  metaText: { fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  meterWrapper: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  effortRingGlow: { position: 'absolute', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 },
  effortCenterLabel: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  effortValue: { fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  effortUnit: { fontSize: 8, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 2, textAlign: 'center' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24 },
  mechBar: { width: 12, height: 12, transform: [{ skewX: '-15deg' }] },
  supportCopy: { fontSize: 13, fontFamily: 'monospace', lineHeight: 20, marginBottom: 24, paddingLeft: 16, borderLeftWidth: 2 },
  metricCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  metricLabel: { fontSize: 9, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  metricValue: { fontSize: 24, fontWeight: '900' }
});
