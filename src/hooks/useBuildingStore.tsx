
import { create } from 'zustand';
import { BuildingStore, fetchBuildingsForStore } from '@/services/buildingStoreService';
import { getLocationCoordinates } from '@/services/geocoding';
import { filterBuildings } from '@/services/buildingFilterService';

export interface BuildingFilters {
  radius: number;
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
}

interface BuildingStoreState {
  allBuildings: BuildingStore[]; // Todos os prédios sem filtro
  buildings: BuildingStore[]; // Prédios filtrados
  loading: boolean;
  isLoading: boolean; // Alias para compatibilidade
  error: string | null;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  filters: BuildingFilters;
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => void;
  fetchBuildings: (lat?: number, lng?: number) => Promise<void>;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  applyFilters: () => void;
}

const defaultFilters: BuildingFilters = {
  radius: 5000, // 5km
  neighborhood: '',
  venueType: [],
  priceRange: [0, 1000],
  audienceMin: 0,
  standardProfile: [],
  amenities: []
};

export const useBuildingStore = create<BuildingStoreState>((set, get) => ({
  allBuildings: [],
  buildings: [],
  loading: false,
  isLoading: false,
  error: null,
  searchLocation: '',
  selectedLocation: null,
  isSearching: false,
  filters: { ...defaultFilters },
  
  setSearchLocation: (location: string) => {
    set({ searchLocation: location });
  },
  
  handleFilterChange: (newFilters: Partial<BuildingFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Aplicar filtros imediatamente após mudança
    setTimeout(() => get().applyFilters(), 0);
  },
  
  applyFilters: () => {
    const { allBuildings, filters } = get();
    const filteredBuildings = filterBuildings(allBuildings, filters);
    set({ buildings: filteredBuildings });
  },
  
  fetchBuildings: async (lat?: number, lng?: number) => {
    try {
      set({ loading: true, isLoading: true, error: null });
      
      const buildings = await fetchBuildingsForStore(lat, lng, get().filters.radius);
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        loading: false, 
        isLoading: false 
      });
      
      // Aplicar filtros aos novos dados
      get().applyFilters();
      
    } catch (error: any) {
      console.error('Error fetching buildings:', error);
      set({ 
        error: error.message || 'Failed to fetch buildings', 
        loading: false, 
        isLoading: false 
      });
    }
  },
  
  handleSearch: async (location: string) => {
    if (!location.trim()) {
      return;
    }
    
    try {
      set({ isSearching: true });
      
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        set({ isSearching: false });
        return;
      }
      
      set({ 
        selectedLocation: coordinates,
        searchLocation: location
      });
      
      await get().fetchBuildings(coordinates.lat, coordinates.lng);
      
      set({ isSearching: false });
    } catch (error) {
      console.error("Error searching location:", error);
      set({ isSearching: false });
    }
  },
  
  handleClearLocation: () => {
    set({ 
      selectedLocation: null,
      searchLocation: '',
      allBuildings: [],
      buildings: []
    });
  }
}));

export default useBuildingStore;
