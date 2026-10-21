import { readAsaasAudit } from '@/services/asaasAuditService';
import { verifyAsaasOrder } from '@/services/asaasPaymentService';
const inspect = async (_timeRange = 24) => {
  try {
    const audit = await readAsaasAudit();
    return { success: true, findings: [`${audit.charges.length} cobranças Asaas`, `${audit.events.length} eventos oficiais`, `${audit.unmatched.length} cobranças sem evento identificado`], recommendations: ['Revisar IDs oficiais; conciliação bancária não certificada'], data: audit };
  } catch (e) { return { success: false, findings: [e instanceof Error ? e.message : 'Consulta indisponível'], recommendations: [] }; }
};
export const pixDebugUtils = {
  investigateLostPayments: inspect, testWebhookConnectivity: inspect, recoverOrphanPayments: inspect,
  async simulatePaymentConfirmation(pedidoId: string) {
    try { const data = await verifyAsaasOrder(pedidoId); return { success: true, findings: [data.payment_found ? `Status Asaas: ${data.payment_status}` : 'Sem cobrança vinculada'], recommendations: ['Simulações e baixas automáticas desativadas'], data }; }
    catch (e) { return { success: false, findings: [e instanceof Error ? e.message : 'Consulta indisponível'], recommendations: [] }; }
  }
};
