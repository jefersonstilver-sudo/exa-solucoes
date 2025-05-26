
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
  allBuildings: BuildingStore[];
  buildings: BuildingStore[];
  loading: boolean;
  isLoading: boolean;
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
  radius: 5000,
  neighborhood: '',
  venueType: [],
  priceRange: [0, 2000], // Aumentei o range máximo
  audienceMin: 0, // IMPORTANTE: 0 para não excluir prédios sem público definido
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
    console.log('🔄 [BUILDING STORE] Alterando filtros:', newFilters);
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
    // Aplicar filtros imediatamente após mudança
    setTimeout(() => get().applyFilters(), 0);
  },
  
  applyFilters: () => {
    const { allBuildings, filters } = get();
    console.log('🔍 [BUILDING STORE] Aplicando filtros em', allBuildings.length, 'prédios');
    console.log('🔍 [BUILDING STORE] Filtros atuais:', filters);
    
    const filteredBuildings = filterBuildings(allBuildings, filters);
    console.log('✅ [BUILDING STORE] Prédios após filtro:', filteredBuildings.length);
    
    set({ buildings: filteredBuildings });
  },
  
  fetchBuildings: async (lat?: number, lng?: number) => {
    try {
      console.log('🔄 [BUILDING STORE] Iniciando busca de prédios...');
      set({ loading: true, isLoading: true, error: null });
      
      const buildings = await fetchBuildingsForStore(lat, lng, get().filters.radius);
      console.log('📊 [BUILDING STORE] Prédios recebidos:', buildings.length);
      
      set({ 
        allBuildings: buildings as BuildingStore[],
        loading: false, 
        isLoading: false 
      });
      
      // Aplicar filtros aos novos dados
      get().applyFilters();
      
    } catch (error: any) {
      console.error('❌ [BUILDING STORE] Erro ao buscar prédios:', error);
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
      console.log('🔍 [BUILDING STORE] Buscando localização:', location);
      set({ isSearching: true });
      
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        console.warn('⚠️ [BUILDING STORE] Coordenadas não encontradas');
        set({ isSearching: false });
        return;
      }
      
      console.log('📍 [BUILDING STORE] Coordenadas encontradas:', coordinates);
      set({ 
        selectedLocation: coordinates,
        searchLocation: location
      });
      
      await get().fetchBuildings(coordinates.lat, coordinates.lng);
      
      set({ isSearching: false });
    } catch (error) {
      console.error("❌ [BUILDING STORE] Erro na busca:", error);
      set({ isSearching: false });
    }
  },
  
  handleClearLocation: () => {
    console.log('🧹 [BUILDING STORE] Limpando localização');
    set({ 
      selectedLocation: null,
      searchLocation: '',
      allBuildings: [],
      buildings: []
    });
  }
}));

export default useBuildingStore;
