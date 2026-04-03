import { useMotionStore, selectors, storeActions } from '../../../store/useMotionStore';

export const useMotionProfileViewModel = () => {
  const profile = useMotionStore(selectors.selectMotionProfile);
  const universe = useMotionStore(selectors.selectUniverse);
  const phase = useMotionStore(selectors.selectPhase);

  const changeUniverse = (newUniverse: string) => {
    storeActions.setBootData({ universe: newUniverse });
  };

  return {
    profile,
    universe,
    phase,
    changeUniverse
  };
}; 
