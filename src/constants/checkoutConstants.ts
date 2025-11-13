
// Etapas do checkout (reordered to show PLAN first)
export const CHECKOUT_STEPS = {
  PLAN: 0,
  COUPON: 1,
  REVIEW: 2,
  PAYMENT: 3,
  UPLOAD: 4
};

// CORREÇÃO: Planos com preços fixos corretos conforme especificação
export const PLANS = {
  1: {
    id: 1,
    name: 'Plano Básico',
    description: '1 mês',
    months: 1,
    discount: 0,
    pricePerMonth: 200, // R$ 200/mês
    mostPopular: false,
    extras: [
      'Flexibilidade total', 
      'Ideal para testes', 
      'Sem compromisso'
    ],
    productionIncluded: false,
    additionalProduction: {
      available: true,
      price: 79.90
    },
    color: 'gray'
  },
  3: {
    id: 3,
    name: 'Plano Trimestral',
    description: '3 meses',
    months: 3,
    discount: 20,
    pricePerMonth: 160, // R$ 160/mês (20% desconto)
    mostPopular: true,
    extras: [
      'Economize 20% (R$ 40/mês)',
      'Maior visibilidade',
      '🎥 1 vídeo horizontal lettering de 15s por mês',
      'Melhor custo-benefício'
    ],
    productionIncluded: true,
    videosPerMonth: 1,
    videoType: 'Vídeo horizontal lettering de 15 segundos',
    color: 'green',
    tag: '🔥 Mais Popular'
  },
  6: {
    id: 6,
    name: 'Plano Semestral',
    description: '6 meses',
    months: 6,
    discount: 30,
    pricePerMonth: 140, // R$ 140/mês
    mostPopular: false,
    extras: [
      'Economize 30% (R$ 60/mês)',
      'Presença contínua',
      '🎥 1 vídeo por mês',
      '🎬 1 aluguel GRÁTIS do estúdio avançado Indexa Mídia',
      'Máximo alcance'
    ],
    productionIncluded: true,
    videosPerMonth: 1,
    studioUse: true,
    studioBenefit: 'Aluguel grátis do estúdio avançado',
    color: 'purple',
    tag: '✨ Recomendado'
  },
  12: {
    id: 12,
    name: 'Plano Anual',
    description: '12 meses',
    months: 12,
    discount: 37.5,
    pricePerMonth: 125, // R$ 125/mês
    mostPopular: false,
    extras: [
      'Economize 37.5% (R$ 75/mês)',
      'Máxima economia',
      '🎥 1 vídeo por mês',
      '🎬 1 vídeo cinematográfico de até 1 minuto GRÁTIS',
      'Para usar nas redes sociais',
      'Presença anual garantida'
    ],
    productionIncluded: true,
    videosPerMonth: 1,
    extendedDisplay: true,
    corporateBonus: true,
    cinematicVideo: 'Vídeo cinematográfico de até 1 minuto para redes sociais',
    color: 'blue',
    tag: '💎 Máxima Economia'
  }
};

// Constantes de duração
export const DAYS_IN_MONTH = 30;

// CORREÇÃO: Preço base agora é usado apenas como referência, cálculos usam preços fixos
export const BASE_PRICE_PER_PANEL = 200;
