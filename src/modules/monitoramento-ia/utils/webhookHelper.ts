/**
 * Webhook Helper Utilities
 * Funções para gerar URLs de webhook e tokens de verificação
 */

export const generateWebhookUrl = (agentId: string): string => {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aakenoljsycyrcrchgxj.supabase.co';
  return `${baseUrl}/functions/v1/webhook-manychat/${agentId}`;
};

export const generateVerifyToken = (): string => {
  return `verify_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
};
