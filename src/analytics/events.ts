import { hostBridge } from '../integration/hostBridge';

export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  hostBridge.emitAnalytics(eventName, properties);
};

export const MotionEvents = {
  HOME_VIEWED: 'motion_home_viewed',
  PLAN_VIEWED: 'motion_plan_viewed',
  PROGRESS_VIEWED: 'motion_progress_viewed',
  PROFILE_VIEWED: 'motion_profile_viewed',
  CONTEXT_VIEWED: 'motion_context_viewed',
  DEMO_BANNER_SHOWN: 'motion_demo_banner_shown',
  HISTORY_CONTEXT_SHOWN: 'motion_history_context_banner_shown',
  FALLBACK_SHOWN: 'motion_fallback_state_shown',
  BOOT_SUCCESS: 'motion_boot_success',
  BOOT_FALLBACK: 'motion_boot_fallback',
  BOOT_PAYLOAD_MALFORMED: 'motion_boot_payload_malformed',
  HOST_RECONCILIATION_TIMEOUT: 'motion_host_reconciliation_timeout',
  HOST_RECONCILIATION_REJECT: 'motion_host_reconciliation_reject',

  SESSION_VIEWED: 'motion_session_viewed',
  SESSION_COMPLETE_CLICKED: 'motion_session_complete_clicked',
  SESSION_COMPLETED_LOCAL: 'motion_session_completed_local',
  CONTRIBUTION_PREPARED: 'motion_contribution_prepared',
  WRITEBACK_SENT: 'motion_writeback_sent',
  WRITEBACK_BLOCKED_DEMO: 'motion_writeback_blocked_demo',
  WRITEBACK_BLOCKED_HISTORY: 'motion_writeback_blocked_history',
  WRITEBACK_FAILED: 'motion_writeback_failed',
  SESSION_READONLY_SHOWN: 'motion_session_readonly_shown',

  PROFILE_EDIT_OPENED: 'motion_profile_edit_opened',
  GOAL_UPDATED_LOCAL: 'motion_goal_updated_local',
  WEEKLY_AVAILABILITY_UPDATED_LOCAL: 'motion_weekly_availability_updated_local',
  TRAINING_ENVIRONMENT_UPDATED_LOCAL: 'motion_training_environment_updated_local',
  EQUIPMENT_UPDATED_LOCAL: 'motion_equipment_updated_local',
  PLAN_REGENERATION_REQUESTED: 'motion_plan_regeneration_requested',
  PLAN_READAPTED_LOCAL: 'motion_plan_readapted_local',
  PROFILE_WRITEBACK_PREPARED: 'motion_profile_writeback_prepared',
  PROFILE_WRITEBACK_SENT: 'motion_profile_writeback_sent',
  PROFILE_WRITEBACK_BLOCKED_DEMO: 'motion_profile_writeback_blocked_demo',
  PROFILE_WRITEBACK_BLOCKED_HISTORY: 'motion_profile_writeback_blocked_history',
  PROFILE_WRITEBACK_FAILED: 'motion_profile_writeback_failed',
  
  // Execution Layer Events
  EXECUTION_MODE_SELECTED: 'motion_execution_mode_selected',
  PLACEMENT_RECOMMENDED: 'motion_placement_recommended',
  CAPTURE_MODE_ACTIVATED: 'motion_capture_mode_activated',
  WORKOUT_SUSPECTED: 'motion_workout_suspected',
  WORKOUT_PROBABLE: 'motion_workout_probable',
  WORKOUT_CONFIRMED: 'motion_workout_confirmed',
  WORKOUT_DISMISSED: 'motion_workout_dismissed',
  WORKOUT_CONFIRMATION_SHOWN: 'motion_workout_confirmation_shown',
  WORKOUT_CONFIRMATION_DEFERRED: 'motion_workout_confirmation_deferred',
  WORKOUT_ENRICHED: 'motion_workout_enriched',

  // Post-Workout Enrichment
  ENRICHMENT_SHOWN: 'motion_workout_enrichment_shown',
  ENRICHMENT_SKIPPED: 'motion_workout_enrichment_skipped',
  ENRICHMENT_SAVED: 'motion_workout_enrichment_saved',

  // Passive Inference Events
  INFERRED_WORKOUT_DETECTED: 'motion_inferred_workout_detected',
  INFERRED_WORKOUT_PROMPT_SHOWN: 'motion_inferred_workout_prompt_shown',
  INFERRED_WORKOUT_CONFIRMED: 'motion_inferred_workout_confirmed',
  INFERRED_WORKOUT_DISMISSED: 'motion_inferred_workout_dismissed',
  INFERRED_WORKOUT_DEFERRED: 'motion_inferred_workout_deferred',
  
  // Progress & History
  WORKOUT_REFLECTED: 'motion_progress_workout_reflected',
  ENRICHED_WORKOUT_REFLECTED: 'motion_enriched_workout_reflected',
  ACTIVITY_HISTORY_ITEM_SHOWN: 'motion_activity_history_item_shown',
  
  // Wellness Impact
  WELLNESS_IMPACT_REFLECTED: 'motion_wellness_impact_reflected',
  WELLNESS_IMPACT_LOCAL_ONLY_SHOWN: 'motion_wellness_impact_local_only_shown',
  
  // Hardening Sync State
  WORKOUT_SYNC_STATUS_REFLECTED: 'motion_workout_sync_status_reflected',
  WORKOUT_SYNC_FAILED_REFLECTED: 'motion_workout_sync_failed_reflected',
  WORKOUT_SYNC_LOCAL_ONLY_REFLECTED: 'motion_workout_sync_local_only_reflected',
  WORKOUT_RECORD_UPDATED_ENRICHMENT: 'motion_workout_record_updated_with_enrichment'
};
