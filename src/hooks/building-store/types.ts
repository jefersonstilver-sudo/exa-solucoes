
import { BuildingStore } from '@/services/buildingStoreService';

export interface BuildingFilters {
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
}

export interface BuildingStoreState {
  allBuildings: BuildingStore[];
  buildings: BuildingStore[];
  // CORREÇÃO: Unificar em um único estado de loading
  isLoading: boolean;
  error: string | null;
  searchLocation: string;
  selectedLocation: { lat: number; lng: number } | null;
  isSearching: boolean;
  filters: BuildingFilters;
  disableFilters: boolean;
  initialized: boolean;
  
  // Actions
  initializeStore: () => Promise<void>;
  setSearchLocation: (location: string) => void;
  toggleFilters: () => void;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  fetchBuildings: (lat?: number, lng?: number) => Promise<void>;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  applyFilters: () => void;
}
