import { MotionProfile, Universe } from '../contracts/types';

export const universeEngine = {
  suggestUniverse: (profile: MotionProfile): Universe | null => {
    if (profile.universe) return profile.universe;

    // TODO: Implementar matriz de inferência probabilística quando fechada a taxonomia transversal.
    // Devolve null para forçar seleção explícita do utilizador pelo fluxo inicial.
    return null; 
  }
};
