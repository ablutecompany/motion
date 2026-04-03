import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useMotionTheme } from '../../../theme/useMotionTheme';
import supinoBg from '../../../assets/supino_reto.png';
import { useMotionStore, selectors } from '../../../store/useMotionStore';
import { useMotionExecutionRuntimeFacade } from '../../../facades/useMotionExecutionRuntimeFacade';
import { useMotionKinematicsFacade } from '../../../facades/useMotionKinematicsFacade';

export const MotionHomePerformance = ({ viewModel, onNavigate }: any) => {
  const theme = useMotionTheme();

  // Obter Sessão Corrente
  const plan = useMotionStore(selectors.selectPlan);
  const implicitSession = plan?.sessions?.find(s => !s.completed) ?? plan?.sessions?.[0];
  const runtimeCore = useMotionExecutionRuntimeFacade(implicitSession?.id || 's1');

  // Active Block Extraction
  const activeBlockIndex = runtimeCore.blocks.findIndex((b: any) => b.status === 'active');
  const activeBlock = runtimeCore.blocks[activeBlockIndex > -1 ? activeBlockIndex : 0];
  const totalBlocks = runtimeCore.blocks.length;

  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0); 
  const [isHighPrecision, setIsHighPrecision] = useState(true);
  const [weightRecommended, setWeightRecommended] = useState(65);
  const MAX_SECONDS = (implicitSession?.durationMinutes || 45) * 60;
  
  // -------------------------------------------------------------
  // KINEMATICS ENGINE (O "Conta-Rotações")
  // -------------------------------------------------------------
  const kinematics = useMotionKinematicsFacade(isRunning);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s: number) => Math.min(s + 1, MAX_SECONDS));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, MAX_SECONDS]);

  const lastPressRef = useRef(0);
  const handleClockPress = () => {
    const time = new Date().getTime();
    const delta = time - lastPressRef.current;
    
    if (delta > 0 && delta < 400) {
      // Duplo clique detectado: Reset Relógio
      setSeconds(0);
      setIsRunning(false);
      lastPressRef.current = 0;
      runtimeCore.actions.pauseSession();
    } else {
      // Clique simples: Inicia / Pausa
      if (isRunning) {
        setIsRunning(false);
        runtimeCore.actions.pauseSession();
      } else {
        setIsRunning(true);
        runtimeCore.actions.resumeSession();
      }
      lastPressRef.current = time;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getEffortColor = () => {
     if (!kinematics.isAvailable) return theme.colors.outline;
     switch (kinematics.effortState) {
        case 'redline': return '#ff4757'; // Coral quente intenso, não erro crítico
        case 'high': return '#ffa502';    // Tangerina quente
        case 'medium': return theme.colors.primary; // Cyan Base vivo
        case 'low': 
        default: return theme.colors.primary + '80'; // Cyan discreto/apagado
     }
  };

  const renderRing = (effortValue: number, size: number, stroke: number) => {
     const radius = size / 2;
     // Escala de esforço 0.0 - 1.0 (onde 100 max = 1.0)
     const progress = effortValue / 100;
     const p = Math.max(0, Math.min(1, progress));
     const rightRot = Math.min(p * 360, 180);
     const leftRot = Math.max(p * 360 - 180, 0);
     
     const activeColor = getEffortColor();

     return (
       <View style={[styles.effortRingGlow, { width: size, height: size, borderRadius: radius, shadowColor: activeColor, transform: [{ rotate: '180deg' }] }]}>
         <View style={{ position: 'absolute', width: size, height: size, borderRadius: radius, borderWidth: stroke, borderColor: theme.colors.outline, opacity: 0.3 }} />

         <View style={{ position: 'absolute', width: radius, height: size, right: 0, overflow: 'hidden' }}>
            <View style={{ width: size, height: size, borderRadius: radius, borderWidth: stroke, borderTopColor: activeColor, borderRightColor: activeColor, borderBottomColor: 'transparent', borderLeftColor: 'transparent', position: 'absolute', right: 0, transform: [{ rotate: `${-135 + rightRot}deg` }] }} />
         </View>

         <View style={{ position: 'absolute', width: radius, height: size, left: 0, overflow: 'hidden' }}>
            <View style={{ width: size, height: size, borderRadius: radius, borderWidth: stroke, borderTopColor: activeColor, borderRightColor: activeColor, borderBottomColor: 'transparent', borderLeftColor: 'transparent', position: 'absolute', left: 0, transform: [{ rotate: `${45 + leftRot}deg` }] }} />
         </View>
       </View>
     );
  };

  const currentRep = isRunning ? Math.floor((seconds % 30) / 3) : 0; 
  const targetReps = 12;
  const currentSet = activeBlockIndex > -1 ? activeBlockIndex + 1 : 1;
  const targetSets = totalBlocks > 0 ? totalBlocks : 4;
  
  // Para efeitos estritos de simulação de mockup tático solicitado:
  const exerciseName = "Supino Reto";
  const exerciseGroup = "Peitoral Geral / Médio";
  const exerciseDetails = "(Barra ou Halteres)";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.pageBg }]} showsVerticalScrollIndicator={false}>
      
      {/* Cockpit Principal: Cartão de Apresentação */}
      <View style={[styles.heroBlock, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, minHeight: 'auto', position: 'relative', overflow: 'hidden' }]}>
         
         {/* Background Atético Full-Bleed do Cartão */}
         <Image 
            source={supinoBg}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.3, resizeMode: 'cover' }}
         />
         <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(circle, transparent 20%, ${theme.colors.cardBg} 95%)` } as any} />

         {/* Conteúdo Textual Frontal */}
         <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, zIndex: 10 }}>
            <View style={styles.topInfo}>
               <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20', borderLeftColor: theme.colors.primary }]}>
                 <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{exerciseGroup.toUpperCase()}</Text>
               </View>
            </View>

            <View style={styles.heroLayout}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroHeadline, { color: theme.colors.textMain }]}>{exerciseName.toUpperCase()}</Text>
                <Text style={[{ fontSize: 18, color: theme.colors.primary, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 4 }]}>
                   {exerciseDetails}
                </Text>
                
                {isRunning && <Text style={[styles.metaText, { color: theme.colors.primary, marginTop: 12 }]}>■ EM EXECUÇÃO</Text>}
              </View>
            </View>
         </View>
      </View>

      {/* Relógio Cinético Livre de Cartão */}
      <View style={{ marginVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
         <View style={[styles.meterWrapper, { width: 260, height: 260 }]}>
           <TouchableOpacity activeOpacity={0.8} onPress={handleClockPress}>
             {renderRing(kinematics.effortValue, 260, 10)}
             <View style={[styles.effortCenterLabel, { width: 260, height: 260 }]}>
               <Text style={[styles.effortValue, { color: theme.colors.primary, fontSize: 64, lineHeight: 68 }]}>{formatTime(seconds)}</Text>
               <Text style={[styles.effortUnit, { color: theme.colors.primary, marginTop: 8 }]}>
                 {isRunning ? 'EM CURSO' : 'TOCAR/INICIAR'}
               </Text>
             </View>
           </TouchableOpacity>
           
           {kinematics.isSimulated && isRunning && (
              <Text style={{ fontSize: 14, color: theme.colors.warning, position: 'absolute', bottom: -24, fontFamily: 'monospace', fontWeight: 'bold' }}>MOCK SENSOR</Text>
           )}
           {kinematics.source === 'unsupported' && isRunning && (
              <Text style={{ fontSize: 14, color: theme.colors.textSecondary, position: 'absolute', bottom: -24, fontFamily: 'monospace', fontWeight: 'bold' }}>S/ SENSOR DETETADO</Text>
           )}
         </View>

         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', marginTop: 40 }}>
            <Text style={[styles.metaText, { color: theme.colors.textSecondary, letterSpacing: 2, fontSize: 14 }]}>
               PESO RECOMENDADO <Text style={{ color: theme.colors.textMain, fontSize: 18 }}> {weightRecommended}KG</Text>
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 24 }}>
               <TouchableOpacity onPress={() => setWeightRecommended((w: number) => Math.max(0, w - 2.5))}>
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: 28, fontWeight: '300' }]}>-</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setWeightRecommended((w: number) => w + 2.5)}>
                  <Text style={[styles.metaText, { color: theme.colors.primary, fontSize: 28, fontWeight: '300' }]}>+</Text>
               </TouchableOpacity>
            </View>
         </View>
      </View>


      {/* Cartões Adicionais Convertidos em Dashboards de Desempenho Físico */}
      <View style={{ gap: 16, marginBottom: 32 }}>
         <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={[styles.metricCard, { flex: 1, backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>REPETIÇÕES</Text>
              <Text style={[styles.metricValue, { color: theme.colors.textMain, marginTop: 8, fontSize: 32 }]}>
                 {currentRep}/{targetReps}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 16, flexWrap: 'wrap' }}>
                 {Array.from({ length: targetReps }).map((_, i) => (
                   <View key={i} style={[styles.mechBar, { width: 12, height: 12, backgroundColor: i < currentRep ? theme.colors.primary : theme.colors.outline }]} />
                 ))}
              </View>
            </View>

            <View style={[styles.metricCard, { flex: 1, backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>SÉRIES</Text>
              <Text style={[styles.metricValue, { color: theme.colors.primary, marginTop: 8, fontSize: 32 }]}>
                 {currentSet}/{targetSets}
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                 {Array.from({ length: targetSets }).map((_, i) => (
                   <View key={i} style={[styles.mechBar, { width: 28, height: 28, backgroundColor: i < currentSet ? theme.colors.primary : theme.colors.outline }]} />
                 ))}
              </View>
            </View>
         </View>
      </View>

      {isHighPrecision ? (
         <Text style={[styles.supportCopy, { color: theme.colors.textSecondary, borderLeftColor: theme.colors.outline }]}>
            Neste exercício deve prender o seu telemóvel no braço, uma vez que é nele que se fará maior força e movimento.
         </Text>
      ) : (
         <Text style={[styles.supportCopy, { color: theme.colors.primary, borderLeftColor: theme.colors.primary }]}>
            O dispositivo não precisa de estar ancorado ao músculo, mas as leituras cinéticas perdem fidelidade matemática.
         </Text>
      )}

      <TouchableOpacity 
         style={[styles.mainButton, { backgroundColor: isHighPrecision ? theme.colors.cardBg : theme.colors.primary, borderWidth: isHighPrecision ? 1 : 0, borderColor: theme.colors.primary }]}
         onPress={() => setIsHighPrecision(!isHighPrecision)}
      >
         <Text style={[styles.buttonText, { color: isHighPrecision ? theme.colors.primary : theme.colors.pageBg }]}>
            {isHighPrecision ? "DESATIVAR PRECISÃO MÁXIMA" : "ATIVAR PRECISÃO MÁXIMA"}
         </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 22, paddingHorizontal: 16 }}>
         {isHighPrecision 
            ? "Acionando esta opção o telemóvel não precisará ser mudado de local no corpo (e.g. pode ficar no bolso), mas perderá a precisão da medição de simetria e cinética."
            : "Acionando esta opção ativará o radar cinético 3D, exigindo que o dispositivo esteja fixo com braçadeira no local de esforço."
         }
      </Text>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 12 },
  heroBlock: { borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  topInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderLeftWidth: 2 },
  badgeText: { fontSize: 16, fontFamily: 'monospace', fontWeight: '800', letterSpacing: 1 },
  clockText: { fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  heroLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  heroHeadline: { fontSize: 32, fontWeight: '500', fontStyle: 'italic', letterSpacing: 2, lineHeight: 34 },
  metaText: { fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 1 },
  meterWrapper: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  effortRingGlow: { position: 'absolute', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 },
  effortCenterLabel: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  effortValue: { fontSize: 56, fontWeight: '300', letterSpacing: -2, lineHeight: 60 },
  effortUnit: { fontSize: 16, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 4, textAlign: 'center', letterSpacing: 1 },
  bottomBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 32 },
  mechBar: { width: 12, height: 12, transform: [{ skewX: '-15deg' }] },
  supportCopy: { fontSize: 18, fontFamily: 'monospace', lineHeight: 24, marginVertical: 24 },
  metricCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  metricLabel: { fontSize: 16, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  metricValue: { fontSize: 24, fontWeight: '900' },
  mainButton: { padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }
});
