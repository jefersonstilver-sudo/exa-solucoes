import { readAsaasAudit } from '@/services/asaasAuditService';
export class PaymentDuplicationMonitor {
  static async detectSuspiciousPayments() {
    const audit = await readAsaasAudit();
    return audit.charges.filter(c => audit.duplicateChargeIds.includes(c.asaas_id)).map(c => ({ pedido_id: c.pedido_id || '', client_id: c.customer_id || '', valor_total: c.value, status: c.status, created_at: c.created_at || '', payment_id: c.asaas_id, external_reference: c.external_reference || '', suspicious_reason: 'duplicate_provider_id' }));
  }
  static async revertSuspiciousPayment(_pedidoId: string, _reason?: string) { return { success: false, error: 'Reversão automática desativada; revise o ID oficial no Asaas' }; }
  static async monitorWebhookDuplicates() { await this.generateSecurityReport(); }
  static async generateSecurityReport() {
    const audit = await readAsaasAudit();
    const ids = audit.events.map(e => e.webhook_id);
    return { suspiciousPayments: await this.detectSuspiciousPayments(), duplicateWebhooks: ids.length - new Set(ids).size, controlledPayments: audit.charges.length, recommendations: ['Conciliação bancária não certificada; nenhuma baixa automática'] };
  }
}
export const paymentDuplicationMonitor = new PaymentDuplicationMonitor();
