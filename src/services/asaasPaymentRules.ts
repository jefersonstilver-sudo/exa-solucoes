export const isAsaasPaid = (status: unknown): boolean =>
  status === 'RECEIVED' || status === 'CONFIRMED';

export const requireAsaasPaymentId = (id: unknown): string => {
  if (typeof id !== 'string' || !id.startsWith('pay_')) {
    throw new Error('Cobrança Asaas sem identificador oficial de pagamento');
  }
  return id;
};