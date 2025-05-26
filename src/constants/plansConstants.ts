
import { Plan } from '@/types/checkout';

export const PLANS_DATA: Record<number, Plan> = {
  1: {
    id: 1,
    name: "Plano Mensal",
    description: "Ideal para campanhas curtas",
    months: 1,
    discount: 0,
    mostPopular: false,
    pricePerMonth: 280,
    color: "gray",
    extras: [
      "Veiculação por 1 mês",
      "Relatório básico de visualizações",
      "Suporte via email"
    ],
    videosPerMonth: 1,
    productionIncluded: false,
    studioUse: false,
    additionalProduction: {
      available: true,
      price: 150
    }
  },
  3: {
    id: 3,
    name: "Plano Trimestral", 
    description: "Melhor custo-benefício",
    months: 3,
    discount: 10,
    mostPopular: true,
    pricePerMonth: 252,
    color: "green",
    extras: [
      "Veiculação por 3 meses",
      "10% de desconto",
      "Relatório detalhado",
      "Suporte prioritário",
      "1 alteração gratuita"
    ],
    videosPerMonth: 1,
    productionIncluded: false,
    studioUse: false
  },
  6: {
    id: 6,
    name: "Plano Semestral",
    description: "Máxima exposição",
    months: 6,
    discount: 20,
    mostPopular: false,
    pricePerMonth: 224,
    color: "purple",
    tag: "RECOMENDADO",
    extras: [
      "Veiculação por 6 meses",
      "20% de desconto",
      "Relatório completo",
      "Suporte dedicado",
      "3 alterações gratuitas",
      "Otimização de horários"
    ],
    videosPerMonth: 2,
    productionIncluded: true,
    studioUse: true
  },
  12: {
    id: 12,
    name: "Plano Anual",
    description: "Presença constante",
    months: 12,
    discount: 30,
    mostPopular: false,
    pricePerMonth: 196,
    color: "blue",
    extras: [
      "Veiculação por 12 meses",
      "30% de desconto",
      "Relatórios mensais",
      "Gerente de conta",
      "Alterações ilimitadas",
      "Análise de performance",
      "Produção de conteúdo inclusa"
    ],
    videosPerMonth: 4,
    productionIncluded: true,
    studioUse: true,
    corporateBonus: true
  }
};
