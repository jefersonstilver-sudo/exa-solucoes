// ============================================
// EXPORTAÇÕES CENTRALIZADAS - EMAIL TEMPLATES
// ============================================

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
