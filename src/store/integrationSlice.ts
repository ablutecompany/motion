export interface IntegrationState {
  isDemoActive: boolean;
  isHistoryModeActive: boolean;
  hasPermissionsMap: boolean;
  shellSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

export const initialIntegrationState: IntegrationState = {
  isDemoActive: false,
  isHistoryModeActive: false,
  hasPermissionsMap: false,
  shellSyncStatus: 'idle'
};

// Aqui viverão no futuro os actions/reducers (ex: via Redux Toolkit ou Zustand)
// Exemplo em Zustand:
/*
import create from 'zustand';
export const useIntegrationStore = create<IntegrationState & { setDemo: (v: boolean) => void }>((set) => ({
  ...initialIntegrationState,
  setDemo: (val) => set({ isDemoActive: val })
}));
*/
