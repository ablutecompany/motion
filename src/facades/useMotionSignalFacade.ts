import { useState, useCallback } from 'react';
import { signalCapabilitiesResolver } from '../services/motionSignalCapabilities';
import { SignalCapabilityStatus, MotionSignalEvidence, MotionInferenceEvidenceSource } from '../contracts/types';
import { trackEvent } from '../analytics/events';

/**
 * Facade Unificada V3.1 para Consumo de Sinais e OS Sensors
 * Atua como ponte disciplinada e isolada, sem poluir os motores V2.
 */
export const useMotionSignalFacade = () => {
  const [capabilitySnapshot] = useState<SignalCapabilityStatus>(() => 
    signalCapabilitiesResolver.resolveCurrentCapabilities()
  );

  /**
   * Avalia honestamente a disponibilidade atual para apoiar descrições na UX.
   */
  const getUIStatusMessage = (): { label: string; mode: 'unavailable' | 'available' } => {
    if (capabilitySnapshot.permissionState === 'denied' || capabilitySnapshot.permissionState === 'unsupported') {
      return { label: 'Sinais do dispositivo: indisponíveis', mode: 'unavailable' };
    }
    if (capabilitySnapshot.motionSensorsAvailable && capabilitySnapshot.permissionState === 'granted') {
      return { label: 'Sinais do dispositivo: disponíveis', mode: 'available' };
    }
    return { label: 'Sinais do dispositivo: indisponíveis', mode: 'unavailable' };
  };

  /**
   * Mock / Wrapper passivo de recolha temporal (V3.1 limit).
   * Neste fallback (Web/Mini-App) nunca há recolha biométrica pura implementada na V3.1.
   * Regressa sempre num nível degradado ou nulo para fomentar trigger de legacy heuristic.
   */
  const gatherSignalEvidence = useCallback((): MotionSignalEvidence | undefined => {
    // Se não houver permissão, falhamos silenciosamente a geração de real_evidence.
    if (capabilitySnapshot.permissionState !== 'granted' || !capabilitySnapshot.motionSensorsAvailable) {
      return undefined;
    }

    trackEvent('motion_v3_signal_gathering_attempted', { 
        reliability: capabilitySnapshot.sourceReliability 
    });

    // Simulador de recolha 'limited' autorizada
    // O fallback real daria um confidence < 0.3 nestes casos 'web', forçando o inference engine a preencher com heuristic.
    return {
      evidenceId: `SIG-EVD-${Date.now()}`,
      timeWindow: { 
        start: new Date(Date.now() - 30 * 60000).toISOString(), 
        end: new Date().toISOString() 
      },
      sources: ['accelerometer'],
      summary: { fallback_active: true },
      confidence: 0.1, // Confiança miserável propositadamente para acionar fallback da framework V2.6
      derivedFlags: ['weak_signal'],
      rawSampleCount: 0,
      permissionState: capabilitySnapshot.permissionState,
      capabilitySnapshot
    };
  }, [capabilitySnapshot]);

  /**
   * Função utilitária de UX para rótulos de origem coerentes
   */
  const translateEvidenceSource = (source?: MotionInferenceEvidenceSource): string => {
    switch (source) {
      case 'legacy_heuristic': return 'Inferido (heurística)';
      case 'hybrid': return 'Inferido (sinais + heurística)';
      case 'real_signal': return 'Inferido (sinais reais)';
      default: return 'Inferido';
    }
  };

  return {
    capabilitySnapshot,
    getUIStatusMessage,
    gatherSignalEvidence,
    translateEvidenceSource
  };
};
