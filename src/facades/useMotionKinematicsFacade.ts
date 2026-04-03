import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export type KinematicsSource = 'real_sensor' | 'simulated_dev' | 'unsupported' | 'permission_denied' | 'inactive';

export interface KinematicState {
  effortValue: number; // 0 to 100
  effortState: 'low' | 'medium' | 'high' | 'redline';
  isSimulated: boolean;
  isAvailable: boolean;
  source: KinematicsSource;
}

export const useMotionKinematicsFacade = (active: boolean = true): KinematicState => {
  const [effortValue, setEffortValue] = useState(0);
  const [source, setSource] = useState<KinematicsSource>('inactive');
  
  const rawTargetRef = useRef(0);
  const currentEffortRef = useRef(0);
  const receivedRealDataRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setSource('inactive');
      setEffortValue(0);
      return;
    }

    let localSource: KinematicsSource = 'unsupported';
    const isWeb = Platform.OS === 'web';
    const isLocalhost = isWeb && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const handleMotion = (event: any) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (acc && acc.x !== null && acc.y !== null) {
        receivedRealDataRef.current = true;
        const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + (acc.z ? acc.z * acc.z : 0));
        
        // Remoção da gravidade base (9.8m/s^2)
        const delta = Math.abs(mag - 9.8); 
        
        // Ganho de escala: um sprint ou saltos podem chegar aos 20m/s^2 delta.
        // Capamos o esforço aos 100
        let effort = (delta / 15) * 100;
        rawTargetRef.current = Math.min(100, Math.max(0, effort));
        
        if (localSource !== 'real_sensor') {
           localSource = 'real_sensor';
           setSource('real_sensor');
        }
      }
    };

    if (isWeb && typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      localSource = 'real_sensor';
      window.addEventListener('devicemotion', handleMotion);
      setSource('real_sensor');
      
      // Fallback timer: se não recebermos dados em 2s (ex: PC sem sensor)
      setTimeout(() => {
          if (!receivedRealDataRef.current) {
              if (isLocalhost) {
                  localSource = 'simulated_dev';
                  setSource('simulated_dev');
              } else {
                  localSource = 'unsupported';
                  setSource('unsupported');
              }
          }
      }, 2000);

    } else {
      if (isLocalhost) {
        localSource = 'simulated_dev';
        setSource('simulated_dev');
      } else {
        setSource('unsupported');
      }
    }

    const startTime = Date.now();
    let animFrame: number;
    let lastPublish = 0;

    const tick = () => {
       if (localSource === 'simulated_dev') {
          // Gerador Matemático Orgânico (Séries Táticas - Effort Spikes com rest)
          const t = (Date.now() - startTime) / 1000;
          // Ondulação macro 
          const baseWave = Math.sin(t * 0.8);
          if (baseWave > 0) {
             // Fase Ativa (Esforço)
             const jitter = Math.sin(t * 20) * 8 + Math.random() * 4;
             rawTargetRef.current = Math.min(100, Math.max(0, (baseWave * 60) + 20 + jitter));
          } else {
             // Fase Descanso Base
             const restJitter = Math.random() * 2;
             rawTargetRef.current = Math.min(100, Math.max(0, 5 + restJitter));
          }
       } else if (localSource === 'unsupported' || localSource === 'permission_denied') {
          rawTargetRef.current = 0;
       }

       // Low Pass Filter Limitadores de "Tremor Inseto" -> Fluidez Premium
       const alpha = 0.12; 
       currentEffortRef.current = currentEffortRef.current * (1 - alpha) + rawTargetRef.current * alpha;

       // Batch React UI Updates at ~30 FPS
       const now = Date.now();
       if (now - lastPublish > 33) {
          lastPublish = now;
          setEffortValue(currentEffortRef.current);
       }

       animFrame = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (isWeb && typeof window !== 'undefined') {
         window.removeEventListener('devicemotion', handleMotion);
      }
      cancelAnimationFrame(animFrame);
    };
  }, [active]);

  let effortState: KinematicState['effortState'] = 'low';
  if (effortValue >= 85) effortState = 'redline';
  else if (effortValue >= 55) effortState = 'high';
  else if (effortValue >= 25) effortState = 'medium';

  return {
    effortValue,
    effortState,
    isSimulated: source === 'simulated_dev',
    isAvailable: source === 'real_sensor' || source === 'simulated_dev',
    source
  };
};
