// Feature flags — flip these to enable/disable UI features per deployment.
// SETTINGS_ENABLED: show/hide the Settings panel and button.
//   false = config baked in via .env.local (default for hosted deployments)
//   true  = Settings panel visible at runtime (use for customer demos / multi-tenant)
export const SETTINGS_ENABLED = false
