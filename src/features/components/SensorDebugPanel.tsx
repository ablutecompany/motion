/**
 * SensorDebugPanel.tsx
 *
 * Componente autónomo de diagnóstico de sensores.
 * Não depende de nenhuma facade — regista os seus próprios listeners.
 * Sempre visível quando montado. Usar apenas em debugging mobile.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

type PermState = 'unknown' | 'granted' | 'denied' | 'not_required' | 'error';
type SensorSt  = 'NO_EVENTS' | 'EVENTS_OK' | 'PARTIAL';

interface DebugState {
  motionPerm:    PermState;
  orientPerm:    PermState;
  sensorSt:      SensorSt;
  evtCount:      number;
  intervalMs:    number;
  aigX: string; aigY: string; aigZ: string;
  accX: string; accY: string; accZ: string;
  hasAIG: boolean; hasACC: boolean; hasRR: boolean; hasOri: boolean;
  oriBeta: string; oriGamma: string;
  phase:    string;
  score:    string;
  amp:      string;
  repCount: number;
  reject:   string;
  statusMsg: string;
}

const n = (v: number | null | undefined) =>
  v === null || v === undefined ? 'null' : v.toFixed(2);

export const SensorDebugPanel: React.FC = () => {
  const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

  const [d, setD] = useState<DebugState>({
    motionPerm: 'unknown', orientPerm: 'unknown',
    sensorSt: 'NO_EVENTS', evtCount: 0, intervalMs: 0,
    aigX: 'null', aigY: 'null', aigZ: 'null',
    accX: 'null', accY: 'null', accZ: 'null',
    hasAIG: false, hasACC: false, hasRR: false, hasOri: false,
    oriBeta: 'null', oriGamma: 'null',
    phase: 'idle', score: '0.00', amp: '0.00',
    repCount: 0, reject: '—',
    statusMsg: 'A aguardar...',
  });

  const stateRef    = useRef<DebugState>({ ...d });
  const lastTsRef   = useRef<number>(0);
  const intervalSum = useRef(0);
  const intervalCnt = useRef(0);

  const flush = useCallback(() => {
    setD({ ...stateRef.current });
  }, []);

  // Motion listener
  const handleMotion = useCallback((ev: any) => {
    const now  = Date.now();
    const aig  = ev.accelerationIncludingGravity;
    const acc  = ev.acceleration;
    const rr   = ev.rotationRate;

    if (lastTsRef.current > 0) {
      const diff = now - lastTsRef.current;
      intervalSum.current += diff;
      intervalCnt.current += 1;
    }
    lastTsRef.current = now;

    const hasAIG = !!(aig && aig.x !== null && aig.y !== null);
    const hasACC = !!(acc && acc.x !== null && acc.y !== null);
    const hasRR  = !!(rr  && rr.alpha !== null);

    let st: SensorSt = 'NO_EVENTS';
    let msg = 'Sem dados de sensor';
    if (hasAIG || hasACC) {
      st = (hasAIG && hasACC) ? 'EVENTS_OK' : 'PARTIAL';
      msg = st === 'EVENTS_OK' ? 'Sensores ativos' : 'Sensores parciais';
    } else if (stateRef.current.evtCount > 0) {
      st = 'PARTIAL';
      msg = 'Sensores parciais (acc null)';
    }

    stateRef.current = {
      ...stateRef.current,
      sensorSt: st,
      statusMsg: msg,
      evtCount: stateRef.current.evtCount + 1,
      intervalMs: intervalCnt.current > 0
        ? Math.round(intervalSum.current / intervalCnt.current) : 0,
      aigX: n(aig?.x), aigY: n(aig?.y), aigZ: n(aig?.z),
      accX: n(acc?.x), accY: n(acc?.y), accZ: n(acc?.z),
      hasAIG, hasACC, hasRR,
      reject: (!hasAIG && !hasACC)
        ? 'acc/aig null — sem dados uteis'
        : stateRef.current.reject,
    };
    flush();
  }, [flush]);

  const handleOrient = useCallback((ev: any) => {
    stateRef.current = {
      ...stateRef.current,
      hasOri: ev.beta !== null,
      oriBeta:  n(ev.beta),
      oriGamma: n(ev.gamma),
    };
    flush();
  }, [flush]);

  const attachListeners = useCallback(() => {
    if (!isWeb) return;
    window.addEventListener('devicemotion',      handleMotion,  true);
    window.addEventListener('deviceorientation', handleOrient,  true);
    // Timeout: se não chegarem eventos em 3s → NO_EVENTS
    setTimeout(() => {
      if (stateRef.current.evtCount === 0) {
        stateRef.current = {
          ...stateRef.current,
          sensorSt: 'NO_EVENTS',
          statusMsg: 'Sem dados de sensor',
          reject: 'Nenhum evento devicemotion recebido em 3s',
        };
        flush();
      }
    }, 3000);
  }, [isWeb, handleMotion, handleOrient, flush]);

  // Pedir permissão — DEVE ser chamado de gesto do utilizador
  const requestPermission = useCallback(async () => {
    if (!isWeb) return;
    const dme = (window as any).DeviceMotionEvent;
    const doe = (window as any).DeviceOrientationEvent;

    let mPerm: PermState = 'not_required';
    let oPerm: PermState = 'not_required';

    if (typeof dme?.requestPermission === 'function') {
      try {
        const r = await dme.requestPermission();
        mPerm = r === 'granted' ? 'granted' : 'denied';
      } catch { mPerm = 'error'; }
    }

    if (typeof doe?.requestPermission === 'function') {
      try {
        const r = await doe.requestPermission();
        oPerm = r === 'granted' ? 'granted' : 'denied';
      } catch { oPerm = 'error'; }
    }

    const denied = mPerm === 'denied' || mPerm === 'error';
    stateRef.current = {
      ...stateRef.current,
      motionPerm: mPerm,
      orientPerm: oPerm,
      statusMsg: denied ? 'Permissão recusada' : 'Permissão concedida — a aguardar eventos...',
      reject: denied ? `motion:${mPerm}` : stateRef.current.reject,
    };
    flush();

    if (!denied) attachListeners();
  }, [isWeb, attachListeners, flush]);

  // Ligar listeners ao montar (Android/desktop não precisam de permissão)
  useEffect(() => {
    if (!isWeb) return;
    const dme = (window as any).DeviceMotionEvent;
    const needsPerm = typeof dme?.requestPermission === 'function';

    if (needsPerm) {
      // iOS: aguardar botão
      stateRef.current = {
        ...stateRef.current,
        motionPerm: 'unknown',
        statusMsg: 'iOS: toque em ATIVAR SENSORES',
        reject: 'Permissão iOS ainda não pedida',
      };
      flush();
    } else if ('DeviceMotionEvent' in window) {
      // Android / desktop
      stateRef.current = {
        ...stateRef.current,
        motionPerm: 'not_required',
        orientPerm: 'not_required',
        statusMsg: 'A aguardar eventos...',
      };
      flush();
      attachListeners();
    } else {
      stateRef.current = {
        ...stateRef.current,
        motionPerm: 'denied',
        sensorSt: 'NO_EVENTS',
        statusMsg: 'DeviceMotionEvent não suportado neste browser',
        reject: 'DeviceMotionEvent ausente',
      };
      flush();
    }

    return () => {
      window.removeEventListener('devicemotion',      handleMotion,  true);
      window.removeEventListener('deviceorientation', handleOrient,  true);
    };
  }, [isWeb, attachListeners, handleMotion, handleOrient, flush]);

  // Cores
  const stColor = d.sensorSt === 'EVENTS_OK' ? '#4ade80'
                : d.sensorSt === 'PARTIAL'   ? '#ffd700'
                :                              '#ff4757';
  const permColor = (p: PermState) =>
    p === 'granted' || p === 'not_required' ? '#4ade80'
    : p === 'denied' || p === 'error'       ? '#ff4757'
    :                                         '#888';

  const row = (label: string, val: string, color = '#999') => (
    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
      <Text style={{ color: '#666', fontSize: 10, fontFamily: 'monospace' }}>{label}</Text>
      <Text style={{ color, fontSize: 10, fontFamily: 'monospace', fontWeight: '700' }}>{val}</Text>
    </View>
  );

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
          {d.statusMsg.toUpperCase()}
        </Text>
        <Text style={{ color: '#444', fontSize: 9, fontFamily: 'monospace' }}>
          evt:{d.evtCount} ~{d.intervalMs}ms
        </Text>
      </View>

      {/* Botão ATIVAR SENSORES */}
      {(d.motionPerm === 'unknown') && (
        <TouchableOpacity
          onPress={requestPermission}
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
        {row('motion:', d.motionPerm, permColor(d.motionPerm))}
        {row('orient:', d.orientPerm, permColor(d.orientPerm))}
      </View>

      {/* Flags */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['AIG', 'ACC', 'RR', 'ORI'] as const).map((k, i) => {
          const v = [d.hasAIG, d.hasACC, d.hasRR, d.hasOri][i];
          return (
            <View key={k} style={{ backgroundColor: v ? '#4ade8022' : '#ff475722', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: v ? '#4ade80' : '#ff4757' }}>
              <Text style={{ color: v ? '#4ade80' : '#ff4757', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' }}>{k}</Text>
            </View>
          );
        })}
      </View>

      {/* Dados brutos */}
      <View style={{ backgroundColor: '#0d0d1a', borderRadius: 6, padding: 8, marginBottom: 8 }}>
        {row('AIG x/y/z:', `${d.aigX}  ${d.aigY}  ${d.aigZ}`, d.hasAIG ? '#ccc' : '#ff4757')}
        {row('ACC x/y/z:', `${d.accX}  ${d.accY}  ${d.accZ}`, d.hasACC ? '#ccc' : '#888')}
        {row('ori β/γ:',  `${d.oriBeta}  ${d.oriGamma}`, d.hasOri ? '#ccc' : '#888')}
      </View>

      {/* Pipeline */}
      <View style={{ backgroundColor: '#0d0d1a', borderRadius: 6, padding: 8 }}>
        {row('phase:', d.phase,    '#00d4ff')}
        {row('score:', d.score,    '#ffd700')}
        {row('amp:',   d.amp,      '#ffd700')}
        {row('reps:',  String(d.repCount), '#4ade80')}
        {row('reject:', d.reject,  d.reject === '—' ? '#555' : '#ffd700')}
      </View>
    </View>
  );
};
