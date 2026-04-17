import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useMotionPlanState } from '../../../facades/useMotionPlanState';
import { useMotionTheme } from '../../../theme/useMotionTheme';
import { CheckCircle2, ChevronRight, Play, Compass, Calendar, Zap, LayoutList } from 'lucide-react';

export const MotionPlanScreen: React.FC<{ planState: any, onNavigateToTraining: () => void }> = ({ planState, onNavigateToTraining }) => {
  const theme = useMotionTheme();

  if (!planState || !planState.isLoaded) return (
       <View style={{ flex: 1, backgroundColor: theme.colors.pageBg }}>
       </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.colors.textMain }]}>PLANEAMENTO</Text>
      
      {/* HUD de Diagnóstico do Estado de Recuperação (Apenas em Dev) */}
      <View style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 24 }}>
         <Text style={{ color: theme.colors.textMain, fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>[DIAGNÓSTICO ESTADO LOCAL]</Text>
         <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Estratégia ativa: {planState.activeStrategy?.strategyId || 'NENHUMA'}</Text>
         <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Sessão ativa: {planState.activeSession?.sessionId || 'NENHUMA'}</Text>
         <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Nº de blocos da sessão: {planState.activeSession?.orderedBlocks?.length || 0}</Text>
         <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>Estado da recuperação: <Text style={{ color: planState.recoveryStatus === 'OK' ? theme.colors.primary : theme.colors.error, fontWeight: 'bold' }}>{planState.recoveryStatus}</Text></Text>
      </View>

      {/* SEÇÃO 1: Estratégia Ativa */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 13, letterSpacing: 1, fontWeight: 'bold', marginBottom: 12 }}><Compass size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }}/>ESTRATÉGIA (MÉDIO/LONGO PRAZO)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {planState.allStrategies.map(strat => {
              const isActive = planState.activeStrategy?.strategyId === strat.strategyId;
              return (
                <TouchableOpacity 
                  key={strat.strategyId} 
                  activeOpacity={0.8}
                  onPress={() => planState.selectStrategy(strat.strategyId)}
                  style={[styles.strategyCard, { 
                    backgroundColor: isActive ? theme.colors.primary + '11' : theme.colors.cardBg,
                    borderColor: isActive ? theme.colors.primary : theme.colors.outline 
                  }]}
                >
                  <Text style={{ color: isActive ? theme.colors.primary : theme.colors.textMain, fontWeight: '900', fontSize: 16, marginBottom: 8 }}>{strat.goalFocus}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 2 }}>Split: {strat.splitType.toUpperCase()}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Freq: {strat.frequency}x/sem</Text>
                  {isActive && <View style={{ position: 'absolute', top: 16, right: 16 }}><CheckCircle2 size={20} color={theme.colors.primary} /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={{ height: 1, backgroundColor: theme.colors.outline, marginBottom: 32 }} />

      {/* SEÇÃO 2: Sessão Diária Derivada */}
      {planState.activeStrategy && (
         <View style={{ marginBottom: 64 }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, letterSpacing: 1, fontWeight: 'bold', marginBottom: 12 }}><Calendar size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }}/>SESSÃO DIÁRIA DERIVADA</Text>

            {/* Listagem das Sessões Disponíveis nesta Estratégia */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {planState.availableSessionsForActiveStrategy.map(sess => {
                   const isActive = planState.activeSession?.sessionId === sess.sessionId;
                   return (
                     <TouchableOpacity
                       key={sess.sessionId}
                       onPress={() => planState.selectSession(sess.sessionId)}
                       style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, backgroundColor: isActive ? theme.colors.textMain : 'transparent', borderColor: isActive ? theme.colors.textMain : theme.colors.outline }}
                     >
                        <Text style={{ color: isActive ? theme.colors.pageBg : theme.colors.textMain, fontWeight: 'bold', fontSize: 14 }}>{sess.name}</Text>
                     </TouchableOpacity>
                   );
                })}
              </View>
            </ScrollView>

            {/* Detalhe da Sessão Corrente Selecionada */}
            {planState.activeSession ? (
               <View>
                 <View style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.outline, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <LayoutList size={20} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                       <Text style={{ color: theme.colors.textMain, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>Contexto: {planState.activeSession.dateContext}</Text>
                       <Text style={{ color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{planState.activeSession.readinessContext}</Text>
                    </View>
                 </View>

                 <View style={{ gap: 12 }}>
                  {planState.activeSession.orderedBlocks.map(block => {
                    const exercise = planState.catalog[block.exerciseId];
                    if (!exercise) return null;
                    
                    const isSelectedBlock = planState.activeBlock?.blockId === block.blockId;

                    return (
                      <TouchableOpacity 
                        key={block.blockId}
                        activeOpacity={0.7}
                        onPress={() => {
                           planState.selectBlock(block.blockId);
                           onNavigateToTraining();
                        }}
                        style={{
                          backgroundColor: isSelectedBlock ? theme.colors.primary : theme.colors.cardBg,
                          borderWidth: 1,
                          borderColor: isSelectedBlock ? theme.colors.primary : theme.colors.outline,
                          borderRadius: 16,
                          padding: 20,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: isSelectedBlock ? theme.colors.pageBg : theme.colors.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>
                            {block.order} • {exercise.primaryMuscleGroups[0]?.toUpperCase() || 'LIVRE'} {exercise.supportsMotionTracking ? <Zap size={10} color={isSelectedBlock ? theme.colors.pageBg : theme.colors.primary} /> : '(S. RADAR)'} 
                          </Text>
                          <Text style={{ color: isSelectedBlock ? theme.colors.pageBg : theme.colors.textMain, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>
                            {exercise.name}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 16 }}>
                            <Text style={{ color: isSelectedBlock ? theme.colors.pageBg : theme.colors.textSecondary, fontSize: 13, fontWeight: 'bold' }}>{block.targetSets} SÉRIES</Text>
                            <Text style={{ color: isSelectedBlock ? theme.colors.pageBg : theme.colors.textSecondary, fontSize: 13, fontWeight: 'bold' }}>{block.targetReps} REPS</Text>
                            {block.targetLoad && <Text style={{ color: isSelectedBlock ? theme.colors.pageBg : theme.colors.textSecondary, fontSize: 13, fontWeight: 'bold' }}>{block.targetLoad} CARGA</Text>}
                          </View>
                        </View>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isSelectedBlock ? theme.colors.pageBg + '33' : theme.colors.pageBg, alignItems: 'center', justifyContent: 'center' }}>
                          {isSelectedBlock ? <Play size={20} color={theme.colors.pageBg} fill={theme.colors.pageBg} /> : <ChevronRight size={20} color={theme.colors.primary} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                 </View>
               </View>
            ) : (
               <Text style={{ color: theme.colors.textSecondary }}>Nenhuma sessão encontrada para esta Estratégia.</Text>
            )}

         </View>
      )}

      {/* Caso crítico em que mesmo com fallback não existe sessão/estrategia */}
      {!planState.activeStrategy && (
         <View style={{ backgroundColor: theme.colors.error + '22', borderColor: theme.colors.error, borderWidth: 1, borderRadius: 16, padding: 24, marginTop: 24 }}>
            <Text style={{ color: theme.colors.textMain, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Não foi possível carregar o plano atual.</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>Os dados guardados localmente estão corrompidos ou este dispositivo não possui planos atribuídos. A repor plano base na próxima interação.</Text>
         </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 12
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 24
  },
  strategyCard: {
    width: 250,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1
  }
});
