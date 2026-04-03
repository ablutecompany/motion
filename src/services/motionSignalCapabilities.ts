import { SignalCapabilityStatus } from '../contracts/types';

/**
 * Resolver de Capabilities Isolado (V3.1)
 * Avalia de forma determinística e cross-platform a disponibilidade de sensores reais locais.
 * Em Web/PWA, reporta limitação honrando suporte parcial ou nulo ("unsupported").
 */
export const signalCapabilitiesResolver = {
  
  resolveCurrentCapabilities: (): SignalCapabilityStatus => {
    // 1. Deteção de Ambiente
    const isBrowser = typeof window !== 'undefined';
    const isNative = isBrowser && (window as any).ReactNativeWebView; 

    // Assume-se web primariamente se não houver injetores nativos claros.
    const environment = isNative ? 'native' : isBrowser ? 'web' : 'unknown';

    // 2. Deteção Parcial de Sensores Web (DeviceMotionEvent)
    let motionSensorsAvailable = false;
    let fallbackPermission: 'unknown' | 'unsupported' | 'denied' | 'prompt' | 'granted' = 'unsupported';
    
    if (isBrowser && typeof window.DeviceMotionEvent !== 'undefined') {
      motionSensorsAvailable = true;
      
      // O iOS 13+ requer permissão explícita `requestPermission`, caso exista o endpoint vamos tratar como 'prompt'
      // Se não existir o método de pedir permissão mas o objecto existir, a web API assume implicitamente 'granted'
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        fallbackPermission = 'prompt';
      } else {
        fallbackPermission = 'granted';
      }
    }

    // 3. Health Platform & Background Collection 
    // Em Modo Web (Base), nunca asseguramos background puro ou platform health sem PWA extensions complexos.
    const healthPlatformAvailable = false; 
    const backgroundCollectionAvailable = false;

    // 4. Source Reliability
    // Em Web, a fonte é `none` ou `limited` na ausência de HealthKit/GoogleFit
    let reliability: 'none' | 'limited' | 'usable' = 'none';
    if (motionSensorsAvailable && fallbackPermission === 'granted') {
        reliability = 'limited'; // Apenas sensores crus no browser, sujeitos a sleep tabs.
    }

    return {
      environment,
      motionSensorsAvailable,
      healthPlatformAvailable,
      backgroundCollectionAvailable,
      permissionState: fallbackPermission,
      sourceReliability: reliability
    };
  }

};
