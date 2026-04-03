import { useMotionStore, selectors } from '../../../store/useMotionStore';
import { useMotionExecutionRuntimeFacade } from '../../../facades/useMotionExecutionRuntimeFacade';

export const useMotionSessionViewModel = (sessionId: string) => {
  const universe = useMotionStore(selectors.selectUniverse);
  const profile = useMotionStore(selectors.selectMotionProfile);
  const runtimeCore = useMotionExecutionRuntimeFacade(sessionId);

  return {
    universe,
    profile,
    runtimeState: runtimeCore.runtimeState,
    blocks: runtimeCore.blocks,
    guidanceMode: runtimeCore.guidanceMode,
    actions: runtimeCore.actions
  };
}; 
