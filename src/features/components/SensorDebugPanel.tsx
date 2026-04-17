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
      {/* HEADER MÍNIMO */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: state.motionPermission === 'unknown' ? 10 : 0 }}>
        <Text style={{ color: stColor, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, fontFamily: 'monospace' }}>
          {statusMsg.toUpperCase()}
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

      {/* DEBUG MÍNIMO UNIFICADO */}
      <View style={{ flexDirection: 'column', gap: 6, marginTop: state.motionPermission === 'unknown' ? 0 : 10 }}>
        {row('status:', state.sensorStatus, stColor)}
        {row('phase:', `${state.currentPhase}`, '#00d4ff')}
        {row('reps:', `${state.repCount}`, '#4ade80')}
        {row('amp:', state.amplitude.toFixed(2), '#ffd700')}
        {row('reject:', state.rejectionReason, state.rejectionReason === '—' ? '#444' : '#ff4757')}
      </View>
    </View>
  );
};


