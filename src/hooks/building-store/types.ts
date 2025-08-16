import { BuildingStore } from '@/services/buildingStoreService';

export interface BuildingFilters {
  radius: number;
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
}

export interface BuildingStoreState {
  // Dados dos prédios
  allBuildings: BuildingStore[];
  buildings: BuildingStore[];
  
  // Estados de loading
  isLoading: boolean;
  error: string | null;
  
  // Busca e localização
  searchLocation: string;
  selectedLocation: { lat: number; lng: number } | null;
  isSearching: boolean;
  
  // Localização da empresa do cliente
  businessLocation: { lat: number; lng: number } | null;
  businessAddress: string;
  
  // Filtros
  filters: BuildingFilters;
  disableFilters: boolean;
  
  // Estado de inicialização
  initialized: boolean;
  forceRefresh?: boolean; // NOVO: Para forçar refresh
  
  // Sincronização Card ↔ Mapa
  hoveredBuildingId?: string | null;
  selectedBuildingId?: string | null;
  setHoveredBuilding?: (id: string | null) => void;
  setSelectedBuildingId?: (id: string | null) => void;
  
  // Ações básicas
  setSearchLocation: (location: string) => void;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  toggleFilters: () => void;
  
  // Ações de busca
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  setBusinessLocation: (location: { lat: number; lng: number } | null, address?: string) => void;
  
  // Ações de dados
  initializeStore: () => Promise<void>;
  fetchBuildings: (lat?: number, lng?: number) => Promise<void>;
  
  // NOVOS: Métodos de refresh
  refreshBuildings: () => Promise<void>;
  forceReload: () => Promise<void>;
  
  // Ações de filtros
  applyFilters: () => void;
  resetFilters: () => void;
}
