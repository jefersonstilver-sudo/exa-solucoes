
// Mercado Pago Constants
export const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'TEST-60cd0291-4a81-49f8-bbec-0cf2c4b91a7e'; // Test public key

// Payment status
export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation'
}

// Payment type
export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TICKET = 'ticket',
  ACCOUNT_MONEY = 'account_money',
  DIGITAL_WALLET = 'digital_wallet',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  ATM = 'atm'
}

// Test credit cards
export const TEST_CREDIT_CARDS = [
  {
    name: "Mastercard aprovado",
    number: "5031 4332 1540 6351",
    cvv: "123",
    expiration: "11/25",
    status: PaymentStatus.APPROVED
  },
  {
    name: "Visa pendente",
    number: "4170 0688 1010 8020",
    cvv: "123",
    expiration: "11/25",
    status: PaymentStatus.PENDING
  },
  {
    name: "Visa recusado",
    number: "4509 9535 6623 3704",
    cvv: "123",
    expiration: "11/25",
    status: PaymentStatus.REJECTED
  }
];

// Webhook events
export const WEBHOOK_EVENTS = {
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  MERCHANT_ORDER_CREATED: 'merchant_order.created',
  MERCHANT_ORDER_UPDATED: 'merchant_order.updated'
};

// API endpoints
export const MP_API_ENDPOINTS = {
  CREATE_PREFERENCE: 'https://api.mercadopago.com/checkout/preferences',
  PAYMENT_DETAILS: 'https://api.mercadopago.com/v1/payments/'
};

// Return URLs
export const getReturnUrls = (baseUrl: string, pedidoId: string) => ({
  success: `${baseUrl}/pedido-confirmado?id=${pedidoId}&status=approved`,
  failure: `${baseUrl}/pedido-confirmado?id=${pedidoId}&status=rejected`,
  pending: `${baseUrl}/pedido-confirmado?id=${pedidoId}&status=pending`
});
