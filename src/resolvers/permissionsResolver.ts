import { IntegrationManifestView } from '../contracts/types';

export const resolvePermissions = (
  rawPermissions: string[] | undefined,
  isDemo: boolean,
  isHistory: boolean
): IntegrationManifestView => {
  let effectivePermissions: string[] = [];

  if (isDemo) {
    // Demo: Local edits permitted, Write-backs blocked downstream logically.
    effectivePermissions = ['write_progress', 'write_setup'];
  } else if (isHistory) {
    // History: Strict visual readonly enforcement. No local edits allowed.
    effectivePermissions = []; 
  } else if (Array.isArray(rawPermissions)) {
    // Live: Apply injected payload safely.
    effectivePermissions = rawPermissions;
  }

  return {
    permissions: effectivePermissions,
    linkedModules: []
  };
};
