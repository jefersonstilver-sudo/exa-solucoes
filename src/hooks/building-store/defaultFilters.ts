
import { BuildingFilters } from './types';

// Filtros padrão mais permissivos para garantir que prédios apareçam
export const defaultFilters: BuildingFilters = {
  radius: 20000, // 20km
  neighborhood: '',
  venueType: [], // Vazio = todos os tipos
  priceRange: [0, 10000], // Range amplo (não aplicado no momento)
  audienceMin: 0, // Zero = sem restrição de público (desativado)
  standardProfile: [], // Vazio = todos os padrões (desativado)
  amenities: [] // Vazio = todas as amenities (desativado)
};
