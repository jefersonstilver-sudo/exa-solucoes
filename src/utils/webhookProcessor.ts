import { readAsaasStatus, verifyAsaasOrder } from '@/services/asaasPaymentService';
export const webhookProcessor = {
  async processPaymentWebhook(payload: { payment?: { id?: string }; [key: string]: unknown }): Promise<boolean> {
    if (!payload.payment?.id) return false;
    return (await readAsaasStatus(payload.payment.id)).paid;
  },
  async simulateWebhookProcessing(pedidoId: string, _amount: number): Promise<void> {
    await verifyAsaasOrder(pedidoId); // Never simulate settlement or write a webhook from the browser.
  }
};
