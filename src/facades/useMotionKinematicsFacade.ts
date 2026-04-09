import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { RepQualityEngine, RepPhase, QualityEngineState } from '../engines/repQualityEngine';

export type KinematicsSource = 'real_sensor' | 'simulated_dev' | 'unsupported' | 'permission_denied' | 'inactive';

export interface KinematicState {
  // Gauge visual (0..100) — baseado em qualidade de execução, não velocidade bruta
  visualGaugeProgress: number;
  // Para compatibilidade retroativa chamado effortValue — alias de visualGaugeProgress
  effortValue: number;
  // Classificação da qualidade (substitui effortState baseado em rawMotion)
  qualityTier: 'idle' | 'partial' | 'good' | 'excellent';
  // Para compatibilidade retroativa
  effortState: 'low' | 'medium' | 'high' | 'redline';
  // Fase atual da repetição
  currentPhase: RepPhase;
  // Progresso dentro da repetição (0..1)
  repProgress: number;
  // Score de qualidade técnica (0..1)
  executionQualityScore: number;
  // Trigger de microcelebração (execução excelente)
  celebrationTrigger: boolean;
  // Número de repetições detetadas
  repCount: number;
  // Referência de amplitude calibrada na 1ª rep
  referenceROM: number | null;
  // Metadados de fonte
  isSimulated: boolean;
  isAvailable: boolean;
  source: KinematicsSource;
}

// ---------------------------------------------------------------------------
// GERADOR DE SIMULAÇÃO REALISTA DE SUPINO (dev / localhost)
// ---------------------------------------------------------------------------
// Simula ciclos plausíveis de supino com variação de qualidade:
// bom → mau → bom → bom → caótico → bom
// ---------------------------------------------------------------------------
function createSimulatedSupinoCycle(): (t: number) => { x: number; y: number; z: number } {
  const CYCLE_DURATION = 6.0; // segundos por rep
  const cycleQuality = [1.0, 0.4, 0.9, 0.85, 0.2, 0.95]; // qualidades alternadas
  let cycleIndex = 0;
  let lastCycleT = 0;

  return (t: number) => {
    // Detectar novo ciclo
    if (t - lastCycleT >= CYCLE_DURATION) {
      cycleIndex = (cycleIndex + 1) % cycleQuality.length;
      lastCycleT = t;
    }

    const q = cycleQuality[cycleIndex]; // 0=mau, 1=perfeito
    const tInCycle = (t - lastCycleT) / CYCLE_DURATION; // 0..1
    const noise = (Math.random() - 0.5) * (1 - q) * 4; // mais ruído se má qualidade

    // ---------- FASE: REPOUSO (0..10%) ----------
    if (tInCycle < 0.10) {
      return { x: noise * 0.3, y: -9.81 + noise * 0.2, z: noise * 0.3 };
    }

    // ---------- FASE: DESCIDA EXCÊNTRICA (10%..40%) ----------
    if (tInCycle < 0.40) {
      const phaseT = (tInCycle - 0.10) / 0.30;
      if (q < 0.5) {
        // Descida caótica: rápida e com saltos
        const chaos = Math.sin(phaseT * Math.PI * 8) * 4;
        return { x: noise + chaos * 0.5, y: -9.81 - (phaseT * 8) + noise, z: noise + chaos * 0.3 };
      }
      // Descida controlada: aceleração suave em Y
      const descent = Math.sin(phaseT * Math.PI * 0.5) * 5 * q;
      return { x: noise * 0.15, y: -9.81 - descent + noise * 0.3, z: noise * 0.15 };
    }

    // ---------- FASE: FUNDO / PAUSA (40%..52%) ----------
    if (tInCycle < 0.52) {
      const phaseT = (tInCycle - 0.40) / 0.12;
      // Ligeira inversão de Y no fundo
      const bottomBounce = Math.sin(phaseT * Math.PI) * 2 * q;
      return { x: noise * 0.2, y: -9.81 + bottomBounce + noise * 0.3, z: noise * 0.2 };
    }

    // ---------- FASE: SUBIDA CONCÊNTRICA (52%..82%) ----------
    if (tInCycle < 0.82) {
      const phaseT = (tInCycle - 0.52) / 0.30;
      if (q < 0.5) {
        // Subida explosiva/caótica
        const chaos = Math.sin(phaseT * Math.PI * 6) * 5;
        return { x: noise + chaos * 0.4, y: -9.81 + (phaseT * 12) + noise, z: noise + chaos * 0.3 };
      }
      // Subida controlada: desaceleração em Y
      const ascent = Math.sin(phaseT * Math.PI * 0.5) * 6 * q;
      return { x: noise * 0.15, y: -9.81 + ascent + noise * 0.3, z: noise * 0.15 };
    }

    // ---------- FASE: TOPO / LOCKOUT (82%..100%) ----------
    const lockoutJitter = q < 0.5 ? noise * 2 : noise * 0.15;
    return { x: lockoutJitter, y: -9.81 + 1.5 * q + lockoutJitter * 0.5, z: lockoutJitter };
  };
}

// ---------------------------------------------------------------------------
// HOOK PRINCIPAL
// ---------------------------------------------------------------------------

export const useMotionKinematicsFacade = (active: boolean = true): KinematicState => {
  const engineRef = useRef<RepQualityEngine>(new RepQualityEngine());
  const simulatorRef = useRef(createSimulatedSupinoCycle());
  const sourceRef = useRef<KinematicsSource>('inactive');

  const [engineState, setEngineState] = useState<QualityEngineState>({
    currentPhase: 'idle',
    repProgress: 0,
    visualGaugeProgress: 0,
    executionQualityScore: 0,
    repCount: 0,
    celebrationTrigger: false,
    referenceROM: null,
    lastRepResult: null,
  });
  const [source, setSource] = useState<KinematicsSource>('inactive');

  const receivedRealDataRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setSource('inactive');
      engineRef.current.reset();
      return;
    }

    const isWeb = Platform.OS === 'web';
    const isLocalhost =
      isWeb &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    let localSource: KinematicsSource = 'unsupported';
    let animFrame: number;
    let startTime = Date.now();
    const engine = engineRef.current;
    engine.reset();

    // ── Handler de sensor real ─────────────────────────────────────────────
    const handleMotion = (event: any) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (acc && acc.x !== null && acc.y !== null) {
        receivedRealDataRef.current = true;

        if (localSource !== 'real_sensor') {
          localSource = 'real_sensor';
          sourceRef.current = 'real_sensor';
          setSource('real_sensor');
        }

        const newState = engine.processSample({
          x: acc.x ?? 0,
          y: acc.y ?? 0,
          z: acc.z ?? 0,
          timestamp: Date.now(),
        });

        setEngineState({ ...newState });
      }
    };

    // ── Tick (simulação + UI flush) ────────────────────────────────────────
    let lastPublish = 0;
    const tick = () => {
      const now = Date.now();
      const t = (now - startTime) / 1000;

      if (localSource === 'simulated_dev') {
        const sim = simulatorRef.current(t);
        const newState = engine.processSample({ ...sim, timestamp: now });

        if (now - lastPublish > 33) {
          lastPublish = now;
          setEngineState({ ...newState });
        }
      } else if (localSource === 'real_sensor') {
        // O estado é atualizado pelo handleMotion — só garantimos o frame
        if (now - lastPublish > 33) {
          lastPublish = now;
        }
      }
      // unsupported: gauge fica em 0 (já está no estado inicial)

      animFrame = requestAnimationFrame(tick);
    };

    // ── Inicialização de fonte ─────────────────────────────────────────────
    if (isWeb && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      localSource = 'real_sensor';
      sourceRef.current = 'real_sensor';
      window.addEventListener('devicemotion', handleMotion);
      setSource('real_sensor');

      // Fallback: sem dados reais em 2s → simular ou marcar unsupported
      setTimeout(() => {
        if (!receivedRealDataRef.current) {
          if (isLocalhost) {
            localSource = 'simulated_dev';
            sourceRef.current = 'simulated_dev';
            startTime = Date.now(); // re-calibrar tempo do simulador
            setSource('simulated_dev');
          } else {
            localSource = 'unsupported';
            sourceRef.current = 'unsupported';
            setSource('unsupported');
          }
        }
      }, 2000);
    } else {
      if (isLocalhost) {
        localSource = 'simulated_dev';
        sourceRef.current = 'simulated_dev';
        setSource('simulated_dev');
      } else {
        setSource('unsupported');
      }
    }

    tick();

    return () => {
      if (isWeb && typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
      cancelAnimationFrame(animFrame);
    };
  }, [active]);

  // ── Derivar tier de qualidade ──────────────────────────────────────────
  const q = engineState.executionQualityScore;
  const qualityTier: KinematicState['qualityTier'] =
    q >= 0.88 ? 'excellent' :
    q >= 0.55 ? 'good' :
    q >= 0.25 ? 'partial' :
    'idle';

  // Compatibilidade: effortState mapeado a partir de qualityTier
  const effortStateMap: Record<KinematicState['qualityTier'], KinematicState['effortState']> = {
    excellent: 'redline',
    good:      'high',
    partial:   'medium',
    idle:      'low',
  };

  return {
    visualGaugeProgress: engineState.visualGaugeProgress,
    effortValue: engineState.visualGaugeProgress, // alias retroativo
    qualityTier,
    effortState: effortStateMap[qualityTier],
    currentPhase: engineState.currentPhase,
    repProgress: engineState.repProgress,
    executionQualityScore: engineState.executionQualityScore,
    celebrationTrigger: engineState.celebrationTrigger,
    repCount: engineState.repCount,
    referenceROM: engineState.referenceROM,
    isSimulated: source === 'simulated_dev',
    isAvailable: source === 'real_sensor' || source === 'simulated_dev',
    source,
  };
};
