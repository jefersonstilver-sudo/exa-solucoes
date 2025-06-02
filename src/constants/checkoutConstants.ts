
// Etapas do checkout (reordered to show PLAN first)
export const CHECKOUT_STEPS = {
  PLAN: 0,
  COUPON: 1,
  REVIEW: 2,
  PAYMENT: 3,
  UPLOAD: 4
};

// Planos disponíveis with updated structure - preços são calculados dinamicamente
export const PLANS = {
  1: {
    id: 1,
    name: 'Plano Básico',
    description: '1 mês',
    months: 1,
    discount: 0,
    mostPopular: false,
    extras: ['Flexibilidade total', 'Ideal para testes', 'Sem compromisso'],
    productionIncluded: false,
    additionalProduction: {
      available: true,
      price: 79.90
    },
    color: 'gray'
  },
  3: {
    id: 3,
    name: 'Plano Popular',
    description: '3 meses',
    months: 3,
    discount: 5,
    mostPopular: true,
    extras: ['Economize 5%', 'Maior visibilidade', 'Melhor custo-benefício'],
    productionIncluded: true,
    videosPerMonth: 1,
    color: 'green',
    tag: '🔥 Mais vendido'
  },
  6: {
    id: 6,
    name: 'Plano Profissional',
    description: '6 meses',
    months: 6,
    discount: 15,
    mostPopular: false,
    extras: ['Economize 15%', 'Presença contínua', 'Máximo alcance'],
    productionIncluded: true,
    videosPerMonth: 1,
    studioUse: true,
    color: 'purple',
    tag: '✨ Plano Recomendado'
  },
  12: {
    id: 12,
    name: 'Plano Empresarial',
    description: '12 meses',
    months: 12,
    discount: 35,
    mostPopular: false,
    extras: ['Economize 35%', 'Máxima economia', 'Presença anual garantida'],
    productionIncluded: true,
    videosPerMonth: 1,
    extendedDisplay: true,
    corporateBonus: true,
    color: 'blue',
    tag: '💎 Máxima Economia'
  }
};

// Configuração MercadoPago
export const MP_PUBLIC_KEY = 'TEST-c7666b6a-b135-4b17-9e3e-e9e0939353be';
export const MP_ACCESS_TOKEN = 'TEST-1284714739337536-091623-...'; // Truncado por segurança

// Constantes de duração
export const DAYS_IN_MONTH = 30;
