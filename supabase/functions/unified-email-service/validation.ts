import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Schema para ação de reenvio de email
export const resendSchema = z.object({
  action: z.literal('resend'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  user: z.any().optional(),
  email_data: z.any().optional(),
});

// Schema para recuperação de senha
export const recoverySchema = z.object({
  action: z.literal('recovery').optional(),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional(),
  user: z.object({
    email: z.string().email('Email inválido').max(255, 'Email muito longo'),
    user_metadata: z.record(z.any()).optional(),
  }).optional(),
  email_data: z.object({
    email_action_type: z.literal('recovery'),
    token_hash: z.string().min(1, 'Token obrigatório'),
  }),
});

// Schema para confirmação inicial (webhook)
export const signupSchema = z.object({
  action: z.string().optional(),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional(),
  user: z.object({
    email: z.string().email('Email inválido').max(255, 'Email muito longo'),
    user_metadata: z.record(z.any()).optional(),
  }),
  email_data: z.object({
    email_action_type: z.string(),
    token_hash: z.string().min(1, 'Token obrigatório'),
    access_token: z.string().optional(),
    confirmation_url: z.string().optional(),
  }),
});

// Validação unificada
export const validateEmailRequest = (body: any) => {
  // Detectar tipo de requisição
  if (body.action === 'resend') {
    return resendSchema.parse(body);
  }
  
  if (body.action === 'recovery' || body.email_data?.email_action_type === 'recovery') {
    return recoverySchema.parse(body);
  }
  
  // Default para signup/confirmation
  return signupSchema.parse(body);
};
