import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MotionExecutionRuntimeState, 
  MotionExecutionBlockState,
  MotionGuidanceMode,
  MotionWakeLockStatus,
  MotionGuidanceStatus
} from '../contracts/types';
import { motionWakeLockService } from '../services/motionWakeLockService';
import { motionGuidanceService } from '../services/motionGuidanceService';
import { useMotionStore, selectors } from '../store/useMotionStore';
import { trackEvent } from '../analytics/events';

export const useMotionExecutionRuntimeFacade = (sessionId: string) => {
  const plan = useMotionStore(selectors.selectPlan);
  const currentExecutionMode = useMotionStore(selectors.selectExecutionProfile).preferredMode;
  const currentAmbientMode = useMotionStore(selectors.selectAmbientMode);

  // Initialize Blocks from existing Session
  const sessionData = plan?.sessions.find(s => s.id === sessionId);
  
  // Dummy Block Generator based on Plan duration
  const generateBlocks = (): MotionExecutionBlockState[] => {
    if (!sessionData) return [];
    const totalMins = sessionData.durationMinutes || 30;
    return [
      {
        blockId: `B-WARMUP-${Math.random()}`,
        title: 'Aquecimento',
        position: 0,
        total: 3,
        status: 'upcoming',
        targetDurationSeconds: 5 * 60,
        guidanceText: 'Prepara-te para iniciar fase de aferição.'
      },
      {
        blockId: `B-MAIN-${Math.random()}`,
        title: 'Trabalho Específico',
        position: 1,
        total: 3,
        status: 'upcoming',
        targetDurationSeconds: (totalMins - 10) * 60,
        guidanceText: 'Fase de esforço primária ativa.'
      },
      {
        blockId: `B-COOLDOWN-${Math.random()}`,
        title: 'Retorno à Calma',
        position: 2,
        total: 3,
        status: 'upcoming',
        targetDurationSeconds: 5 * 60,
        guidanceText: 'Descompressão e estabilização de batimento.'
      }
    ];
  };

  const [blocks, setBlocks] = useState<MotionExecutionBlockState[]>([]);
  const [runtimeState, setRuntimeState] = useState<MotionExecutionRuntimeState>({
    sessionStatus: 'idle',
    currentBlockIndex: 0,
    totalBlocks: 0,
    ambientModeActive: !!currentAmbientMode,
    wakeLockStatus: motionWakeLockService.getStatus(),
    guidanceStatus: motionGuidanceService.getStatus(),
    executionMode: currentExecutionMode
  });
  const [guidanceMode, setGuidanceMode] = useState<MotionGuidanceMode>('silent');

  // One Off Init
  useEffect(() => {
    const initBlocks = generateBlocks();
    setBlocks(initBlocks);
    setRuntimeState(s => ({ ...s, totalBlocks: initBlocks.length }));
  }, [sessionId, plan]);

  // Sync Ambient Store -> Runtime State
  useEffect(() => {
    setRuntimeState(s => ({ ...s, ambientModeActive: !!currentAmbientMode }));
  }, [currentAmbientMode]);

  // Sync Guidance Voice Availability safely
  useEffect(() => {
    const status = motionGuidanceService.getStatus();
    setRuntimeState(s => ({ ...s, guidanceStatus: status }));
    // If supported securely, we can start as text_only or voice defaults based on profile
    if (status === 'ready' && currentExecutionMode === 'guide') {
      setGuidanceMode('voice_optional');
    } else if (status !== 'unsupported') {
      setGuidanceMode('text_only');
    }
  }, [currentExecutionMode]);

  const intervalRef = useRef<any>(null);

  const requestWakeLockSafe = async () => {
    const status = await motionWakeLockService.requestLock();
    setRuntimeState(s => ({ ...s, wakeLockStatus: status }));
  };

  const releaseWakeLockSafe = async () => {
    await motionWakeLockService.releaseLock();
    setRuntimeState(s => ({ ...s, wakeLockStatus: motionWakeLockService.getStatus() }));
  };

  const startSession = useCallback(async () => {
    trackEvent('motion_runtime_session_started');
    setRuntimeState(s => ({ ...s, sessionStatus: 'running' }));
    
    // Attempt Wake Lock
    await requestWakeLockSafe();

    // Trigger TTS for first block
    if (blocks[0]) {
      const b = blocks[0];
      setBlocks(curr => curr.map((x, i) => i === 0 ? { ...x, status: 'active' } : x));
      motionGuidanceService.speakDiscrete(`Iniciando ${b.title}. ${b.guidanceText}`, guidanceMode);
    }
  }, [blocks, guidanceMode]);

  const pauseSession = useCallback(async () => {
    trackEvent('motion_runtime_session_paused');
    setRuntimeState(s => ({ ...s, sessionStatus: 'paused' }));
    await releaseWakeLockSafe();
    motionGuidanceService.stop();
  }, []);

  const resumeSession = useCallback(async () => {
    trackEvent('motion_runtime_session_resumed');
    setRuntimeState(s => ({ ...s, sessionStatus: 'running' }));
    await requestWakeLockSafe();
    
    const currBlock = blocks[runtimeState.currentBlockIndex];
    if (currBlock) {
      motionGuidanceService.speakDiscrete(`A retomar ${currBlock.title}.`, guidanceMode);
    }
  }, [blocks, runtimeState.currentBlockIndex, guidanceMode]);

  const setGuidanceLevel = (mode: MotionGuidanceMode) => {
    setGuidanceMode(mode);
    if (mode === 'silent') motionGuidanceService.stop();
  };

  // Safe Cleanup
  useEffect(() => {
    return () => {
      releaseWakeLockSafe();
      motionGuidanceService.stop();
    };
  }, []);

  return {
    runtimeState,
    blocks,
    guidanceMode,
    setGuidanceLevel,
    actions: {
      startSession,
      pauseSession,
      resumeSession
    }
  };
};
