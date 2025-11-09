// ============================================
// DADOS DE EXEMPLO PARA PREVIEW DE TEMPLATES
// ============================================

import type {
  ConfirmationEmailData,
  PasswordRecoveryEmailData,
  AdminWelcomeEmailData,
  VideoSubmittedEmailData,
  VideoApprovedEmailData,
  VideoRejectedEmailData,
  BenefitInvitationEmailData,
  BenefitGiftCodeEmailData,
} from '@/integrations/supabase/types';

export const emailTemplateSamples = {
  confirmation: {
    userName: 'João Silva',
    userEmail: 'joao.silva@example.com',
    confirmationUrl: 'https://examidia.com.br/confirmar-email?token=abc123xyz789'
  } as ConfirmationEmailData,

  resend_confirmation: {
    userName: 'Maria Santos',
    userEmail: 'maria.santos@example.com',
    confirmationUrl: 'https://examidia.com.br/confirmar-email?token=def456uvw012'
  } as ConfirmationEmailData,

  password_recovery: {
    userName: 'Pedro Oliveira',
    userEmail: 'pedro.oliveira@example.com',
    recoveryUrl: 'https://examidia.com.br/redefinir-senha?token=ghi789rst345'
  } as PasswordRecoveryEmailData,

  admin_welcome: {
    userName: 'Carlos Admin',
    userEmail: 'carlos.admin@examidia.com.br',
    nome: 'Carlos Admin',
    email: 'carlos.admin@examidia.com.br',
    role: 'admin' as const,
    password: 'TempSenha#2024',
    createdBy: 'Super Admin',
    loginUrl: 'https://examidia.com.br/login'
  } as AdminWelcomeEmailData,

  video_submitted: {
    userName: 'Ana Costa',
    userEmail: 'ana.costa@example.com',
    videoTitle: 'Promoção Black Friday 2024',
    orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  } as VideoSubmittedEmailData,

  video_approved: {
    userName: 'Roberto Fernandes',
    userEmail: 'roberto.fernandes@example.com',
    videoTitle: 'Lançamento Produto Premium',
    buildings: [
      'Edifício Central Plaza - Av. Paulista, 1000',
      'Condomínio Vila Moderna - Rua das Flores, 250',
      'Residencial Sunset - Av. Atlântica, 500'
    ],
    startDate: '15/12/2024',
    endDate: '15/01/2025',
    orderId: 'f1e2d3c4-b5a6-7890-cdef-ab9876543210'
  } as VideoApprovedEmailData,

  video_rejected: {
    userName: 'Juliana Pereira',
    userEmail: 'juliana.pereira@example.com',
    videoTitle: 'Campanha Verão 2025',
    rejectionReason: 'O vídeo apresenta qualidade de áudio abaixo do esperado, com ruídos de fundo que prejudicam a experiência. Além disso, a resolução está em 720p, sendo necessário no mínimo 1080p (Full HD) para aprovação. Por favor, ajuste estes pontos e reenvie.',
    orderId: 'g2h3i4j5-k6l7-8901-mnop-qr2345678901'
  } as VideoRejectedEmailData,

  benefit_invitation: {
    providerName: 'Lucas Martins',
    providerEmail: 'lucas.martins@example.com',
    presentLink: 'https://examidia.com.br/escolher-presente?token=xyz789abc123',
    activationPoint: 'Edifício Golden Tower - Brooklin, SP'
  } as BenefitInvitationEmailData,

  benefit_code: {
    providerName: 'Fernanda Lima',
    providerEmail: 'fernanda.lima@example.com',
    benefitChoice: 'netflix',
    giftCode: 'NF50-ABCD-1234-XYZW',
    deliveryType: 'code' as const,
    redemptionInstructions: '1. Acesse netflix.com/redeem\n2. Faça login ou crie uma conta\n3. Digite o código acima\n4. Aproveite 2 meses grátis!'
  } as BenefitGiftCodeEmailData,
};

export type EmailTemplateId = keyof typeof emailTemplateSamples;

export function getTemplateSample(templateId: EmailTemplateId) {
  return emailTemplateSamples[templateId] || null;
}
