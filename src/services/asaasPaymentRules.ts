export const isAsaasPaid = (status: unknown): boolean =>
  status === 'RECEIVED' || status === 'CONFIRMED';

export const requireAsaasPaymentId = (id: unknown): string => {
  if (typeof id !== 'string' || !id.startsWith('pay_')) {
    throw new Error('Cobrança Asaas sem identificador oficial de pagamento');
  }
  return id;
};
/**
 * sofia_cobrancas registra a confirmação do Asaas como status 'PAID' + paid_at
 * (gravado pelo webhook/fluxo da Sofia). Aceita apenas o status oficial do
 * Asaas ou 'PAID' com data de pagamento registrada.
 */
export const isSofiaChargePaid = (status: unknown, paidAt?: unknown): boolean =>
  isAsaasPaid(status) || (status === 'PAID' && typeof paidAt === 'string' && paidAt.length > 0);
