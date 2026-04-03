import { ExecutionBlock, PlacementRecommendation, CaptureMode, FallbackMode } from '../contracts/types';
import { trackEvent, MotionEvents } from '../analytics/events';

export const resolveBlockPlacement = (exerciseType: string, expectedPrecision: number): Partial<ExecutionBlock> => {
  let recommendation: PlacementRecommendation = 'none';
  let mode: CaptureMode = 'passive';
  let fallback: FallbackMode = 'continue_without_capture';

  if (exerciseType.includes('repeticao_marcada')) {
    recommendation = 'forearm';
    mode = 'repetition_tracking';
  } else if (exerciseType.includes('corrida')) {
    recommendation = 'pocket';
    mode = 'timed';
  } else if (exerciseType.includes('forca_estatica')) {
    recommendation = 'surface';
    mode = 'set_tracking';
  }

  trackEvent(MotionEvents.PLACEMENT_RECOMMENDED, { exerciseType, recommendation });

  return {
    placementRecommendation: recommendation,
    captureMode: mode,
    fallbackMode: fallback,
    captureConfidence: expectedPrecision
  };
};
