/**
 * V4.0 - Master Host Runtime Contracts
 * 
 * Este ficheiro estipula os Contratos Exatos e Reais aguardados na interface bidirecional
 * entre o Host Mestre (ablute_ wellness) e a Mini-App (_motion).
 */

// ---------------------------------------------------------
// 1. CONTRATOS DE ENTRADA (INBOUND BOOT CONTEXT)
// ---------------------------------------------------------

export interface HostInboundContext {
  activeAnalysisId?: string;
  activeAnalysisDate?: string;
  selectedHistoryEntry?: string;     // Se submetido, força arranque em Read-Only (Histórico)
  isDemo?: boolean;                  // Força bloqueio Offline/Sandbox
  motionEligibilityStatus?: 'eligible' | 'limited' | 'unknown';
  permissions?: string[];            // ['write_workouts', 'read_sensors', ...]
  factualContext?: Record<string, any>;
}

// ---------------------------------------------------------
// 2. CONTRATOS DE SAÍDA (OUTBOUND EVENTS)
// ---------------------------------------------------------

export type HostOutboundEventType = 
  | 'app_ready'
  | 'analytics_event'
  | 'contribution_event'
  | 'close_app'
  | 'context_request';

export interface HostOutboundMessage {
  appId: '_motion';
  version: '1.0.0';
  timestamp: string;
  type: HostOutboundEventType;
  payload?: any;
  messageId?: string; // Correlacionador para callbacks assíncronos (V4 real path)
}

// ---------------------------------------------------------
// 3. CONTRATOS DE RESPOSTA (HOST ACK / FAIL)
// ---------------------------------------------------------

export interface HostAckMessage {
  originalMessageId: string;
  status: 'success' | 'fail' | 'timeout';
  payload?: any;
}

// ---------------------------------------------------------
// 4. CONTRATOS DE FEEDBACK (HOST WEBHOOK)
// ---------------------------------------------------------

export interface HostInboundFeedbackEvent {
  workoutRecordId: string;
  actionableFlags?: string[]; // e.g. ["PRIORITIZE_RECOVERY", "DEMAND_CONSISTENCY"]
  domainsTouched?: string[];
  systemMessage?: string;
}
