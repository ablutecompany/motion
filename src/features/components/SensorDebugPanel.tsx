/**
 * SensorDebugPanel.tsx — RC1.3
 *
 * Presenter puro. ZERO estado local. ZERO listeners.
 * Recebe TrainingRenderState — o mesmo objeto flat que alimenta
 * o anel, as REPS, as SÉRIES e o badge de sensor em MotionHomePerformance.
 *
 * phase / score / repCount vêm de kinematics.currentPhase / executionQualityScore / repCount
 * (estado React de alta frequência, não do snapshot debug throttled a 4 Hz).
 *
 * Hardware raw (AIG/ACC/ORI) vêm de kinematics.debug — aceitável porque
 * mudam a mesma frequência que o sensorStatus e não estão no caminho crítico.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { TrainingRenderState } from '../screens/home/MotionHomePerformance';

interface SensorDebugPanelProps {
  state: TrainingRenderState;
}

const nf = (v: number | null | undefined) =>
  v === null || v === undefined ? 'null' : v.toFixed(2);

export const SensorDebugPanel: React.FC<SensorDebugPanelProps> = ({ state }) => {
  const stColor =
    state.sensorStatus === 'EVENTS_OK'   ? '#4ade80' :
    state.sensorStatus === 'PARTIAL_DATA' ? '#ffd700' : '#ff4757';

  const permColor = (p: string) =>
    p === 'granted' || p === 'not_required' ? '#4ade80' :
    p === 'denied'  || p === 'error'        ? '#ff4757' : '#888';

  const row = (label: string, val: string, color = '#999') => (
    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
      <Text style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>{label}</Text>
      <Text style={{ color, fontSize: 10, fontFamily: 'monospace', fontWeight: '700' }}>{val}</Text>
    </View>
  );

  const statusMsg =
    state.sensorStatus === 'EVENTS_OK'    ? 'Sensores ativos' :
    state.sensorStatus === 'PARTIAL_DATA' ? 'Sensores parciais' :
    state.motionPermission === 'unknown'  ? 'iOS: toque em ATIVAR SENSORES' :
    state.motionPermission === 'denied'   ? 'Permissão recusada' :
    'Sem dados de sensor';

  return (
    <View style={{
      margin: 8,
      backgroundColor: '#080810',
      borderWidth: 1,
      borderColor: stColor + '55',
      borderRadius: 10,
      padding: 12,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: stColor, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, fontFamily: 'monospace' }}>
          {statusMsg.toUpperCase()}
        </Text>
        <Text style={{ color: '#444', fontSize: 9, fontFamily: 'monospace' }}>
          evt:{state.motionEventCount} ~{state.motionIntervalMs}ms
        </Text>
      </View>

      {/* Botão ATIVAR SENSORES — apenas iOS sem permissão */}
      {state.motionPermission === 'unknown' && (
        <TouchableOpacity
          onPress={state.onRequestPermission}
          style={{
            backgroundColor: '#00d4ff22',
            borderWidth: 1.5,
            borderColor: '#00d4ff',
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#00d4ff', fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>
            ⚡ ATIVAR SENSORES
          </Text>
        </TouchableOpacity>
      )}

      {/* Permissões */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
        {row('motion:', state.motionPermission, permColor(state.motionPermission))}
        {row('orient:', state.orientationPermission, permColor(state.orientationPermission))}
      </View>

      {/* Flags de presença */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['AIG', 'ACC', 'RR', 'ORI'] as const).map((k, i) => {
          const v = [state.hasAIG, state.hasACC, state.hasRR, state.hasOri][i];
          return (
            <View key={k} style={{ backgroundColor: v ? '#4ade8022' : '#ff475722', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: v ? '#4ade80' : '#ff4757' }}>
              <Text style={{ color: v ? '#4ade80' : '#ff4757', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' }}>{k}</Text>
            </View>
          );
        })}
      </View>

      {/* Dados brutos de hardware (4 Hz throttle — aceitável) */}
      <View style={{ backgroundColor: '#0d0d1a', borderRadius: 6, padding: 8, marginBottom: 8 }}>
        {row('AIG x/y/z:', `${nf(state.aigX)}  ${nf(state.aigY)}  ${nf(state.aigZ)}`, state.hasAIG ? '#ccc' : '#ff4757')}
        {row('ACC x/y/z:', `${nf(state.accX)}  ${nf(state.accY)}  ${nf(state.accZ)}`, state.hasACC ? '#ccc' : '#888')}
        {row('ori β/γ:',  `${nf(state.oriBeta)}  ${nf(state.oriGamma)}`, state.hasOri ? '#ccc' : '#888')}
      </View>

      {/* Pipeline (RC1.7) — MESMOS valores que alimentam o anel/REPS/SÉRIES */}
      <View style={{ backgroundColor: '#0d0d1a', borderRadius: 6, padding: 8 }}>
        {row('source:', state.source, state.isAvailable ? '#4ade80' : '#888')}
        
        {/* ENGINE: O que o motor está a disparar internamente */}
        {row('engine:', `${state.currentPhase} (raw)`, '#00d4ff')}
        {row('motor:',  `${state.repCount} reps total`, '#555')}
        
        {/* DISPLAY: O que o utilizador vê no ecrã principal */}
        {row('display:', state.phaseLabel, '#4ade80')}
        {row('REPS:',   `${state.currentRepsInSet}/${state.targetRepsPerSet} · s${state.currentSet}/${state.targetSets}`, '#4ade80')}
        
        {/* MÉTRICAS */}
        {row('score:', state.score.toFixed(2), '#ffd700')}
        {row('amp:',   state.amplitude.toFixed(2), '#ffd700')}
        
        {/* REJEIÇÃO: Visível imediatamente se o motor ignorar algo */}
        {row('reject:', state.rejectionReason, state.rejectionReason === '—' ? '#444' : '#ffd700')}
      </View>
    </View>
  );
};


