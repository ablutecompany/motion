export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  console.log(`[ANALYTICS] Registado evento: ${eventName}`, properties);
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
};
