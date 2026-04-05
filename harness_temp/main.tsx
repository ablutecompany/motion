import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionRoot } from '../src/features/screens/MotionRoot';

// 1. Injetar window._motionDev = { ... } do harness validation
import { mountValidationHarness } from '../src/integration/motionHostValidationHarness';
mountValidationHarness();

const hostContextMock = {
  activeAnalysisId: 'analysis_123',
  activeAnalysisDate: new Date().toISOString(),
  motionEligibilityStatus: 'eligible',
  isDemo: false
};

const App = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <MotionRoot rawShellContext={hostContextMock} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
