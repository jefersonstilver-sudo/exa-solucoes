// ============================================
// EXPORTAÇÕES CENTRALIZADAS - EMAIL TEMPLATES
// ============================================
// 🔄 FORÇAR REDEPLOY: 2025-11-13T00:42:00Z - v2.0.0
// ✅ Sistema moderno de templates com gradientes profissionais

// Base
export { 
  EXA_LOGO_URL, 
  EXA_COLORS, 
  BASE_STYLES, 
  createHeader, 
  createFooter, 
  createEmailTemplate 
} from './base.ts';

// Types
export type {
  EmailBaseData,
  ConfirmationEmailData,
  PasswordRecoveryEmailData,
  AdminWelcomeEmailData,
  VideoSubmittedEmailData,
  VideoApprovedEmailData,
  VideoRejectedEmailData,
  BenefitInvitationEmailData,
  BenefitGiftCodeEmailData,
  RoleInfo
} from './types.ts';

// Auth Templates
export {
  createConfirmationEmail,
  createResendConfirmationEmail,
  createPasswordRecoveryEmail
} from './auth.ts';

// Admin Templates
export {
  createAdminWelcomeEmail
} from './admin.ts';

// Video Templates
export {
  createVideoSubmittedEmail,
  createVideoApprovedEmail,
  createVideoRejectedEmail
} from './video.ts';

// Benefits Templates
export {
  createBenefitInvitationEmail,
  createBenefitGiftCodeEmail
} from './benefits.ts';

// Daily Report Templates
export {
  createDailyReportEmail
} from './daily-report.ts';
export type { DailyReportEmailData } from './daily-report.ts';
