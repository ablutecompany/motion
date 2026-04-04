import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { ClipboardList, Settings, Zap, BarChart2, Lightbulb } from 'lucide-react';
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
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [weightRecommended, setWeightRecommended] = useState(120);
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
    <View style={{ flex: 1, minHeight: '100vh', backgroundColor: theme.colors.pageBg }}>
      <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>
      
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
              </View>
            </View>
         </View>
      </View>



      {/* Relógio Cinético Livre de Cartão */}
      <View style={{ marginVertical: 48, alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
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

         <View style={{ alignSelf: 'stretch', marginTop: -40, alignItems: 'flex-start' }}>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: 16, letterSpacing: 1 }]}>
               CARGA{'\n'}RECOMENDADA
            </Text>
            
            <View style={{ marginTop: 2, alignItems: 'flex-start' }}>
               <Text style={{ color: theme.colors.textMain, fontSize: 24, fontWeight: '900' }}>
                  {weightRecommended} <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>KG</Text>
               </Text>
               
               <View style={{ flexDirection: 'row', gap: 6, height: 36, marginTop: 10, width: 90 }}>
                  <TouchableOpacity 
                     style={{ flex: 1, backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                     onPress={() => setWeightRecommended((w: number) => Math.max(0, w - 2.5))}
                  >
                     <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: 20, fontWeight: '400', marginTop: -2 }]}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                     style={{ flex: 1, backgroundColor: theme.colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                     onPress={() => setWeightRecommended((w: number) => w + 2.5)}
                  >
                     <Text style={[styles.metaText, { color: theme.colors.pageBg, fontSize: 20, fontWeight: '700', marginTop: -2 }]}>+</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
         
         {/* Telemetria Flutuante Absoluta: Canto Direito Total */}
         <View style={{ position: 'absolute', top: -30, right: 0, flexDirection: 'row', gap: 24, alignItems: 'flex-start' }}>
            {/* SÉRIES (Esquerda) */}
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: 16, letterSpacing: 1, marginBottom: 2 }]}>SÉRIE</Text>
               <Text style={{ color: theme.colors.primary, fontSize: 32, fontWeight: '900', marginBottom: 12 }}>{currentSet}<Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>/{targetSets}</Text></Text>
               <View style={{ flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: targetSets }).map((_, i) => (
                     <View key={i} style={{ width: 32, height: 8, backgroundColor: i < currentSet ? theme.colors.primary : theme.colors.outline, borderRadius: 3 }} />
                  ))}
               </View>
            </View>

            {/* REPS (Direita, antiga posição natural da série) */}
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: 16, letterSpacing: 1, marginBottom: 2 }]}>REPS</Text>
               <Text style={{ color: theme.colors.textMain, fontSize: 32, fontWeight: '900', marginBottom: 12 }}>{currentRep}<Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>/{targetReps}</Text></Text>
               <View style={{ flexDirection: 'column', gap: 5 }}>
                  {Array.from({ length: targetReps }).map((_, i) => (
                     <View key={i} style={{ width: 32, height: 6, backgroundColor: i < currentRep ? theme.colors.textMain : theme.colors.outline, borderRadius: 3 }} />
                  ))}
               </View>
            </View>
         </View>
      </View>


      <View style={{ alignItems: 'flex-start', marginVertical: 32, paddingHorizontal: 4 }}>
         {isHighPrecision ? (
            <Text style={[styles.supportCopy, { marginVertical: 0, marginBottom: 16, color: theme.colors.textSecondary, borderLeftColor: theme.colors.outline }]}>
               Prenda o telemóvel no <Text style={{ color: theme.colors.textMain, fontWeight: 'bold' }}>braço</Text>.
            </Text>
         ) : (
            <Text style={[styles.supportCopy, { marginVertical: 0, marginBottom: 16, color: theme.colors.primary, borderLeftColor: theme.colors.primary }]}>
               O dispositivo não precisa de estar ancorado ao músculo, mas as leituras cinéticas perdem fidelidade matemática.
            </Text>
         )}
         
         <View style={{ alignSelf: 'flex-start', borderRadius: 12, padding: 1, backgroundColor: theme.colors.outline, position: 'relative' }}>
            {/* Brilho de keyframes web injectado inline */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.primary, borderRadius: 12, animation: 'pulse 2s infinite' } as any} />
            
            <TouchableOpacity 
               style={{ backgroundColor: isHighPrecision ? theme.colors.cardBg : theme.colors.pageBg, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 11, alignItems: 'center', minWidth: 160 }}
               onPress={() => setIsInfoVisible(true)}
            >
               <Text style={{ fontSize: 13, fontWeight: '800', fontStyle: 'italic', letterSpacing: 1, color: isHighPrecision ? theme.colors.primary : theme.colors.textSecondary }}>
                  {isHighPrecision ? "PRECISÃO MÁXIMA" : "PRECISÃO (DESLIGADA)"}
               </Text>
            </TouchableOpacity>
         </View>
      </View>
      
      <View style={{ height: 100 }} />
      </ScrollView>

      {/* Dock Bar Flutuante */}
      <View style={[styles.dockBar, { backgroundColor: theme.colors.pageBg, borderTopColor: theme.colors.outline, position: 'fixed' as any }]}>
         <TouchableOpacity style={styles.dockItem}>
            <ClipboardList size={22} color={theme.colors.textSecondary} />
            <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Plano</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockItem}>
            <Settings size={22} color={theme.colors.textSecondary} />
            <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Config</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockItem}>
            <Zap size={22} color={theme.colors.primary} />
            <Text style={[styles.dockText, { color: theme.colors.primary, fontWeight: '800' }]}>Treino</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockItem}>
            <BarChart2 size={22} color={theme.colors.textSecondary} />
            <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Métricas</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.dockItem}>
            <Lightbulb size={22} color={theme.colors.textSecondary} />
            <Text style={[styles.dockText, { color: theme.colors.textSecondary }]}>Sugestões</Text>
         </TouchableOpacity>
      </View>

      {/* Popup de Informação: Modo de Precisão */}
      {isInfoVisible && (
         <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,10,0.85)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: 24, backdropFilter: 'blur(8px)' as any }}>
            <View style={{ width: '100%', backgroundColor: theme.colors.pageBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.outline }}>
               <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 16 }}>MODO DE PRECISÃO MAIS</Text>
               <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
                  <Text style={{ color: theme.colors.textMain, fontWeight: 'bold' }}>ATIVADO:</Text> Acionando esta opção ativará o radar cinético 3D, exigindo que o dispositivo esteja fixo com braçadeira no local de esforço.
                  {'\n\n'}
                  <Text style={{ color: theme.colors.textMain, fontWeight: 'bold' }}>DESATIVADO:</Text> O telemóvel não precisará ser mudado de local no corpo (e.g. pode ficar no bolso), mas perderá a precisão da medição de simetria e cinética.
               </Text>
               <TouchableOpacity 
                  onPress={() => { setIsHighPrecision(true); setIsInfoVisible(false); }}
                  style={{ alignSelf: 'stretch', backgroundColor: isHighPrecision ? theme.colors.cardBg : theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: theme.colors.primary }}
               >
                  <Text style={{ color: isHighPrecision ? theme.colors.primary : theme.colors.pageBg, fontWeight: 'bold', letterSpacing: 1, fontSize: 13 }}>{isHighPrecision ? 'MANTER ATIVADO' : 'ATIVAR PRECISÃO'}</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => { setIsHighPrecision(false); setIsInfoVisible(false); }}
                  style={{ alignSelf: 'stretch', backgroundColor: !isHighPrecision ? theme.colors.cardBg : 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.outline }}
               >
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold', letterSpacing: 1, fontSize: 13 }}>{isHighPrecision ? 'DESATIVAR PRECISÃO' : 'MANTER DESATIVADO'}</Text>
               </TouchableOpacity>
            </View>
         </View>
      )}
    </View>
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
  buttonText: { fontSize: 15, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  dockBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 999, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 85, paddingBottom: 25, borderTopWidth: 1 },
  dockItem: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6, opacity: 0.9 },
  dockText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }
});
