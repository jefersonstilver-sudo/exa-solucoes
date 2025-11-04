import type { BenefitOption } from '@/types/providerBenefits';

export const benefitOptions: BenefitOption[] = [
  // Shopping
  {
    id: 'shopee',
    name: 'Shopee',
    subtitle: 'Milhões de produtos',
    icon: '🛍️',
    category: 'shopping',
  },
  {
    id: 'renner',
    name: 'Renner',
    subtitle: 'Moda feminina e masculina',
    icon: '👗',
    category: 'shopping',
  },
  {
    id: 'riachuelo',
    name: 'Riachuelo',
    subtitle: 'Estilo e conforto',
    icon: '👔',
    category: 'shopping',
  },
  {
    id: 'havaianas',
    name: 'Havaianas',
    subtitle: 'Os originais',
    icon: '🩴',
    category: 'shopping',
  },
  {
    id: 'arezzo',
    name: 'Arezzo',
    subtitle: 'Calçados e acessórios',
    icon: '👠',
    category: 'shopping',
  },
  {
    id: 'petz',
    name: 'Petz',
    subtitle: 'Tudo para seu pet',
    icon: '🐾',
    category: 'shopping',
  },

  // Food
  {
    id: 'cacau_show',
    name: 'Cacau Show',
    subtitle: 'Chocolates deliciosos',
    icon: '🍫',
    category: 'food',
  },
  {
    id: 'mcdonalds',
    name: "McDonald's",
    subtitle: 'Amo muito tudo isso',
    icon: '🍟',
    category: 'food',
  },
  {
    id: 'madero',
    name: 'Madero',
    subtitle: 'Hambúrgueres premium',
    icon: '🍔',
    category: 'food',
  },
  {
    id: 'jeronimo',
    name: 'Jeronimo',
    subtitle: 'Pizzas e lanches',
    icon: '🍕',
    category: 'food',
  },
  {
    id: 'ze_delivery',
    name: 'Zé Delivery',
    subtitle: 'Bebidas geladas',
    icon: '🍺',
    category: 'food',
  },

  // Transport
  {
    id: 'uber',
    name: 'Uber',
    subtitle: 'Viagens e entregas',
    icon: '🚗',
    category: 'transport',
  },

  // Entertainment
  {
    id: 'spotify',
    name: 'Spotify',
    subtitle: 'Música e podcasts',
    icon: '🎧',
    category: 'entertainment',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    subtitle: 'Séries e filmes',
    icon: '🎬',
    category: 'entertainment',
  },
];

export const categoryLabels: Record<string, string> = {
  shopping: '🛍️ Lojas e Plataformas',
  food: '🍔 Alimentação e Restaurantes',
  transport: '🚗 Transporte e Mobilidade',
  entertainment: '🎧 Música e Entretenimento',
};
