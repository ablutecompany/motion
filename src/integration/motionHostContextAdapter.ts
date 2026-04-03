import { ActiveMotionContext, IntegrationManifestView } from '../contracts/types';
import { resolvePermissions } from '../resolvers/permissionsResolver';
import { HostInboundContext } from '../contracts/hostRuntimeContract';
import { trackEvent, MotionEvents } from '../analytics/events';

export interface AdaptedHostContext {
  activeContext: ActiveMotionContext;
  isDemo: boolean;
  isHistory: boolean;
  permissions: IntegrationManifestView;
  isPartial: boolean;
}

export const motionHostContextAdapter = {
  /**
   * Transforma o injeçao raw da Shell num domínio validado seguro
   * Providencia guard-rails contra payloads corrompidos ou parciais.
   */
  adapt: (raw?: HostInboundContext): AdaptedHostContext => {
    if (!raw) {
       trackEvent(MotionEvents.BOOT_PAYLOAD_MALFORMED, { error: 'Payload de arranque é Falsy' });
    }
    const inbound = raw || {};
    const isHistory = Boolean(inbound.selectedHistoryEntry);
    const isDemo = Boolean(inbound.isDemo);
    const isPartial = !inbound.activeAnalysisId && !isHistory && !isDemo;

    const validEligibility = ['eligible', 'limited', 'unknown'].includes(inbound.motionEligibilityStatus || '') 
      ? (inbound.motionEligibilityStatus as 'eligible' | 'limited' | 'unknown') 
      : 'unknown';

    const permissions = resolvePermissions(inbound.permissions, isDemo, isHistory);

    return {
      activeContext: {
        analysisId: isHistory ? inbound.selectedHistoryEntry! : (inbound.activeAnalysisId || null),
        analysisDate: isHistory ? inbound.selectedHistoryEntry! : (inbound.activeAnalysisDate || null),
        motionEligibilityStatus: validEligibility,
        factualContext: inbound.factualContext || {}
      },
      isDemo,
      isHistory,
      permissions,
      isPartial
    };
  }
};
