import { 
  ActiveMotionContext, 
  IntegrationManifestView 
} from '../contracts/types';
import { resolvePermissions } from '../resolvers/permissionsResolver';

export interface RawShellContext {
  activeAnalysisId?: string;
  activeAnalysisDate?: string;
  selectedHistoryEntry?: string;
  isDemo?: boolean;
  motionEligibilityStatus?: string;
  permissions?: string[];
  factualContext?: Record<string, any>;
}

export interface AdaptedShellContext {
  activeContext: ActiveMotionContext;
  isDemo: boolean;
  isHistory: boolean;
  permissions: IntegrationManifestView;
  isPartial: boolean;
}

export const adaptShellContext = (raw: RawShellContext): AdaptedShellContext => {
  const isHistory = Boolean(raw.selectedHistoryEntry);
  const isDemo = Boolean(raw.isDemo);
  const isPartial = !raw.activeAnalysisId && !isHistory && !isDemo;

  const validEligibility = ['eligible', 'limited', 'unknown'].includes(raw.motionEligibilityStatus || '') 
    ? (raw.motionEligibilityStatus as 'eligible' | 'limited' | 'unknown') 
    : 'unknown';

  const permissions = resolvePermissions(raw.permissions, isDemo, isHistory);

  return {
    activeContext: {
      analysisId: isHistory ? raw.selectedHistoryEntry! : (raw.activeAnalysisId || null),
      analysisDate: isHistory ? raw.selectedHistoryEntry! : (raw.activeAnalysisDate || null),
      motionEligibilityStatus: validEligibility,
      factualContext: raw.factualContext || {}
    },
    isDemo,
    isHistory,
    permissions,
    isPartial
  };
};
