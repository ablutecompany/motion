import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, PanResponder, Dimensions, Animated } from 'react-native';
import { ClipboardList, Settings, Zap, BarChart2, Lightbulb, Smartphone, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useMotionTheme } from '../../../theme/useMotionTheme';
import supinoBg from '../../../assets/supino_reto.png';
import aberturaBg from '../../../assets/abertura_plana.png';
import { useMotionStore, selectors } from '../../../store/useMotionStore';
import { useMotionExecutionRuntimeFacade } from '../../../facades/useMotionExecutionRuntimeFacade';
import { useMotionKinematicsFacade } from '../../../facades/useMotionKinematicsFacade';
import { MotionBottomNav } from '../../components/MotionBottomNav';
import { MotionProgressScreen } from '../MotionProgress';

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
   const [exerciseLocation, setExerciseLocation] = useState<'gym' | 'home' | 'street'>('gym');
   const [isLocationAuto, setIsLocationAuto] = useState(true);
   const [isHighPrecision, setIsHighPrecision] = useState(true);
   const [isInfoVisible, setIsInfoVisible] = useState(false);
   const [isFlowVisible, setIsFlowVisible] = useState(false);
   const [isWeightDialVisible, setIsWeightDialVisible] = useState(false);
   const [activeTab, setActiveTab] = useState('Treino');
   const [weightRecommended, setWeightRecommended] = useState(120);
   const weightRef = useRef(weightRecommended);
   const [dialRotation, setDialRotation] = useState(0);

   useEffect(() => { weightRef.current = weightRecommended; }, [weightRecommended]);

   const pulseAnim = useRef(new Animated.Value(0.2)).current;
   useEffect(() => {
      // Deixar correr o loop infinitamente para evitar `loop.stop()` a chamar `global.cancelAnimationFrame` no Vite
      Animated.loop(
         Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 0.2, duration: 1500, useNativeDriver: false }),
         ])
      ).start();
   }, [pulseAnim]);

   const getTargetLimb = () => {
      if (!isHighPrecision) return 'o dispositivo';
      const name = (activeBlock?.exercise?.name || '').toLowerCase();
      if (name.includes('bicep') || name.includes('tricep') || name.includes('braço') || name.includes('supino') || name.includes('remada') || name.includes('ombro') || name.includes('peito') || name.includes('costas')) return 'e sinta no braço';
      if (name.includes('agacha') || name.includes('leg') || name.includes('perna') || name.includes('gémeo') || name.includes('glúteo')) return 'e sinta na perna';
      return 'o braço';
   };

   const lastAngleRef = useRef(0);
   const panResponder = useRef(
      PanResponder.create({
         onStartShouldSetPanResponder: () => true,
         onPanResponderGrant: (evt: any) => {
            const { pageX, pageY } = evt.nativeEvent;
            const { width, height } = Dimensions.get('window');
            const cx = width / 2;
            const cy = height / 2;
            lastAngleRef.current = Math.atan2(pageY - cy, pageX - cx);
         },
         onPanResponderMove: (evt: any) => {
            const { pageX, pageY } = evt.nativeEvent;
            const { width, height } = Dimensions.get('window');
            const cx = width / 2;
            const cy = height / 2;
            const currentAngle = Math.atan2(pageY - cy, pageX - cx);

            let delta = currentAngle - lastAngleRef.current;
            if (delta > Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;

            if (Math.abs(delta) > 0.15) {
               const direction = delta > 0 ? 1 : -1;
               const newWeight = Math.max(0, weightRef.current + (2.5 * direction));
               setWeightRecommended(newWeight);
               setDialRotation((r: any) => r + (direction * 15));
               lastAngleRef.current = currentAngle;
            }
         },
      })
   ).current;

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
   const nextExerciseName = "Abertura Plana";

   return (
      <View style={{ flex: 1, height: Platform.OS === 'web' ? '100vh' : '100%', overflow: 'hidden', backgroundColor: theme.colors.pageBg }}>
         <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>

            {/* ---------------- TREINO TAB ---------------- */}
            {activeTab === 'Treino' && (
               <>
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
                           <Text style={{ color: theme.colors.textSecondary, fontSize: 13, letterSpacing: 1, fontStyle: 'italic', opacity: 0.7 }}>instruções</Text>
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
                  <View style={{ marginVertical: 16, marginTop: 32, alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
                     <View style={[styles.meterWrapper, { width: 320, height: 320, transform: [{ translateY: 100 }] }]}>
                        <TouchableOpacity activeOpacity={0.8} onPress={handleClockPress}>
                           {renderRing(kinematics.effortValue, 320, 12)}
                           <View style={[styles.effortCenterLabel, { width: 320, height: 320 }]}>
                              <Text style={[styles.effortValue, { color: theme.colors.primary, fontSize: 76, lineHeight: 82 }]}>{formatTime(seconds)}</Text>
                              <Text style={[styles.effortUnit, { color: theme.colors.primary, marginTop: 8 }]}>
                                 {isRunning ? 'EM CURSO' : 'TOCAR/INICIAR'}
                              </Text>
                              {!isRunning && (
                                 <Animated.Text style={{ opacity: pulseAnim, color: theme.colors.textSecondary, fontSize: 13, marginTop: 12, letterSpacing: 1, position: 'absolute', bottom: 50 }}>
                                    mova {getTargetLimb()}
                                 </Animated.Text>
                              )}
                           </View>
                        </TouchableOpacity>

                        {kinematics.isSimulated && isRunning && (
                           <Text style={{ fontSize: 14, color: theme.colors.warning, position: 'absolute', bottom: -24, fontFamily: 'monospace', fontWeight: 'bold' }}>MOCK SENSOR</Text>
                        )}
                        {kinematics.source === 'unsupported' && isRunning && (
                           <Text style={{ fontSize: 14, color: theme.colors.textSecondary, position: 'absolute', bottom: -24, fontFamily: 'monospace', fontWeight: 'bold' }}>S/ SENSOR DETETADO</Text>
                        )}
                     </View>


                     {/* Localização do Sensor: Canto Esquerdo Total */}
                     <View style={{ position: 'absolute', top: -30, left: 0, alignItems: 'flex-start' }}>
                        <Text style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: 16, letterSpacing: 1, marginBottom: 4 }]}>SENSOR</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                           <Smartphone size={18} color={theme.colors.textSecondary} />
                           <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '800' }}>
                              <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>Tlm no</Text> braço
                           </Text>
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
                  {/* --- ÁREA DE RODAPÉ TÁTICO --- */}
                  <View style={{ marginTop: 120, paddingBottom: 24 }}>
                     <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic', letterSpacing: 1, marginLeft: 4, marginBottom: 8 }}>exercício seguinte</Text>

                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* COLUNA ESQUERDA: NAVEGAÇÃO */}
                        <View style={{ flexDirection: 'column', gap: 12 }}>
                           {/* 1. A SEGUIR */}
                           <TouchableOpacity activeOpacity={0.8} style={[styles.heroBlock, { width: 200, backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, height: 75, position: 'relative', overflow: 'hidden', justifyContent: 'center', marginBottom: 0 }]}>
                              {/* Digital Crop via CSS Transform */}
                              <Image source={aberturaBg} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.6, resizeMode: 'cover', transform: [{ scale: 1.6 }, { translateY: -5 }] }} />
                              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.cardBg, opacity: 0.2 }} />
                              <View style={{ paddingHorizontal: 2, zIndex: 10, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                 <Text style={{ color: theme.colors.primary, fontSize: 16, lineHeight: 18, textAlign: 'center', fontWeight: '900', letterSpacing: 0, width: '100%', fontStyle: 'italic' }} numberOfLines={2}>{nextExerciseName.toLowerCase()}</Text>
                              </View>
                           </TouchableOpacity>

                           {/* 2. FORA DO PLANO */}
                           <TouchableOpacity activeOpacity={0.8} style={[styles.heroBlock, { width: 200, backgroundColor: 'transparent', borderColor: theme.colors.outline, borderStyle: 'dashed', height: 50, position: 'relative', overflow: 'hidden', justifyContent: 'center', marginBottom: 0 }]}>
                              <View style={{ paddingHorizontal: 4, zIndex: 10, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                 <Text style={[styles.heroHeadline, { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 15, textAlign: 'center' }]}>fora do plano</Text>
                              </View>
                           </TouchableOpacity>
                        </View>

                        {/* COLUNA DIREITA: CARGA */}
                        <View style={{ alignItems: 'flex-end' }}>
                           <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setIsWeightDialVisible(true)}
                              style={{ backgroundColor: theme.colors.cardBg, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', minWidth: 110, height: 75, justifyContent: 'center' }}
                           >
                              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 2 }]}>
                                 CARGA (KG)
                              </Text>
                              <Text style={{ color: theme.colors.primary, fontSize: 32, fontWeight: '900' }}>
                                 {weightRecommended}
                              </Text>
                           </TouchableOpacity>
                        </View>
                     </View>
                  </View>
               </>
            )}

            {/* ---------------- CONFIG TAB ---------------- */}
            {activeTab === 'Config' && (
               <View style={{ flex: 1, paddingBottom: 64 }}>
                  {/* Cartão Rectilíneo: MODO DE RASTREIO */}
                  <View style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, borderWidth: 1, borderRadius: 0, padding: 32, marginBottom: 24 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <Smartphone size={32} color={theme.colors.primary} />
                        <Text style={{ color: theme.colors.textMain, fontSize: 24, fontWeight: '900', letterSpacing: 1 }}>
                           MODO DE MEDIÇÃO
                        </Text>
                     </View>

                     {isHighPrecision ? (
                        <Text style={[styles.supportCopy, { color: theme.colors.textSecondary, fontSize: 15, marginBottom: 32, lineHeight: 24, fontFamily: 'monospace' }]}>
                           1 - ATIVADO: Acionando esta opção ativará o radar cinético 3D, exigindo que o dispositivo esteja fixo com braçadeira no local de esforço.
                        </Text>
                     ) : (
                        <Text style={[styles.supportCopy, { color: theme.colors.textSecondary, fontSize: 15, marginBottom: 32, lineHeight: 24, fontFamily: 'monospace' }]}>
                           2 - DESATIVADO: O telemóvel não precisará ser mudado de local no corpo (e.g. pode ficar no bolso), mas perderá a precisão da medição de simetria e cinética.
                        </Text>
                     )}

                     <View style={{ borderRadius: 0, padding: 2, backgroundColor: theme.colors.outline, position: 'relative', width: '100%' }}>
                        {isHighPrecision && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.primary, borderRadius: 0, animation: 'pulse 2s infinite' } as any} />}
                        
                        <TouchableOpacity
                           style={{ backgroundColor: isHighPrecision ? theme.colors.cardBg : theme.colors.pageBg, paddingVertical: 20, paddingHorizontal: 24, borderRadius: 0, alignItems: 'center', width: '100%' }}
                           onPress={() => setIsHighPrecision(!isHighPrecision)}
                        >
                           <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1.5, color: isHighPrecision ? theme.colors.primary : theme.colors.textSecondary, textTransform: 'uppercase' }}>
                              {isHighPrecision ? "Precisão direta: ATIVO" : "Precisão: Indireto"}
                           </Text>
                        </TouchableOpacity>
                     </View>
                  </View>

                  {/* Cartão Rectilíneo: LOCAL DE TREINO */}
                  <View style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, borderWidth: 1, borderRadius: 0, padding: 32, marginBottom: 24 }}>
                     <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                           <MapPin size={32} color={theme.colors.primary} />
                           <Text style={{ color: theme.colors.textMain, fontSize: 24, fontWeight: '900', letterSpacing: 1 }}>
                              LOCAL DE EXERCÍCIO
                           </Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsLocationAuto(!isLocationAuto)}>
                           <Text style={{ color: isLocationAuto ? theme.colors.primary : theme.colors.textSecondary, fontSize: 13, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
                              {isLocationAuto ? 'AUTO' : 'MANUAL'}
                           </Text>
                        </TouchableOpacity>
                     </View>

                     {isLocationAuto ? (
                        <Text style={[styles.supportCopy, { color: theme.colors.primary, fontSize: 15, marginBottom: 32, lineHeight: 24, fontFamily: 'monospace' }]}>
                           ✔ Padrão geográfico reconhecido após 3 sessões locais. O sistema vinculou o ambiente às máquinas detetadas remotamente.
                        </Text>
                     ) : (
                        <Text style={[styles.supportCopy, { color: theme.colors.textSecondary, fontSize: 15, marginBottom: 32, lineHeight: 24, fontFamily: 'monospace' }]}>
                           O algoritmo logístico adapta prescrições balísticas com base nas restrições e máquinas da sua localização geográfica selecionada.
                        </Text>
                     )}

                     <View style={{ flexDirection: 'column', gap: 12, opacity: isLocationAuto ? 0.6 : 1 }} pointerEvents={isLocationAuto ? 'none' : 'auto'}>
                        {/* Option: Gym */}
                        <TouchableOpacity
                           activeOpacity={0.8}
                           onPress={() => setExerciseLocation('gym')}
                           style={{ padding: 20, borderWidth: 1, borderRadius: 0, borderColor: exerciseLocation === 'gym' ? theme.colors.primary : theme.colors.outline, backgroundColor: exerciseLocation === 'gym' ? theme.colors.primary + '10' : theme.colors.pageBg }}
                        >
                           <Text style={{ color: exerciseLocation === 'gym' ? theme.colors.primary : theme.colors.textMain, fontWeight: '900', fontSize: 16, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                              LABORATÓRIO (GYM)
                           </Text>
                           <Text style={{ color: exerciseLocation === 'gym' ? theme.colors.primary : theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>Estrutura completa. Máquinas clássicas e densidade máxima de equipamento suportados.</Text>
                        </TouchableOpacity>

                        {/* Option: Casa */}
                        <TouchableOpacity
                           activeOpacity={0.8}
                           onPress={() => setExerciseLocation('home')}
                           style={{ padding: 20, borderWidth: 1, borderRadius: 0, borderColor: exerciseLocation === 'home' ? theme.colors.primary : theme.colors.outline, backgroundColor: exerciseLocation === 'home' ? theme.colors.primary + '10' : theme.colors.pageBg }}
                        >
                           <Text style={{ color: exerciseLocation === 'home' ? theme.colors.primary : theme.colors.textMain, fontWeight: '900', fontSize: 16, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                              QUARTEL (CASA)
                           </Text>
                           <Text style={{ color: exerciseLocation === 'home' ? theme.colors.primary : theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>Substituição de máquinas originais por adaptações "Home Made" e uso de mobiliário base.</Text>
                        </TouchableOpacity>

                        {/* Option: Sem suporte */}
                        <TouchableOpacity
                           activeOpacity={0.8}
                           onPress={() => setExerciseLocation('street')}
                           style={{ padding: 20, borderWidth: 1, borderRadius: 0, borderColor: exerciseLocation === 'street' ? theme.colors.primary : theme.colors.outline, backgroundColor: exerciseLocation === 'street' ? theme.colors.primary + '10' : theme.colors.pageBg }}
                        >
                           <Text style={{ color: exerciseLocation === 'street' ? theme.colors.primary : theme.colors.textMain, fontWeight: '900', fontSize: 16, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
                              HOSTIL (SEM SUPORTE)
                           </Text>
                           <Text style={{ color: exerciseLocation === 'street' ? theme.colors.primary : theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>Zero equipamento. Ao ar livre ou sala vazia. Foco mecânico exclusivo no peso corporal livre.</Text>
                        </TouchableOpacity>
                     </View>
                  </View>

               </View>
            )}

            {/* ---------------- MǸTRICAS TAB ---------------- */}
            {activeTab === 'Métricas' && (
               <View style={{ flex: 1, paddingBottom: 64 }}>
                  <MotionProgressScreen />
               </View>
            )}

            <View style={{ height: 100 }} />
         </ScrollView>

         {/* COMPONENTE UNICO BOTTOM NAV FIXA */}
         <MotionBottomNav activeTab={activeTab} onTabPress={setActiveTab} />

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
         {/* Popup Dial: Ajuste de Carga Inercial */}
         {isWeightDialVisible && (
            <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,10,0.92)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', padding: 24, backdropFilter: 'blur(12px)' as any }}>
               <View style={{ alignItems: 'center', width: '100%' }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 32 }}>AJUSTAR CARGA</Text>

                  {/* Container da Roda Matemático */}
                  <View {...panResponder.panHandlers} style={{ width: 280, height: 280, borderRadius: 140, backgroundColor: theme.colors.cardBg, borderWidth: 2, borderColor: theme.colors.outline, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 }}>

                     {/* Elemento visual rotativo */}
                     <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', transform: [{ rotate: `${dialRotation}deg` }] }}>
                        {/* Marcador superior (o ponto de aderência visual) */}
                        <View style={{ width: 12, height: 24, backgroundColor: theme.colors.primary, borderRadius: 6, marginTop: 12, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 }} />
                     </View>

                     {/* Visor Numérico Fixo no Centro */}
                     <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.pageBg, width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: theme.colors.outline }}>
                        <Text style={{ color: theme.colors.textMain, fontSize: 44, fontWeight: '900', letterSpacing: -1 }}>{weightRecommended}</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '700', marginTop: 0 }}>KG</Text>
                     </View>

                  </View>

                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontStyle: 'italic', letterSpacing: 1, marginTop: 32, opacity: 0.6 }}>Deslize em círculo para calibrar</Text>

                  <TouchableOpacity
                     onPress={() => setIsWeightDialVisible(false)}
                     style={{ marginTop: 48, alignSelf: 'stretch', backgroundColor: theme.colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center' }}
                  >
                     <Text style={{ color: theme.colors.pageBg, fontWeight: 'bold', letterSpacing: 2, fontSize: 15 }}>CONFIRMAR</Text>
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
   buttonText: { fontSize: 15, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 }
});
