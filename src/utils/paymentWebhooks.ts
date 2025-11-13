
// Deprecated file - Webhook functionality moved to Stripe
// This file is kept for backward compatibility with existing imports
// All payment webhook logic now handled by stripe-webhook Edge Function

export type PixWebhookData = any;
export type PixWebhookResponse = any;

export const sendPixPaymentWebhook = async () => {
  throw new Error('PIX webhook deprecated - Use Stripe integration instead');
};

export const getUserInfo = async () => {
  throw new Error('getUserInfo deprecated - Use Stripe integration instead');
};
