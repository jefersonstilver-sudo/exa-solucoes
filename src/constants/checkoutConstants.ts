
import { Plan } from '@/types/checkout';

export const CHECKOUT_STEPS = {
  PLAN: 0,      // Seleção de plano/período
  COUPON: 1,    // Código de cupom
  REVIEW: 2,    // Revisão do pedido
  PAYMENT: 3,   // Pagamento
  UPLOAD: 4     // Upload de material
};

export const PLANS: Record<number, Plan> = {
  1: {
    id: 1,
    name: '1 Mês',
    description: 'Ideal para campanhas pontuais',
    months: 1,
    discount: 0,
    mostPopular: false,
    extras: ['Suporte básico', 'Relatórios mensais'],
    color: 'bg-gray-100',
    tag: '',
    videosPerMonth: 4,
    productionIncluded: true,
    studioUse: false,
    additionalProduction: {
      available: true,
      price: 150
    }
  },
  3: {
    id: 3,
    name: '3 Meses',
    description: 'Perfeito para campanhas trimestrais',
    months: 3,
    discount: 10,
    mostPopular: true,
    extras: ['Suporte prioritário', 'Relatórios semanais', '10% de desconto'],
    color: 'bg-blue-100',
    tag: 'MAIS POPULAR',
    videosPerMonth: 4,
    productionIncluded: true,
    studioUse: true,
    additionalProduction: {
      available: true,
      price: 130
    }
  },
  6: {
    id: 6,
    name: '6 Meses',
    description: 'Ideal para campanhas semestrais',
    months: 6,
    discount: 15,
    mostPopular: false,
    extras: ['Suporte dedicado', 'Relatórios personalizados', '15% de desconto'],
    color: 'bg-green-100',
    tag: 'ECONOMIA',
    videosPerMonth: 6,
    productionIncluded: true,
    studioUse: true,
    additionalProduction: {
      available: true,
      price: 100
    }
  },
  12: {
    id: 12,
    name: '12 Meses',
    description: 'Máximo valor para campanhas anuais',
    months: 12,
    discount: 25,
    mostPopular: false,
    extras: ['Suporte VIP', 'Consultoria estratégica', '25% de desconto', 'Gestor dedicado'],
    color: 'bg-purple-100',
    tag: 'MÁXIMO VALOR',
    videosPerMonth: 8,
    productionIncluded: true,
    studioUse: true,
    additionalProduction: {
      available: true,
      price: 80
    }
  }
};
