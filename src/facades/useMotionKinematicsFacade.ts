import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { RepQualityEngine, RepPhase, QualityEngineState } from '../engines/repQualityEngine';

export type KinematicsSource = 'real_sensor' | 'simulated_dev' | 'unsupported' | 'permission_denied' | 'inactive';

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'not_required' | 'error';

export type SensorStatus = 'NO_EVENTS' | 'EVENTS_OK' | 'PARTIAL_DATA';

// Debug snapshot — tudo o que o painel de diagnóstico precisa
export interface SensorDebugSnapshot {
  sensorStatus: SensorStatus;
  lastMotionEventAgeMs: number;
  motionEventCount: number;
  orientationEventCount: number;
  motionIntervalMs: number;          // intervalo médio entre eventos motion
  // Raw de accelerationIncludingGravity
  aigX: number | null;
  aigY: number | null;
  aigZ: number | null;
  // Raw de acceleration (sem gravidade)
  accX: number | null;
  accY: number | null;
  accZ: number | null;
  // RotationRate
  rrAlpha: number | null;
  rrBeta: number | null;
  rrGamma: number | null;
  // Orientation
  oriAlpha: number | null;
  oriBeta: number | null;
  oriGamma: number | null;
  // Flags de presença
  hasAcceleration: boolean;
  hasAccelerationIncludingGravity: boolean;
  hasRotationRate: boolean;
  hasOrientation: boolean;
  // Pipeline
  currentPhase: RepPhase;
  currentScore: number;
  repCount: number;
  rejectionReason: string;
  // Permissões
  motionPermission: PermissionState;
  orientationPermission: PermissionState;
}

export interface KinematicState {
  visualGaugeProgress: number;
  effortValue: number;
  qualityTier: 'idle' | 'partial' | 'good' | 'excellent';
  effortState: 'low' | 'medium' | 'high' | 'redline';
  currentPhase: RepPhase;
  repProgress: number;
  executionQualityScore: number;
  celebrationTrigger: boolean;
  repCount: number;
  referenceROM: number | null;
  isSimulated: boolean;
  isAvailable: boolean;
  source: KinematicsSource;
  // Debug
  debug: SensorDebugSnapshot;
  // Ação de permissão — deve ser chamada de um gesto do utilizador
  requestSensorPermission: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// SIMULAÇÃO (dev/localhost)
// ---------------------------------------------------------------------------
function createSimulatedSupinoCycle(): (t: number) => { x: number; y: number; z: number } {
  const CYCLE_DURATION = 6.0;
  const cycleQuality = [1.0, 0.4, 0.9, 0.85, 0.2, 0.95];
  let cycleIndex = 0;
  let lastCycleT = 0;

  return (t: number) => {
    if (t - lastCycleT >= CYCLE_DURATION) {
      cycleIndex = (cycleIndex + 1) % cycleQuality.length;
      lastCycleT = t;
    }
    const q = cycleQuality[cycleIndex];
    const tInCycle = (t - lastCycleT) / CYCLE_DURATION;
    const noise = (Math.random() - 0.5) * (1 - q) * 4;

    if (tInCycle < 0.10) return { x: noise * 0.3, y: -9.81 + noise * 0.2, z: noise * 0.3 };
    if (tInCycle < 0.40) {
      const phaseT = (tInCycle - 0.10) / 0.30;
      if (q < 0.5) {
        const chaos = Math.sin(phaseT * Math.PI * 8) * 4;
        return { x: noise + chaos * 0.5, y: -9.81 - (phaseT * 8) + noise, z: noise + chaos * 0.3 };
      }
      const descent = Math.sin(phaseT * Math.PI * 0.5) * 5 * q;
      return { x: noise * 0.15, y: -9.81 - descent + noise * 0.3, z: noise * 0.15 };
    }
    if (tInCycle < 0.52) {
      const phaseT = (tInCycle - 0.40) / 0.12;
      const bottomBounce = Math.sin(phaseT * Math.PI) * 2 * q;
      return { x: noise * 0.2, y: -9.81 + bottomBounce + noise * 0.3, z: noise * 0.2 };
    }
    if (tInCycle < 0.82) {
      const phaseT = (tInCycle - 0.52) / 0.30;
      if (q < 0.5) {
        const chaos = Math.sin(phaseT * Math.PI * 6) * 5;
        return { x: noise + chaos * 0.4, y: -9.81 + (phaseT * 12) + noise, z: noise + chaos * 0.3 };
      }
      const ascent = Math.sin(phaseT * Math.PI * 0.5) * 6 * q;
      return { x: noise * 0.15, y: -9.81 + ascent + noise * 0.3, z: noise * 0.15 };
    }
    const lockoutJitter = q < 0.5 ? noise * 2 : noise * 0.15;
    return { x: lockoutJitter, y: -9.81 + 1.5 * q + lockoutJitter * 0.5, z: lockoutJitter };
  };
}

// ---------------------------------------------------------------------------
// HOOK PRINCIPAL
// ---------------------------------------------------------------------------

const DEFAULT_DEBUG: SensorDebugSnapshot = {
  sensorStatus: 'NO_EVENTS',
  lastMotionEventAgeMs: -1,
  motionEventCount: 0,
  orientationEventCount: 0,
  motionIntervalMs: 0,
  aigX: null, aigY: null, aigZ: null,
  accX: null, accY: null, accZ: null,
  rrAlpha: null, rrBeta: null, rrGamma: null,
  oriAlpha: null, oriBeta: null, oriGamma: null,
  hasAcceleration: false,
  hasAccelerationIncludingGravity: false,
  hasRotationRate: false,
  hasOrientation: false,
  currentPhase: 'idle',
  currentScore: 0,
  repCount: 0,
  rejectionReason: '—',
  motionPermission: 'unknown',
  orientationPermission: 'unknown',
};

export const useMotionKinematicsFacade = (active: boolean = true): KinematicState => {
  const engineRef    = useRef<RepQualityEngine>(new RepQualityEngine());
  const simulatorRef = useRef(createSimulatedSupinoCycle());
  const sourceRef    = useRef<KinematicsSource>('inactive');

  const [engineState, setEngineState] = useState<QualityEngineState>({
    currentPhase: 'idle',
    repProgress: 0,
    visualGaugeProgress: 0,
    executionQualityScore: 0,
    repCount: 0,
    celebrationTrigger: false,
    referenceROM: null,
    lastRepResult: null,
    rejectionReason: '—',
  });
  const [source, setSource]   = useState<KinematicsSource>('inactive');
  const [debug, setDebug]     = useState<SensorDebugSnapshot>(DEFAULT_DEBUG);
  const debugRef              = useRef<SensorDebugSnapshot>({ ...DEFAULT_DEBUG });

  const receivedRealDataRef   = useRef(false);
  const listenersAttachedRef  = useRef(false);

  // Timestamps para calcular intervalo de eventos
  const lastMotionTsRef       = useRef<number>(0);
  const motionIntervalSumRef  = useRef<number>(0);
  const motionIntervalCountRef = useRef<number>(0);

  // Última razão de rejeição (pipeline)
  const lastRejectionRef = useRef<string>('—');
  const lastAmplitudeRef = useRef<number>(0);

  // ── Flush do debug para o estado React (throttled a 4 Hz) ────────────────
  const debugFlushRef = useRef<number>(0);
  const flushDebug = () => {
    const now = Date.now();
    if (now - debugFlushRef.current > 250) {
      debugFlushRef.current = now;
      setDebug({ ...debugRef.current });
    }
  };

  // ── Handler de motion ────────────────────────────────────────────────────
  const handleMotionRef = useRef<((e: any) => void) | null>(null);
  const handleOrientationRef = useRef<((e: any) => void) | null>(null);

  // ── Inicialização de listeners (reusável após permissão) ─────────────────
  const attachListeners = useCallback(() => {
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    const engine = engineRef.current;

    handleMotionRef.current = (event: any) => {
      const now = Date.now();
      const aig = event.accelerationIncludingGravity;
      const acc = event.acceleration;
      const rr  = event.rotationRate;

      // ── Atualizar debug raw ──────────────────────────────────────────────
      const prevCount = debugRef.current.motionEventCount;
      const interval = prevCount > 0 && lastMotionTsRef.current > 0
        ? now - lastMotionTsRef.current : 0;
      if (interval > 0) {
        motionIntervalSumRef.current += interval;
        motionIntervalCountRef.current += 1;
      }
      lastMotionTsRef.current = now;

      const hasAIG = !!(aig && aig.x !== null && aig.y !== null);
      const hasAcc = !!(acc && acc.x !== null && acc.y !== null);
      const hasRR  = !!(rr && rr.alpha !== null);

      // Determinar status
      let status: SensorStatus = 'NO_EVENTS';
      if (hasAIG || hasAcc) {
        status = (hasAIG && hasAcc) ? 'EVENTS_OK' : 'PARTIAL_DATA';
      }
      if (!hasAIG && !hasAcc) {
        status = 'PARTIAL_DATA'; // evento chegou mas sem aceleração utilizável
      }
      if (prevCount === 0 && !hasAIG && !hasAcc) {
        lastRejectionRef.current = 'acc null — sem dados de aceleração';
      }

      debugRef.current = {
        ...debugRef.current,
        sensorStatus: status,
        lastMotionEventAgeMs: 0,
        motionEventCount: prevCount + 1,
        motionIntervalMs: motionIntervalCountRef.current > 0
          ? Math.round(motionIntervalSumRef.current / motionIntervalCountRef.current) : 0,
        aigX: aig?.x ?? null, aigY: aig?.y ?? null, aigZ: aig?.z ?? null,
        accX: acc?.x ?? null, accY: acc?.y ?? null, accZ: acc?.z ?? null,
        rrAlpha: rr?.alpha ?? null, rrBeta: rr?.beta ?? null, rrGamma: rr?.gamma ?? null,
        hasAcceleration: hasAcc,
        hasAccelerationIncludingGravity: hasAIG,
        hasRotationRate: hasRR,
        repCount: debugRef.current.repCount,
        rejectionReason: debugRef.current.rejectionReason,
      };
      flushDebug();

      // ── Pipeline: escolher fonte de dados ────────────────────────────────
      // PRIORIDADE: AIG > ACC  (invertida relativamente ao draft inicial)
      //
      // Razão física para supino:
      //  • ACC (linear acceleration sem gravidade): ~0 durante descida/subida
      //    a velocidade constante — apenas espica em arranque/travagem.
      //    Não representa a trajectória do arco de movimento contínuo.
      //  • AIG (accelerationIncludingGravity): inclui sempre o vector de
      //    gravidade (~9.81). Quando o braço roda no arco do supino, o
      //    componente de gravidade projectado em Y varia continuamente —
      //    comporta-se como inclinómetro implícito e dá sinal robusto
      //    mesmo em movimentos lentos e controlados.
      // O motor subtrai GRAVITY via magnitude vs GRAVITY, pelo que AIG
      // produz amplitudeDelta válido para detecção de fase e ROM.
      // ACC é útil para lateralNoise (X/Z variance) e impulsos — mantido
      // como fallback para dispositivos que não expõem AIG.
      let useX: number | null = null;
      let useY: number | null = null;
      let useZ: number | null = null;

      if (hasAIG) {
        // PRIMARY: accelerationIncludingGravity — sinal contínuo de orientação
        useX = aig!.x; useY = aig!.y; useZ = aig!.z;
      } else if (hasAcc) {
        // FALLBACK: acceleration pura — impulsos e dispositivos sem AIG
        useX = acc!.x; useY = acc!.y; useZ = acc!.z;
      }

      if (useX !== null && useY !== null) {
        receivedRealDataRef.current = true;

        if (sourceRef.current !== 'real_sensor') {
          sourceRef.current = 'real_sensor';
          setSource('real_sensor');
        }

        const newState = engine.processSample({
          x: useX,
          y: useY,
          z: useZ ?? 0,
          timestamp: now,
        });

        // Actualizar fase no debug
        debugRef.current.currentPhase = newState.currentPhase;
        debugRef.current.currentScore = newState.executionQualityScore;
        debugRef.current.repCount     = newState.repCount;
        debugRef.current.rejectionReason = newState.rejectionReason;

        setEngineState({ ...newState });
      } else {
        // Evento chegou mas sem dados utilizáveis (nem AIG nem ACC com valores não-null)
        lastRejectionRef.current = 'aig e acc null/undefined — evento sem dados úteis';
        debugRef.current.rejectionReason = lastRejectionRef.current;
        debugRef.current.sensorStatus = 'PARTIAL_DATA';
        flushDebug();
      }
    };

    handleOrientationRef.current = (event: any) => {
      const prevCount = debugRef.current.orientationEventCount;
      debugRef.current = {
        ...debugRef.current,
        orientationEventCount: prevCount + 1,
        oriAlpha: event.alpha ?? null,
        oriBeta:  event.beta  ?? null,
        oriGamma: event.gamma ?? null,
        hasOrientation: event.alpha !== null,
      };
      flushDebug();
    };

    window.addEventListener('devicemotion',      handleMotionRef.current,      true);
    window.addEventListener('deviceorientation', handleOrientationRef.current!, true);
  }, []);

  // ── Pedir permissão (deve ser chamado de um gesto, ex: botão) ────────────
  const requestSensorPermission = useCallback(async () => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    if (!isWeb) return;

    let motionPerm: PermissionState  = 'not_required';
    let orientPerm: PermissionState  = 'not_required';

    // iOS 13+ requer requestPermission()
    const dme = (window as any).DeviceMotionEvent;
    const doe = (window as any).DeviceOrientationEvent;

    if (dme && typeof dme.requestPermission === 'function') {
      try {
        const result = await dme.requestPermission();
        motionPerm = result === 'granted' ? 'granted' : 'denied';
      } catch {
        motionPerm = 'error';
      }
    } else if ('DeviceMotionEvent' in window) {
      motionPerm = 'not_required'; // Android / desktop — não exige permissão explícita
    } else {
      motionPerm = 'denied'; // browser sem suporte
    }

    if (doe && typeof doe.requestPermission === 'function') {
      try {
        const result = await doe.requestPermission();
        orientPerm = result === 'granted' ? 'granted' : 'denied';
      } catch {
        orientPerm = 'error';
      }
    } else if ('DeviceOrientationEvent' in window) {
      orientPerm = 'not_required';
    } else {
      orientPerm = 'denied';
    }

    debugRef.current = {
      ...debugRef.current,
      motionPermission: motionPerm,
      orientationPermission: orientPerm,
    };
    setDebug({ ...debugRef.current });

    // Se permissão concedida, ligar listeners agora
    if (motionPerm === 'granted' || motionPerm === 'not_required') {
      attachListeners();
    }
  }, [attachListeners]);

  // ── Effect principal ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) {
      setSource('inactive');
      engineRef.current.reset();
      listenersAttachedRef.current = false;
      return;
    }

    const isWeb       = Platform.OS === 'web';
    const isLocalhost = isWeb && typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let animFrame: number;
    let startTime  = Date.now();
    const engine   = engineRef.current;
    engine.reset();
    receivedRealDataRef.current = false;
    listenersAttachedRef.current = false;

    // ── Tick ──────────────────────────────────────────────────────────────
    let lastPublish = 0;
    const tick = () => {
      const now = Date.now();
      const t   = (now - startTime) / 1000;

      // Actualizar idade do último evento
      if (debugRef.current.lastMotionEventAgeMs >= 0 && lastMotionTsRef.current > 0) {
        debugRef.current.lastMotionEventAgeMs = now - lastMotionTsRef.current;
        if (now - debugFlushRef.current > 250) {
          setDebug({ ...debugRef.current });
          debugFlushRef.current = now;
        }
      }

      if (sourceRef.current === 'simulated_dev') {
        const sim = simulatorRef.current(t);
        const newState = engine.processSample({ ...sim, timestamp: now });
        if (now - lastPublish > 33) {
          lastPublish = now;
          setEngineState({ ...newState });
        }
      }

      animFrame = requestAnimationFrame(tick);
    };

    // ── Inicialização ─────────────────────────────────────────────────────
    if (isWeb && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const dme = (window as any).DeviceMotionEvent;
      const needsPermission = typeof dme?.requestPermission === 'function';

      if (needsPermission) {
        // iOS: NÃO ligar listeners automaticamente — aguardar botão "Ativar sensores"
        sourceRef.current = 'unsupported';
        setSource('unsupported');
        debugRef.current = {
          ...debugRef.current,
          motionPermission: 'unknown',
          sensorStatus: 'NO_EVENTS',
          rejectionReason: 'iOS: toque em "Ativar sensores" para pedir permissão',
        };
        setDebug({ ...debugRef.current });
      } else {
        // Android / desktop: ligar directamente
        attachListeners();
        sourceRef.current = 'real_sensor';
        setSource('real_sensor');
        debugRef.current = {
          ...debugRef.current,
          motionPermission: 'not_required',
          orientationPermission: 'not_required',
        };

        // Fallback: sem dados em 2.5s → simulado (localhost) ou unsupported
        setTimeout(() => {
          if (!receivedRealDataRef.current) {
            if (isLocalhost) {
              sourceRef.current = 'simulated_dev';
              startTime = Date.now();
              setSource('simulated_dev');
            } else {
              sourceRef.current = 'unsupported';
              setSource('unsupported');
              debugRef.current = {
                ...debugRef.current,
                sensorStatus: 'NO_EVENTS',
                rejectionReason: 'Sem eventos DeviceMotion após 2.5s',
              };
              setDebug({ ...debugRef.current });
            }
          }
        }, 2500);
      }
    } else {
      if (isLocalhost) {
        sourceRef.current = 'simulated_dev';
        setSource('simulated_dev');
      } else {
        setSource('unsupported');
      }
    }

    tick();

    return () => {
      if (typeof window !== 'undefined') {
        if (handleMotionRef.current)
          window.removeEventListener('devicemotion', handleMotionRef.current, true);
        if (handleOrientationRef.current)
          window.removeEventListener('deviceorientation', handleOrientationRef.current!, true);
      }
      cancelAnimationFrame(animFrame);
      listenersAttachedRef.current = false;
    };
  }, [active, attachListeners]);

  // ── Derivar tier de qualidade ────────────────────────────────────────────
  const q = engineState.executionQualityScore;
  const qualityTier: KinematicState['qualityTier'] =
    q >= 0.88 ? 'excellent' :
    q >= 0.55 ? 'good' :
    q >= 0.25 ? 'partial' :
    'idle';

  const effortStateMap: Record<KinematicState['qualityTier'], KinematicState['effortState']> = {
    excellent: 'redline', good: 'high', partial: 'medium', idle: 'low',
  };

  return {
    visualGaugeProgress: engineState.visualGaugeProgress,
    effortValue:         engineState.visualGaugeProgress,
    qualityTier,
    effortState:         effortStateMap[qualityTier],
    currentPhase:        engineState.currentPhase,
    repProgress:         engineState.repProgress,
    executionQualityScore: engineState.executionQualityScore,
    celebrationTrigger:  engineState.celebrationTrigger,
    repCount:            engineState.repCount,
    rejectionReason:     engineState.rejectionReason,
    referenceROM:        engineState.referenceROM,
    isSimulated:         source === 'simulated_dev',
    isAvailable:         source === 'real_sensor' || source === 'simulated_dev',
    source,
    debug,
    requestSensorPermission,
  };
};
