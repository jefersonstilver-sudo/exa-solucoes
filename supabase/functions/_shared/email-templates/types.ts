// ============================================
// TIPOS COMPARTILHADOS - EMAIL TEMPLATES
// ============================================

export interface EmailBaseData {
  userName: string;
  userEmail: string;
}

export interface ConfirmationEmailData extends EmailBaseData {
  confirmationUrl: string;
}

export interface PasswordRecoveryEmailData extends EmailBaseData {
  recoveryUrl: string;
}

export interface AdminWelcomeEmailData extends EmailBaseData {
  nome: string;
  email: string;
  role: 'super_admin' | 'admin' | 'admin_marketing' | 'admin_financeiro';
  password: string;
  createdBy: string;
  loginUrl: string;
}

export interface VideoSubmittedEmailData extends EmailBaseData {
  videoTitle: string;
  orderId: string;
}

export interface VideoApprovedEmailData extends EmailBaseData {
  videoTitle: string;
  buildings: string[];
  startDate: string;
  endDate: string;
  orderId: string;
}

export interface VideoRejectedEmailData extends EmailBaseData {
  videoTitle: string;
  rejectionReason: string;
  orderId: string;
}

export interface BenefitInvitationEmailData {
  providerName: string;
  providerEmail: string;
  presentLink: string;
  activationPoint?: string;
}

export interface BenefitGiftCodeEmailData {
  providerName: string;
  providerEmail: string;
  benefitChoice: string;
  giftCode: string;
  deliveryType?: 'code' | 'link';
  redemptionInstructions?: string;
}

export interface RoleInfo {
  name: string;
  icon: string;
  color: string;
  responsibilities: string[];
  firstSteps: string[];
  links: Array<{ label: string; url: string }>;
  permissions: Array<{ feature: string; access: boolean }>;
}
