
// Etapas do checkout
export const CHECKOUT_STEPS = {
  REVIEW: 0,
  PLAN: 1,
  COUPON: 2,
  PAYMENT: 3
};

// Planos disponíveis
export const PLANS = {
  1: {
    id: 1,
    name: '1 mês',
    description: 'Ideal para campanhas rápidas',
    months: 1,
    discount: 0,
    mostPopular: false
  },
  3: {
    id: 3,
    name: '3 meses',
    description: 'Período de média duração',
    months: 3,
    discount: 5,
    mostPopular: true
  },
  6: {
    id: 6,
    name: '6 meses',
    description: 'Semestral com desconto',
    months: 6,
    discount: 10,
    mostPopular: false
  },
  12: {
    id: 12,
    name: '12 meses',
    description: 'Melhor custo-benefício',
    months: 12,
    discount: 15,
    mostPopular: false
  }
};

// Configuração MercadoPago
export const MP_PUBLIC_KEY = 'TEST-c7666b6a-b135-4b17-9e3e-e9e0939353be';
export const MP_ACCESS_TOKEN = 'TEST-1284714739337536-091623-...'; // Truncado por segurança

// Constantes de duração
export const DAYS_IN_MONTH = 30;
