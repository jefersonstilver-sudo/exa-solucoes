
import { BuildingFilters } from './types';

// Filtros padrão mais permissivos para garantir que prédios apareçam
export const defaultFilters: BuildingFilters = {
  radius: 50000, // 50km
  neighborhood: '',
  venueType: [], // Vazio = todos os tipos
  priceRange: [0, 10000], // Range amplo
  audienceMin: 0, // Zero = sem restrição de público
  standardProfile: [], // Vazio = todos os padrões
  amenities: [], // Vazio = todas as amenities
  sortBy: 'relevance' // Adicionar sortBy padrão
};

